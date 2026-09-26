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
  status: "available" | "maintenance" | "inactive" | "occupied" | string;
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
  date: string;
  startTime: string;
  endTime: string;
  attendeesCount: number;
  attendeeEmails: string[];
  equipmentNeeded: string[];
  cateringNeeded: boolean;
  status: "confirmed" | "pending_approval" | "cancelled" | "completed";
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  domain?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  logo?: string;
  primaryColor?: string;
  plan?: "starter" | "business" | "enterprise" | string;
  contactEmail?: string;
  buildings?: string[];
  departments?: string[];
  workHours?: { start: string; end: string };
  settings?: {
    autoApprove: boolean;
    maxBookingHours: number;
    allowWeekend: boolean;
  };
}

export interface User {
  id: string;
  organizationId: string;
  orgId?: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  password?: string;
  status: "ACTIVE" | "INACTIVE" | "INVITED" | "SUSPENDED" | "active" | "suspended" | string;
  role: string;
  lastLoginAt?: string | null;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  orgName?: string;
  isProfileComplete?: boolean;
  isPermanentAdmin?: boolean;
}

export interface TeamRecord {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberRecord {
  id: string;
  teamId: string;
  userId: string;
  createdAt: string;
}

export type VerificationPurpose = "login_otp" | "password_reset";
