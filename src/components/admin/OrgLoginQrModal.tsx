import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Organization } from '../../types';
import {
  X,
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileImage,
  Layers,
  Smartphone,
} from 'lucide-react';
import { OrgLogoBadge, isImageLogo } from '../common/OrgLogoBadge';

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('logo load failed'));
    img.src = src;
  });
}

/** Overlay organization logo in QR center (requires errorCorrectionLevel H). */
async function composeQrWithCenterLogo(
  qrDataUrl: string,
  logo: string | undefined,
  logoRatio = 0.22,
): Promise<string> {
  if (!logo?.trim()) return qrDataUrl;

  const qrImg = await loadImage(qrDataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = qrImg.width;
  canvas.height = qrImg.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrDataUrl;

  ctx.drawImage(qrImg, 0, 0);

  const inner = Math.round(canvas.width * logoRatio);
  const pad = Math.round(inner * 0.14);
  const box = inner + pad * 2;
  const x = (canvas.width - box) / 2;
  const y = (canvas.height - box) / 2;
  const radius = box * 0.16;

  roundRectPath(ctx, x, y, box, box, radius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = Math.max(2, canvas.width * 0.004);
  ctx.stroke();

  try {
    if (isImageLogo(logo)) {
      const logoImg = await loadImage(logo);
      ctx.save();
      roundRectPath(ctx, x + pad, y + pad, inner, inner, radius * 0.85);
      ctx.clip();
      ctx.drawImage(logoImg, x + pad, y + pad, inner, inner);
      ctx.restore();
    } else {
      ctx.font = `bold ${Math.round(inner * 0.55)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(logo.trim(), canvas.width / 2, canvas.height / 2);
    }
  } catch {
    return qrDataUrl;
  }

  return canvas.toDataURL('image/png');
}

interface OrgLoginQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrgLoginQrModal: React.FC<OrgLoginQrModalProps> = ({
  isOpen,
  onClose,
  organization,
  onShowToast,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>('#0F786E');
  const [templateType, setTemplateType] = useState<'stand' | 'poster' | 'badge'>('stand');
  const [customHeaderTitle, setCustomHeaderTitle] = useState<string>('ورود سریع به سامانه جلسات');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [qrDisplayUrl, setQrDisplayUrl] = useState<string>('');
  const [showLogoInQr, setShowLogoInQr] = useState<boolean>(true);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Build the target login URL for this specific organization
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rooomchi.ir';
  const orgIdentifier = organization?.slug || organization?.id || 'default';
  const loginUrl = `${origin}/login?org=${encodeURIComponent(orgIdentifier)}`;

  useEffect(() => {
    if (!isOpen || !organization) return;
    const orgColor = organization.primaryColor?.trim();
    if (orgColor && /^#[0-9A-Fa-f]{3,8}$/.test(orgColor)) {
      setSelectedColor(orgColor);
    }
  }, [isOpen, organization?.id, organization?.primaryColor]);

  useEffect(() => {
    if (!isOpen || !organization) return;

    setIsGenerating(true);
    // Generate PNG Data URL with high resolution
    QRCode.toDataURL(loginUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: selectedColor,
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR PNG', err);
      });

    // Generate SVG string
    QRCode.toString(loginUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: selectedColor,
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((svg) => {
        setQrSvg(svg);
      })
      .catch((err) => {
        console.error('Error generating QR SVG', err);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [isOpen, organization, loginUrl, selectedColor]);

  useEffect(() => {
    if (!qrDataUrl || !organization) {
      setQrDisplayUrl('');
      return;
    }
    let cancelled = false;
    (async () => {
      const composed =
        showLogoInQr && organization.logo
          ? await composeQrWithCenterLogo(qrDataUrl, organization.logo)
          : qrDataUrl;
      if (!cancelled) setQrDisplayUrl(composed);
    })();
    return () => {
      cancelled = true;
    };
  }, [qrDataUrl, showLogoInQr, organization?.logo]);

  if (!isOpen || !organization) return null;

  const qrForExport = qrDisplayUrl || qrDataUrl;
  const canShowLogoInQr = Boolean(organization.logo?.trim());

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      onShowToast?.('لینک اختصاصی ورود سازمان در حافظه کپی شد', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast?.('خطا در کپی کردن لینک', 'error');
    }
  };

  // Download high-res PNG poster card
  const handleDownloadPng = () => {
    if (!qrForExport) return;

    // Create a high-res canvas with complete organization branding card
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 1500;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      // Fallback: download pure QR
      const link = document.createElement('a');
      link.download = `QR-${organization.name}-Login.png`;
      link.href = qrForExport;
      link.click();
      return;
    }

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Decorative top border bar
    ctx.fillStyle = selectedColor;
    ctx.fillRect(0, 0, width, 24);

    // Header Background
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(40, 60, width - 80, 240);

    // Card Border
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 60, width - 80, height - 120);

    // Organization Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 48px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(organization.name, width / 2, 160);

    // Subtitle
    ctx.fillStyle = '#475569';
    ctx.font = '500 32px Vazirmatn, Tahoma, sans-serif';
    ctx.fillText(customHeaderTitle || 'ورود سریع به سامانه جلسات و اتاق‌ها', width / 2, 230);

    // Load QR Image onto Canvas
    const qrImg = new Image();
    qrImg.onload = () => {
      // Draw QR Code
      const qrSize = 750;
      const qrX = (width - qrSize) / 2;
      const qrY = 360;

      // QR white box with subtle shadow
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Instruction pill
      ctx.fillStyle = '#ECFDF5';
      ctx.fillRect(width / 2 - 380, 1180, 760, 80);
      ctx.strokeStyle = '#A7F3D0';
      ctx.lineWidth = 2;
      ctx.strokeRect(width / 2 - 380, 1180, 760, 80);

      ctx.fillStyle = '#065F46';
      ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('دوربین گوشی خود را روبه‌روی بارکد بگیرید تا مستقیم وارد شوید', width / 2, 1232);

      // URL display
      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 24px monospace, sans-serif';
      ctx.fillText(loginUrl, width / 2, 1320);

      // Footer
      ctx.fillStyle = '#64748B';
      ctx.font = '500 24px Vazirmatn, Tahoma, sans-serif';
      ctx.fillText('سامانه هوشمند رزرواسیون سالن‌ها و جلسات روم‌چی', width / 2, 1390);

      // Trigger download
      const fullCardData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR-Card-${organization.name}.png`;
      link.href = fullCardData;
      link.click();
      onShowToast?.('تصویر باکیفیت پوستر QR با موفقیت دانلود شد', 'success');
    };
    qrImg.src = qrForExport;
  };

  // Download vector SVG
  const handleDownloadSvg = () => {
    if (!qrSvg) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `QR-${organization.name}-Vector.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast?.('فایل وکتور SVG بارکد با موفقیت دانلود شد', 'success');
  };

  // Direct print via invisible iframe (safe for iframes and browser pop-up blockers)
  const handlePrint = () => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        onShowToast?.('خطا در دسترسی به فریم چاپ', 'error');
        return;
      }

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
          <head>
            <meta charset="utf-8">
            <title>چاپ بارکد ورود ${organization.name}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 1.2cm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Vazirmatn", Tahoma, sans-serif;
                direction: rtl;
                margin: 0;
                padding: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 90vh;
                background-color: #fff;
                color: #0f172a;
              }
              .card {
                border: 3px solid #e2e8f0;
                border-radius: 24px;
                padding: 36px 40px;
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
              }
              .header-bar {
                height: 8px;
                background-color: ${selectedColor};
                border-radius: 4px;
                margin-bottom: 24px;
              }
              .org-title {
                font-size: 26px;
                font-weight: 800;
                margin: 0 0 8px 0;
                color: #0f172a;
              }
              .subtitle {
                font-size: 15px;
                color: #64748b;
                margin: 0 0 24px 0;
              }
              .qr-wrapper {
                background: #fff;
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 20px;
                display: inline-block;
                margin-bottom: 20px;
              }
              .qr-wrapper img {
                width: 260px;
                height: 260px;
                display: block;
              }
              .instruction {
                background-color: #f0fdf4;
                border: 1px solid #bbf7d0;
                color: #166534;
                font-size: 13px;
                font-weight: 700;
                padding: 12px 18px;
                border-radius: 12px;
                margin-bottom: 14px;
              }
              .url-text {
                font-family: monospace;
                font-size: 11px;
                color: #94a3b8;
                direction: ltr;
                word-break: break-all;
                margin-bottom: 20px;
              }
              .footer {
                border-top: 1px solid #f1f5f9;
                padding-top: 14px;
                font-size: 12px;
                color: #64748b;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header-bar"></div>
              <h1 class="org-title">${organization.name}</h1>
              <p class="subtitle">${customHeaderTitle || 'ورود سریع به سامانه جلسات و اتاق‌ها'}</p>
              <div class="qr-wrapper">
                <img src="${qrForExport}" alt="QR Code" />
              </div>
              <div class="instruction">
                دوربین گوشی خود را روبه‌روی بارکد بگیرید تا مستقیم به صفحه ورود هدایت شوید.
              </div>
              <div class="url-text">${loginUrl}</div>
              <div class="footer">
                سامانه هوشمند مدیریت جلسات و سالن‌ها روم‌چی
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          onShowToast?.('دستور چاپ ارسال شد', 'info');
        } catch (err) {
          console.error('Print trigger error', err);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2500);
        }
      }, 350);
    } catch (e: any) {
      console.error(e);
      onShowToast?.('خطا در فراخوانی چاپگر', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-[#334155] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#334155] flex items-center justify-between bg-slate-50/80 dark:bg-[#0F172A]/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.2)] text-[var(--brand-primary)] dark:text-[var(--brand-primary-lighter)] flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  بارکد اختصاصی ورود به {organization.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[rgb(var(--brand-primary-rgb)/0.12)] dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] text-brand dark:text-[var(--brand-primary-on-dark)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)]">
                  QR ورود
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تولید، سفارشی‌سازی، چاپ و دریافت خروجی باکیفیت جهت استقرار در سازمان
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Top Options & Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color Theme */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                رنگ بارکد سازمانی
              </label>
              <div className="flex items-center gap-2">
                {[
                  { id: '#10B981', label: 'سبز روم‌چی' },
                  { id: '#0F786E', label: 'یشمی تیره' },
                  { id: '#0F172A', label: 'مشکی رسمی' },
                  { id: '#1E40AF', label: 'سرمه‌ای' },
                  { id: '#6D28D9', label: 'بنفش رویال' },
                ].map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${
                      selectedColor === c.id
                        ? 'border-slate-800 dark:border-white scale-110 shadow-xs'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.id }}
                    title={c.label}
                  >
                    {selectedColor === c.id && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Subtitle */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                عنوان پوستر / استند
              </label>
              <input
                type="text"
                value={customHeaderTitle}
                onChange={(e) => setCustomHeaderTitle(e.target.value)}
                placeholder="مثال: ورود سریع به سامانه جلسات"
                className="w-full text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:outline-hidden"
              />
            </div>
          </div>

          {canShowLogoInQr && (
            <label
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={showLogoInQr}
                onChange={(e) => setShowLogoInQr(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                نمایش لوگو سازمان در مرکز بارکد
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 ms-auto hidden sm:inline">
                (مناسب چاپ استند و پوستر)
              </span>
            </label>
          )}

          {/* QR Stand Preview Card (Target for visual preview and print layout) */}
          <div
            ref={printAreaRef}
            className="relative mx-auto max-w-sm rounded-2xl border-2 border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#1E293B] p-5 shadow-lg text-center space-y-3.5"
          >
            {/* Top Colored Strip */}
            <div
              className="h-2 w-full rounded-full transition-colors"
              style={{ backgroundColor: selectedColor }}
            />

            {/* Org Brand Header */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <OrgLogoBadge
                logo={organization.logo}
                name={organization.name}
                size="md"
              />
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                {organization.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {customHeaderTitle || 'ورود سریع به سامانه جلسات و اتاق‌ها'}
              </p>
            </div>

            {/* QR Box */}
            <div className="relative inline-flex p-3 rounded-2xl bg-white border border-slate-200/80 shadow-inner justify-center items-center">
              {isGenerating || (qrDataUrl && !qrDisplayUrl) ? (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  در حال ایجاد بارکد...
                </div>
              ) : qrForExport ? (
                <img
                  src={qrForExport}
                  alt={`QR Code for ${organization.name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : null}
            </div>

            {/* Instruction Badge */}
            <div className="bg-brand-soft dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] border border-brand-soft dark:border-[rgb(var(--brand-primary-rgb)/0.35)]/60 rounded-xl p-2.5 text-xs text-brand dark:text-[var(--brand-primary-on-dark)] font-semibold flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-brand dark:text-[var(--brand-primary-on-dark)] shrink-0" />
              <span>دوربین گوشی را مقابل بارکد بگیرید</span>
            </div>

            {/* Sub-text */}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>اتصال مستقیم و امن به درگاه سازمانی روم‌چی</span>
            </div>
          </div>

          {/* Direct Link Copier Bar */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                آدرس مستقیم:
              </span>
              <span
                className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate direction-ltr text-left select-all"
                dir="ltr"
              >
                {loginUrl}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span>کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>کپی لینک</span>
                  </>
                )}
              </button>

              <a
                href={loginUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>تست در تب جدید</span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#334155] bg-slate-50/70 dark:bg-[#0F172A]/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ مستقیم (استند / پوستر)</span>
            </button>

            {/* Download PNG Poster Card */}
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileImage className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>خروجی کارت (PNG)</span>
            </button>

            {/* Download Vector SVG */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>فایل وکتور (SVG)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
