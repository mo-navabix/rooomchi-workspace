import { Booking, Organization, Room, Stats, User, UserRole } from '../types';

const API_BASE = '/api';

export class ApiService {
  // Organizations
  static async getOrganizations(): Promise<Organization[]> {
    const res = await fetch(`${API_BASE}/organizations`);
    if (!res.ok) throw new Error('خطا در دریافت لیست سازمان‌ها');
    return res.json();
  }

  static async getOrganization(id: string): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations/${id}`);
    if (!res.ok) throw new Error('خطا در دریافت اطلاعات سازمان');
    return res.json();
  }

  static async provisionOrganization(data: {
    name: string;
    slug?: string;
    logo?: string;
    primaryColor?: string;
    plan?: 'starter' | 'business' | 'enterprise';
    contactEmail: string;
    buildings?: string[];
    departments?: string[];
    workHours?: { start: string; end: string };
    settings?: { autoApprove: boolean; maxBookingHours: number; allowWeekend: boolean };
    initialRooms?: Partial<Room>[];
  }): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در راه‌اندازی سازمان' }));
      throw new Error(err.error || 'خطا در ثبت و راه‌اندازی سازمان');
    }
    return res.json();
  }

  static async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('خطا در بروزرسانی تنظیمات سازمان');
    return res.json();
  }

  // Rooms
  static async getRooms(filters?: {
    orgId?: string;
    capacity?: number;
    amenity?: string;
    floor?: number;
    building?: string;
    status?: string;
  }): Promise<Room[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const res = await fetch(`${API_BASE}/rooms?${params.toString()}`);
    if (!res.ok) throw new Error('خطا در دریافت لیست اتاق‌ها');
    return res.json();
  }

  static async createRoom(roomData: Partial<Room>): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ایجاد اتاق' }));
      throw new Error(err.error || 'خطا در ایجاد اتاق');
    }
    return res.json();
  }

  static async updateRoom(id: string, roomData: Partial<Room>): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    if (!res.ok) throw new Error('خطا در بروزرسانی مشخصات اتاق');
    return res.json();
  }

  static async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('خطا در حذف اتاق');
  }

  // Bookings
  static async getBookings(filters?: {
    orgId?: string;
    roomId?: string;
    date?: string;
    department?: string;
    status?: string;
  }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const res = await fetch(`${API_BASE}/bookings?${params.toString()}`);
    if (!res.ok) throw new Error('خطا در دریافت لیست رزروها');
    return res.json();
  }

  static async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ثبت رزرو' }));
      throw new Error(err.error || 'خطا در ثبت رزرو');
    }
    return res.json();
  }

  static async updateBookingStatus(id: string, status: Booking['status']): Promise<Booking> {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('خطا در تغییر وضعیت رزرو');
    return res.json();
  }

  static async cancelBooking(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('خطا در لغو رزرو');
  }

  // Analytics
  static async getStats(orgId?: string): Promise<Stats> {
    const params = orgId ? `?orgId=${orgId}` : '';
    const res = await fetch(`${API_BASE}/stats${params}`);
    if (!res.ok) throw new Error('خطا در دریافت آمار');
    return res.json();
  }

  // --- Auth & RBAC ---
  static async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ورود به سامانه' }));
      throw new Error(err.error || 'اطلاعات کاربری نادرست است');
    }
    return res.json();
  }

  static async register(data: {
    name: string;
    email: string;
    password: string;
    orgId?: string;
    department?: string;
    jobTitle?: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ثبت‌نام' }));
      throw new Error(err.error || 'خطا در ثبت‌نام');
    }
    return res.json();
  }

  static async forgotPassword(email: string): Promise<{ success: boolean; message: string; simulatedCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ارسال کد بازیابی' }));
      throw new Error(err.error || 'خطا در بازیابی رمز');
    }
    return res.json();
  }

  static async resetPassword(data: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در بازنشانی رمز عبور' }));
      throw new Error(err.error || 'کد نامعتبر یا منقضی شده است');
    }
    return res.json();
  }

  // --- User Management (RBAC) ---
  static async getUsers(orgId?: string): Promise<User[]> {
    const params = orgId ? `?orgId=${orgId}` : '';
    const res = await fetch(`${API_BASE}/users${params}`);
    if (!res.ok) throw new Error('خطا در دریافت لیست کاربران');
    return res.json();
  }

  static async createUser(data: {
    name: string;
    email: string;
    orgId: string;
    role: UserRole;
    department: string;
    jobTitle?: string;
    phone?: string;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ایجاد کاربر' }));
      throw new Error(err.error || 'خطا در افزودن کاربر');
    }
    return res.json();
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('خطا در تغییر نقش کاربر');
    return res.json();
  }

  static async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('خطا در تغییر وضعیت کاربر');
    return res.json();
  }

  static async deleteUser(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('خطا در حذف کاربر');
  }
}
