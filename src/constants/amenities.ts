import { Amenity } from '../types';

export const BASE_AMENITIES: Amenity[] = [
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

export const ALL_AMENITIES: Amenity[] = BASE_AMENITIES;

export const getAllAmenitiesList = (customAmenities: Amenity[] = []): Amenity[] => {
  const customFiltered = customAmenities.filter(
    (c) => !BASE_AMENITIES.some((b) => b.id === c.id),
  );
  return [...BASE_AMENITIES, ...customFiltered];
};

export const getAmenityById = (id: string, customAmenities: Amenity[] = []): Amenity | undefined => {
  return getAllAmenitiesList(customAmenities).find((a) => a.id === id);
};

export const isBaseAmenity = (id: string): boolean =>
  BASE_AMENITIES.some((b) => b.id === id);
