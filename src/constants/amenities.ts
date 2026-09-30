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

const CUSTOM_AMENITIES_KEY = 'rooomchi_custom_amenities';

export const getStoredCustomAmenities = (): Amenity[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_AMENITIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading custom amenities from localStorage', e);
    return [];
  }
};

export const saveCustomAmenity = (newAmenity: Amenity): Amenity[] => {
  const current = getStoredCustomAmenities();
  // Check if already exists
  const existingIdx = current.findIndex((a) => a.id === newAmenity.id);
  let updated: Amenity[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newAmenity;
  } else {
    updated = [...current, newAmenity];
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_AMENITIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving custom amenity to localStorage', e);
    }
  }
  return updated;
};

export const getAllAmenitiesList = (): Amenity[] => {
  const custom = getStoredCustomAmenities();
  // Filter out any duplicates if id matches
  const customFiltered = custom.filter(
    (c) => !BASE_AMENITIES.some((b) => b.id === c.id)
  );
  return [...BASE_AMENITIES, ...customFiltered];
};

export const getAmenityById = (id: string): Amenity | undefined => {
  return getAllAmenitiesList().find((a) => a.id === id);
};

export const deleteCustomAmenity = (id: string): boolean => {
  if (!id.startsWith('custom_')) return false;
  const updated = getStoredCustomAmenities().filter((a) => a.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CUSTOM_AMENITIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting custom amenity', e);
      return false;
    }
  }
  return true;
};

export const isBaseAmenity = (id: string): boolean =>
  BASE_AMENITIES.some((b) => b.id === id);
