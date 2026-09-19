import { Amenity } from '../types';

export const ALL_AMENITIES: Amenity[] = [
  {
    id: 'projector',
    name: 'Projector 4K',
    nameFa: 'ویدئو پروژکتور 4K',
    icon: 'Projector',
    category: 'av',
  },
  {
    id: 'smart_tv',
    name: 'Smart Display / TV',
    nameFa: 'نمایشگر هوشمند ۶۵ اینچ',
    icon: 'Tv',
    category: 'av',
  },
  {
    id: 'videoconf',
    name: 'Video Conference System',
    nameFa: 'سیستم ویدیوکنفرانس (Meet / Zoom)',
    icon: 'Video',
    category: 'tech',
  },
  {
    id: 'mic_system',
    name: 'Conference Audio & Mic',
    nameFa: 'سیستم صوتی و میکروفن کنفرانس',
    icon: 'Mic',
    category: 'av',
  },
  {
    id: 'whiteboard',
    name: 'Smart Whiteboard',
    nameFa: 'وایت‌برد هوشمند / شیشه‌ای',
    icon: 'PenTool',
    category: 'facility',
  },
  {
    id: 'wifi',
    name: 'High-speed Wi-Fi 6',
    nameFa: 'اینترنت پرسرعت Wi-Fi 6',
    icon: 'Wifi',
    category: 'tech',
  },
  {
    id: 'catering',
    name: 'Coffee & Catering Service',
    nameFa: 'سرویس پذیرایی چای و قهوه',
    icon: 'Coffee',
    category: 'comfort',
  },
  {
    id: 'ac',
    name: 'Climate Control AC',
    nameFa: 'سیستم تهویه مطبوع هوشمند',
    icon: 'Wind',
    category: 'comfort',
  },
];

export const getAmenityById = (id: string): Amenity | undefined => {
  return ALL_AMENITIES.find((a) => a.id === id);
};
