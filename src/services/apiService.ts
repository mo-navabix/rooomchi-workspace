import { normalizeUserRole, normalizeUserStatus } from '../constants/rbac';
import { AppNotification, Booking, Organization, Room, Stats, User, UserRole, Team } from '../types';

const API_BASE = '/api';

function normalizeAuthUser(
  raw: User & { organizationId?: string; firstName?: string; lastName?: string },
): User {
  if (!raw) return raw;
  return {
    ...raw,
    orgId: raw.orgId || raw.organizationId || '',
    name: raw.name || [raw.firstName, raw.lastName].filter(Boolean).join(' '),
  };
}

function toClientUser(raw: User): User {
  return {
    ...raw,
    role: normalizeUserRole(raw.role),
    status: normalizeUserStatus(raw.status),
  };
}

function getAuthHeaders(contentJson = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('rooomchi_auth_token');
  if (token && token !== 'guest_token' && token !== 'session_token') {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export type SetupStatusResponse = {
  initialized: boolean;
  organizationCreated: boolean;
  adminCreated: boolean;
  completedAt: string | null;
};

export class ApiService {
  static async getSetupStatus(): Promise<SetupStatusResponse> {
    const res = await fetch(`${API_BASE}/setup/status`);
    if (!res.ok) throw new Error('خطا در بررسی وضعیت نصب');
    return res.json();
  }

  static async completeSetup(payload: Record<string, unknown>): Promise<{
    organization: Organization;
    accessToken: string;
    token: string;
    user: User;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/setup/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || body.error || 'خطا در تکمیل نصب');
    return body;
  }

  static async testSetupLdap(ldap: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/setup/test-ldap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ldap }),
    });
    return res.json() as Promise<{ ok: boolean; message: string }>;
  }

  static async testSetupGoogle(google: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/setup/test-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ google }),
    });
    return res.json() as Promise<{ ok: boolean; message: string }>;
  }

  static async testSetupSmtp(smtp: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/setup/test-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smtp }),
    });
    return res.json() as Promise<{ ok: boolean; message: string }>;
  }

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
    const token = localStorage.getItem('rooomchi_auth_token');
    const res = await fetch(`${API_BASE}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در راه‌اندازی سازمان' }));
      const message =
        err.message ||
        err.error ||
        (Array.isArray(err.message) ? err.message.join(', ') : null) ||
        'خطا در ثبت و راه‌اندازی سازمان';
      throw new Error(message);
    }
    const body = await res.json();
    if (body.organization) {
      return { ...body.organization, ...body } as Organization;
    }
    return body as Organization;
  }

  static async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
    const res = await fetch(`${API_BASE}/organizations/${id}`, {
      method: 'PATCH',
      headers: { ...getAuthHeaders(true), 'Content-Type': 'application/json' },
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
    /** `all` = entire org (admins + calendar); default = current user only */
    scope?: 'all' | 'mine';
  }): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (filters) {
      const { scope, ...rest } = filters;
      Object.entries(rest).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
      if (scope === 'all') {
        params.append('scope', 'all');
      }
    }
    const res = await fetch(`${API_BASE}/bookings?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
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
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      let message = 'خطا در لغو رزرو';
      try {
        const body = await res.json();
        if (body?.error) message = String(body.error);
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
  }

  // Analytics
  static async getStats(
    orgId?: string,
    options?: { scope?: 'all' | 'mine'; range?: 'week' | 'month' | 'quarter' },
  ): Promise<Stats> {
    const params = new URLSearchParams();
    if (orgId) params.set('orgId', orgId);
    if (options?.scope === 'all') params.set('scope', 'all');
    if (options?.range) params.set('range', options.range);
    const qs = params.toString();
    const res = await fetch(`${API_BASE}/stats${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('خطا در دریافت آمار');
    return res.json();
  }

  // --- Auth & RBAC ---
  static async getOrganizationAuthSettings(orgId: string): Promise<import('../types/orgAuth').OrganizationAuthSettingsPublic> {
    const res = await fetch(`${API_BASE}/organizations/${orgId}/auth-settings`);
    if (!res.ok) throw new Error('خطا در دریافت تنظیمات احراز هویت');
    return res.json();
  }

  static async getOrganizationAuthSettingsBySlug(slug: string) {
    const res = await fetch(`${API_BASE}/auth/organizations/${encodeURIComponent(slug)}/settings`);
    if (!res.ok) throw new Error('تنظیمات احراز هویت سازمان یافت نشد');
    return res.json() as Promise<{
      organization: { id: string; name: string; slug?: string };
    } & import('../types/orgAuth').OrganizationAuthSettingsPublic>;
  }

  static async updateOrganizationAuthSettings(
    orgId: string,
    payload: Record<string, unknown>,
  ): Promise<import('../types/orgAuth').OrganizationAuthSettingsPublic> {
    const res = await fetch(`${API_BASE}/organizations/${orgId}/auth-settings`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(true), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'خطا در ذخیره تنظیمات');
    }
    return res.json();
  }

  static async ldapLogin(payload: {
    username: string;
    password: string;
    organizationSlug?: string;
    organizationId?: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/ldap/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'ورود LDAP ناموفق');
    }
    const body = await res.json();
    const token = body.accessToken || body.token;
    const user = normalizeAuthUser(body.user);
    return { ...body, token, user, message: body.message };
  }

  static startGoogleOAuth(params: { organizationSlug?: string; organizationId?: string; redirectAfter?: string }) {
    const q = new URLSearchParams();
    if (params.organizationId) q.set('organizationId', params.organizationId);
    if (params.organizationSlug) q.set('organizationSlug', params.organizationSlug);
    if (params.redirectAfter) q.set('redirectAfter', params.redirectAfter);
    window.location.href = `${API_BASE}/auth/google/start?${q.toString()}`;
  }

  static async login(credentials: { email: string; password: string; organizationSlug?: string }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ورود به سامانه' }));
      throw new Error(err.message || err.error || 'اطلاعات کاربری نادرست است');
    }
    const body = await res.json();
    const token = body.accessToken || body.token;
    const user = normalizeAuthUser(body.user);
    return { ...body, token, user, message: body.message || 'ورود موفق' };
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
      const message =
        err.message ||
        err.error ||
        (Array.isArray(err.message) ? err.message.join(', ') : null) ||
        'خطا در ثبت‌نام';
      throw new Error(message);
    }
    const body = await res.json();
    const token = body.accessToken || body.token;
    const user = body.user
      ? {
          ...body.user,
          orgId: body.user.orgId || body.user.organizationId,
          name:
            body.user.name ||
            [body.user.firstName, body.user.lastName].filter(Boolean).join(' '),
        }
      : body.user;
    return { ...body, token, user, message: body.message || 'ثبت‌نام موفق' };
  }

  static async sendOtp(email: string): Promise<{ success: boolean; message: string; simulatedCode?: string }> {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ارسال کد تأیید' }));
      throw new Error(err.error || err.message || 'خطا در ارسال کد تأیید');
    }
    return res.json();
  }

  static async verifyOtp(
    email: string,
    code: string
  ): Promise<{
    token: string;
    accessToken?: string;
    user: User;
    isProfileComplete: boolean;
    isNewUser?: boolean;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'کد تأیید نامعتبر است' }));
      throw new Error(err.error || err.message || 'کد تأیید نامعتبر است');
    }
    const body = await res.json();
    const token = body.token || body.accessToken;
    const user: User = body.user
      ? {
          ...body.user,
          orgId: body.user.orgId || body.user.organizationId,
          name:
            body.user.name ||
            [body.user.firstName, body.user.lastName].filter(Boolean).join(' ') ||
            email.split('@')[0],
          isProfileComplete: body.isProfileComplete ?? body.user.isProfileComplete ?? false,
        }
      : body.user;
    return { ...body, token, user };
  }

  static async completeProfile(data: {
    name: string;
    phone: string;
    department?: string;
    jobTitle?: string;
    email?: string;
    userId?: string;
    password?: string;
  }): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/complete-profile`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ثبت مشخصات تکمیلی' }));
      throw new Error(err.error || err.message || 'خطا در ثبت مشخصات تکمیلی');
    }
    const body = await res.json();
    const user: User = {
      ...body.user,
      orgId: body.user.orgId || body.user.organizationId,
      name: body.user.name || [body.user.firstName, body.user.lastName].filter(Boolean).join(' '),
      isProfileComplete: true,
    };
    return { ...body, user };
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
    const res = await fetch(`${API_BASE}/users${params}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('خطا در دریافت لیست کاربران');
    const data = await res.json();
    return Array.isArray(data) ? data.map((u: User) => toClientUser(u)) : [];
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
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ایجاد کاربر' }));
      throw new Error(err.error || 'خطا در افزودن کاربر');
    }
    return toClientUser(await res.json());
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در تغییر نقش کاربر' }));
      throw new Error(err.error || err.message || 'خطا در تغییر نقش کاربر');
    }
    return toClientUser(await res.json());
  }

  static async updateUserStatus(userId: string, status: 'active' | 'suspended'): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در تغییر وضعیت کاربر' }));
      throw new Error(err.error || err.message || 'خطا در تغییر وضعیت کاربر');
    }
    return toClientUser(await res.json());
  }

  static async deleteUser(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در حذف کاربر' }));
      throw new Error(err.error || err.message || 'خطا در حذف کاربر');
    }
  }

  // ==========================================
  // TEAMS & GROUPS MANAGEMENT
  // ==========================================

  static async getTeams(orgId?: string): Promise<Team[]> {
    const url = orgId ? `${API_BASE}/teams?orgId=${encodeURIComponent(orgId)}` : `${API_BASE}/teams`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در دریافت لیست تیم‌ها' }));
      throw new Error(err.error || err.message || 'خطا در دریافت لیست تیم‌ها');
    }
    return res.json();
  }

  static async getTeam(id: string): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'تیم یافت نشد' }));
      throw new Error(err.error || err.message || 'تیم یافت نشد');
    }
    return res.json();
  }

  static async createTeam(data: {
    name: string;
    description?: string;
    memberIds?: string[];
    organizationId?: string;
  }): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ایجاد تیم' }));
      throw new Error(err.error || err.message || 'خطا در ایجاد تیم');
    }
    return res.json();
  }

  static async updateTeam(
    id: string,
    updates: { name?: string; description?: string },
  ): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در ویرایش تیم' }));
      throw new Error(err.error || err.message || 'خطا در ویرایش تیم');
    }
    return res.json();
  }

  static async deleteTeam(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/teams/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در حذف تیم' }));
      throw new Error(err.error || err.message || 'خطا در حذف تیم');
    }
  }

  static async addTeamMembers(id: string, userIds: string[]): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${id}/members`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ userIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در افزودن اعضا به تیم' }));
      throw new Error(err.error || err.message || 'خطا در افزودن اعضا به تیم');
    }
    return res.json();
  }

  static async removeTeamMember(id: string, userId: string): Promise<Team> {
    const res = await fetch(`${API_BASE}/teams/${id}/members/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'خطا در حذف کاربر از تیم' }));
      throw new Error(err.error || err.message || 'خطا در حذف کاربر از تیم');
    }
    return res.json();
  }

  // --- Enterprise admin settings ---
  private static adminFetch(path: string, init?: RequestInit) {
    return fetch(`${API_BASE}/admin/${path}`, {
      ...init,
      headers: { ...getAuthHeaders(true), ...(init?.headers as Record<string, string>) },
    });
  }

  static async getAdminOrganization() {
    const res = await ApiService.adminFetch('organization');
    if (!res.ok) throw new Error('خطا در بارگذاری تنظیمات سازمان');
    return res.json();
  }

  static async putAdminOrganization(payload: Record<string, unknown>) {
    const res = await ApiService.adminFetch('organization', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'خطا در ذخیره سازمان');
    }
    return res.json();
  }

  static async getAdminAuthSettings() {
    const res = await ApiService.adminFetch('auth-settings');
    if (!res.ok) throw new Error('خطا در بارگذاری احراز هویت');
    return res.json();
  }

  static async putAdminAuthSettings(payload: Record<string, unknown>) {
    const res = await ApiService.adminFetch('auth-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'خطا در ذخیره احراز هویت');
    }
    return res.json();
  }

  static async getAdminIntegrations() {
    const res = await ApiService.adminFetch('integrations');
    if (!res.ok) throw new Error('خطا در بارگذاری یکپارچه‌سازی‌ها');
    return res.json();
  }

  static async putAdminIntegrations(payload: Record<string, unknown>) {
    const res = await ApiService.adminFetch('integrations', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'خطا در ذخیره یکپارچه‌سازی');
    }
    return res.json();
  }

  static async getAdminSystemSettings() {
    const res = await ApiService.adminFetch('system-settings');
    if (!res.ok) throw new Error('خطا در بارگذاری تنظیمات سامانه');
    return res.json();
  }

  static async putAdminSystemSettings(payload: Record<string, unknown>) {
    const res = await ApiService.adminFetch('system-settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'خطا در ذخیره تنظیمات سامانه');
    }
    return res.json();
  }

  static async getAdminConfigAudit() {
    const res = await ApiService.adminFetch('config-audit');
    if (!res.ok) throw new Error('خطا در بارگذاری گزارش ممیزی');
    return res.json();
  }

  static async postAdminTest(path: string, body: Record<string, unknown>) {
    const res = await ApiService.adminFetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.json() as Promise<{ ok: boolean; message: string }>;
  }

  static async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  static async createNotification(
    item: Omit<AppNotification, 'id' | 'createdAt' | 'isRead' | 'userId'>,
  ): Promise<AppNotification | null> {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify(item),
    });
    if (!res.ok) return null;
    return res.json();
  }

  static async markNotificationRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  }

  static async markAllNotificationsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  }

  static async clearNotifications(): Promise<void> {
    await fetch(`${API_BASE}/notifications`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  }
}
