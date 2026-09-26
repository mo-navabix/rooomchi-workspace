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
  | 'MANAGE_ORG_SETTINGS'
  | 'MANAGE_TEAMS';

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
  avatar?: string;
  avatarType?: 'custom' | 'gravatar' | 'preset' | 'initials' | 'google';
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  isProfileComplete?: boolean;
  isPermanentAdmin?: boolean;
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
  | 'access-control'
  | 'analytics'
  | 'admin-settings'
  | 'admin-support-tickets'
  | 'admin-notifications'
  | 'teams'
  | 'profile'
  | 'support-ticket'
  | 'provisioning';

export interface AccessControlConfig {
  googleAuthEnabled: boolean;
  googleAutoSignOut: boolean;
  allowedGoogleDomains: string[];
  emailPasswordAuthEnabled: boolean;
  selfRegistrationEnabled: boolean;
  requireApprovalAfterHours: boolean;
  guestBookingEnabled: boolean;
  employeeAnalyticsEnabled: boolean;
  allowParticipantModifications: boolean;
  sessionTimeoutMinutes: number;
  twoFactorAuthRequired: boolean;
}

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

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
}

export interface TeamMemberWithUser extends TeamMember {
  user?: {
    id: string;
    name: string;
    email: string;
    department?: string;
    jobTitle?: string;
    role?: UserRole;
    avatar?: string;
  };
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  members?: TeamMemberWithUser[];
}

export interface AppNotification {
  id: string;
  userId?: string;
  userEmail?: string;
  orgId?: string;
  title: string;
  message: string;
  bookingId?: string;
  roomName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  organizerName?: string;
  type: 'meeting_booked' | 'meeting_cancelled' | 'meeting_reminder' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface SmsNotificationConfig {
  enabled: boolean;
  provider: 'kavenegar' | 'magfa' | 'farazsms' | 'ghasedak' | 'custom';
  apiKey: string;
  lineNumber: string;
  managerPhone: string;
  notifyOrganizer: boolean;
  notifyParticipants: boolean;
  notifyRoomManager: boolean;
  templateNewBooking: string;
  templateApproval: string;
  templateCancellation: string;
  templateReminder: string;
}

export interface TelegramNotificationConfig {
  enabled: boolean;
  botToken: string;
  botUsername: string;
  targetChatId: string;
  channelType: 'channel' | 'group' | 'direct';
  sendRichButtons: boolean;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
}

export interface InAppNotificationConfig {
  enabled: boolean;
  soundEnabled: boolean;
  toastPopupEnabled: boolean;
  retentionDays: number;
}

export interface NotificationChannelRule {
  id: string;
  eventKey:
    | 'new_booking_request'
    | 'booking_approved'
    | 'booking_rejected'
    | 'booking_cancelled'
    | 'meeting_reminder_15m'
    | 'schedule_conflict'
    | 'daily_summary';
  titleFa: string;
  descriptionFa: string;
  inApp: boolean;
  sms: boolean;
  telegram: boolean;
  audience: 'organizer' | 'participants' | 'manager' | 'all';
}

export interface NotificationSettings {
  sms: SmsNotificationConfig;
  telegram: TelegramNotificationConfig;
  inApp: InAppNotificationConfig;
  rules: NotificationChannelRule[];
}

export interface NotificationLogEntry {
  id: string;
  channel: 'sms' | 'telegram' | 'in_app';
  recipient: string;
  title: string;
  preview: string;
  timestamp: string;
  status: 'delivered' | 'sent' | 'failed' | 'queued';
  eventType: string;
}

