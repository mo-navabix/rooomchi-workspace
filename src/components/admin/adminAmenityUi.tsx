import {
  Coffee,
  Cast,
  Laptop,
  Layers,
  Mic,
  Monitor,
  PenTool,
  Projector,
  Sparkles,
  Speaker,
  Tv,
  Video,
  Wifi,
  Wind,
} from 'lucide-react';

export const AMENITY_ICON_OPTIONS = [
  { id: 'Projector', label: 'پروژکتور', Icon: Projector },
  { id: 'Tv', label: 'نمایشگر', Icon: Tv },
  { id: 'Video', label: 'ویدیو/دوربین', Icon: Video },
  { id: 'Mic', label: 'میکروفن', Icon: Mic },
  { id: 'Speaker', label: 'اسپیکر', Icon: Speaker },
  { id: 'PenTool', label: 'وایت‌برد', Icon: PenTool },
  { id: 'Wifi', label: 'اینترنت', Icon: Wifi },
  { id: 'Monitor', label: 'مانیتور', Icon: Monitor },
  { id: 'Laptop', label: 'رایانه/لپ‌تاپ', Icon: Laptop },
  { id: 'Cast', label: 'اشتراک تصویر', Icon: Cast },
  { id: 'Coffee', label: 'پذیرایی', Icon: Coffee },
  { id: 'Wind', label: 'تهویه', Icon: Wind },
  { id: 'Sparkles', label: 'سایر/ویژه', Icon: Sparkles },
];

export const getAmenityIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Projector':
      return Projector;
    case 'Tv':
      return Tv;
    case 'Video':
      return Video;
    case 'Mic':
      return Mic;
    case 'Speaker':
      return Speaker;
    case 'PenTool':
      return PenTool;
    case 'Wifi':
      return Wifi;
    case 'Coffee':
      return Coffee;
    case 'Wind':
      return Wind;
    case 'Monitor':
      return Monitor;
    case 'Laptop':
      return Laptop;
    case 'Cast':
      return Cast;
    case 'Layers':
      return Layers;
    case 'Sparkles':
    default:
      return Sparkles;
  }
};

export const AMENITY_CATEGORY_LABELS: Record<string, string> = {
  av: 'صوتی و تصویری',
  tech: 'فناوری و شبکه',
  facility: 'تجهیزات و مبلمان',
  comfort: 'رفاهی و آسایش',
};
