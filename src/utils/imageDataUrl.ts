function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });
}

/** Logo upload: raster (resized) or SVG (kept as vector data URL). */
export async function fileToLogoDataUrl(file: File, maxDim = 400): Promise<string> {
  if (isSvgFile(file)) {
    if (file.size > 512 * 1024) {
      throw new Error('حجم SVG نباید بیشتر از ۵۱۲ کیلوبایت باشد.');
    }
    const text = await file.text();
    if (/<script[\s>]/i.test(text)) {
      throw new Error('فایل SVG حاوی اسکریپت مجاز نیست.');
    }
    return readFileAsDataUrl(file);
  }
  return fileToOptimizedDataUrl(file, maxDim);
}

/** Resize image and return data URL (for logos / room photos stored in DB). */
export async function fileToOptimizedDataUrl(
  file: File,
  maxDim = 512,
): Promise<string> {
  const rasterTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!rasterTypes.includes(file.type) && !isSvgFile(file)) {
    throw new Error('فرمت فایل نامعتبر است. JPG، PNG، WEBP یا SVG انتخاب کنید.');
  }
  if (isSvgFile(file)) {
    return fileToLogoDataUrl(file, maxDim);
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error('حجم فایل نباید بیشتر از ۴ مگابایت باشد.');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('خطا در پردازش تصویر'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png', 0.92));
    };
    img.onerror = () => reject(new Error('تصویر نامعتبر است'));
    img.src = rawDataUrl;
  });
}
