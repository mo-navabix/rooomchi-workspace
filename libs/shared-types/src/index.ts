export type UserRole = 'employee' | 'room_manager' | 'org_admin' | 'super_admin';

export type Permission =
  | 'MANAGE_ORGANIZATIONS'
  | 'MANAGE_ROOMS'
  | 'APPROVE_BOOKINGS'
  | 'CANCEL_ANY_BOOKING'
  | 'BOOK_ROOM'
  | 'MANAGE_USERS_ROLES'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_CATERING'
  | 'MANAGE_ORG_SETTINGS';

export interface User {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName?: string;
  role: UserRole;
  department: string;
  jobTitle?: string;
  phone?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'calendar'
  | 'rooms'
  | 'my-bookings'
  | 'admin-rooms'
  | 'admin-bookings'
  | 'admin-rbac'
  | 'analytics'
  | 'admin-settings'
  | 'admin-support-tickets'
  | 'profile'
  | 'support-ticket'
  | 'provisioning';

export interface Amenity {
  id: string;
  name: string;
  nameFa: string;
  icon: string;
  category: 'av' | 'tech' | 'comfort' | 'facility';
}

export interface Room {
  id: string;
  orgId: string;
  name: string;
  code: string;
  floor: number;
  building: string;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  status: 'available' | 'maintenance' | 'inactive';
  color: string;
  hourlyRate?: number;
  requiresApproval?: boolean;
}

export interface Booking {
  id: string;
  orgId: string;
  roomId: string;
  roomName: string;
  title: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  attendeesCount: number;
  attendeeEmails: string[];
  equipmentNeeded: string[];
  cateringNeeded: boolean;
  status: 'confirmed' | 'pending_approval' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string;
  primaryColor: string;
  plan: 'starter' | 'business' | 'enterprise';
  contactEmail: string;
  buildings: string[];
  departments: string[];
  workHours: {
    start: string;
    end: string;
  };
  settings: {
    autoApprove: boolean;
    maxBookingHours: number;
    allowWeekend: boolean;
  };
}

export interface Stats {
  totalRooms: number;
  availableRoomsNow: number;
  activeMeetingsNow: number;
  todayBookingsCount: number;
  pendingApprovals: number;
  totalHistoricalBookings: number;
  popularRooms: { name: string; count: number }[];
  departmentStats: Record<string, number>;
  // Extended Analytics
  utilizationRate?: number; // e.g. 86
  weeklyUsage?: { day: string; date: string; count: number; percentage: number }[];
  avgMeetingDurationMinutes?: number;
  topRoom?: { name: string; occupancyRate: number; bookingsCount: number };
  monthlyTrend?: { label: string; count: number }[];
}
