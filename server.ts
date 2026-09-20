import "dotenv/config";
import "reflect-metadata";
import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { JwtService } from "@nestjs/jwt";
import { checkDbStatus, getDbPool } from "./src/services/dbService";
import { isDatabaseConfigured } from "./src/config/database";
import { attachNestApiToExpress } from "./apps/api/src/nest-express";

const jwtService = new JwtService({
  secret: process.env.JWT_SECRET || "didar_enterprise_jwt_super_secret_key_2026",
});

interface Amenity {
  id: string;
  name: string;
  nameFa: string;
  icon: string;
}

interface Room {
  id: string;
  orgId: string;
  name: string;
  code: string;
  floor: number;
  building: string;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  status: "available" | "maintenance" | "inactive";
  color: string;
  hourlyRate?: number;
  requiresApproval?: boolean;
}

interface Booking {
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
  status: "confirmed" | "pending_approval" | "cancelled" | "completed";
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  code: string; // unique organization identifier
  domain?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;
  createdAt: string;
  updatedAt: string;
  // UI & portal configuration
  slug?: string;
  logo?: string;
  primaryColor?: string;
  plan?: "starter" | "business" | "enterprise";
  contactEmail?: string;
  buildings?: string[];
  departments?: string[];
  workHours?: {
    start: string;
    end: string;
  };
  settings?: {
    autoApprove: boolean;
    maxBookingHours: number;
    allowWeekend: boolean;
  };
}

interface User {
  id: string;
  organizationId: string;
  orgId?: string; // alias for compatibility
  employeeNumber: string;
  firstName: string;
  lastName: string;
  name?: string; // formatted full name
  email: string;
  password?: string;
  status: "ACTIVE" | "INACTIVE" | "INVITED" | "SUSPENDED" | "active" | "suspended";
  role: "SUPER_ADMIN" | "ORGANIZATION_ADMIN" | "MANAGER" | "EMPLOYEE" | "super_admin" | "org_admin" | "room_manager" | "employee";
  lastLoginAt?: string | null;
  lastLogin?: string; // alias
  createdAt: string;
  updatedAt?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  orgName?: string;
}

// Initial In-Memory Seed Data
let organizations: Organization[] = [
  {
    id: "org-1",
    name: "شرکت فناوری پیشرو (TechNova)",
    code: "TECHNOVA",
    domain: "technova.ir",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    slug: "technova",
    logo: "🏢",
    primaryColor: "#2563eb",
    plan: "enterprise",
    contactEmail: "admin@technova.ir",
    buildings: ["برج مرکزی سعادت‌آباد", "پردیس فناوری پردیس"],
    departments: ["تیم فنی و مهندسی", "مارکتینگ و رشد", "منابع انسانی", "محصول و طراحی", "مدیریت ارشد"],
    workHours: { start: "08:00", end: "20:00" },
    settings: {
      autoApprove: true,
      maxBookingHours: 4,
      allowWeekend: false,
    },
  },
  {
    id: "org-2",
    name: "هلدینگ سرمایه‌گذاری تابان (Taban Holding)",
    code: "TABAN",
    domain: "taban.group",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    slug: "taban-holding",
    logo: "🏛️",
    primaryColor: "#059669",
    plan: "business",
    contactEmail: "reservations@taban.group",
    buildings: ["ساختمان مرکزی جردن"],
    departments: ["سرمایه‌گذاری خطرپذیر", "مالی و حسابداری", "حقوقی و قراردادها", "روابط عمومی"],
    workHours: { start: "08:30", end: "18:00" },
    settings: {
      autoApprove: false,
      maxBookingHours: 3,
      allowWeekend: false,
    },
  },
];

let rooms: Room[] = [
  {
    id: "room-101",
    orgId: "org-1",
    name: "اتاق نوآوری البرز",
    code: "ALB-101",
    floor: 4,
    building: "برج مرکزی سعادت‌آباد",
    capacity: 12,
    amenities: ["projector", "smart_tv", "whiteboard", "videoconf", "wifi", "catering"],
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#3b82f6",
    requiresApproval: false,
  },
  {
    id: "room-102",
    orgId: "org-1",
    name: "تالار هیئت مدیره دماوند",
    code: "DAM-402",
    floor: 4,
    building: "برج مرکزی سعادت‌آباد",
    capacity: 24,
    amenities: ["projector", "smart_tv", "whiteboard", "videoconf", "wifi", "catering", "mic_system"],
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#8b5cf6",
    requiresApproval: true,
  },
  {
    id: "room-103",
    orgId: "org-1",
    name: "اتاق جلسات طوفان فکری کارون",
    code: "KAR-203",
    floor: 2,
    building: "برج مرکزی سعادت‌آباد",
    capacity: 6,
    amenities: ["smart_tv", "whiteboard", "wifi"],
    imageUrl: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#10b981",
    requiresApproval: false,
  },
  {
    id: "room-104",
    orgId: "org-1",
    name: "اتاق مصاحبه و پرایوت سبلان",
    code: "SAB-204",
    floor: 2,
    building: "برج مرکزی سعادت‌آباد",
    capacity: 4,
    amenities: ["whiteboard", "wifi", "videoconf"],
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#f59e0b",
    requiresApproval: false,
  },
  {
    id: "room-201",
    orgId: "org-2",
    name: "سالن کنفرانس سپهر",
    code: "SEP-10",
    floor: 1,
    building: "ساختمان مرکزی جردن",
    capacity: 18,
    amenities: ["projector", "videoconf", "catering", "wifi"],
    imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#059669",
    requiresApproval: true,
  },
  {
    id: "room-202",
    orgId: "org-2",
    name: "اتاق هم‌اندیشی پارس",
    code: "PAR-03",
    floor: 3,
    building: "ساختمان مرکزی جردن",
    capacity: 8,
    amenities: ["smart_tv", "whiteboard", "wifi"],
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    status: "available",
    color: "#0284c7",
    requiresApproval: false,
  },
];

// Today's date helper
const todayStr = new Date().toISOString().split("T")[0];

let bookings: Booking[] = [
  {
    id: "book-1",
    orgId: "org-1",
    roomId: "room-101",
    roomName: "اتاق نوآوری البرز",
    title: "جلسه هماهنگی اسپرینت ۲۴ و بازبینی معماری",
    description: "بررسی تسک‌های بک‌اند و هماهنگی استقرار سرورها",
    organizerName: "مهندس علیرضا راد",
    organizerEmail: "a.rad@technova.ir",
    department: "تیم فنی و مهندسی",
    date: todayStr,
    startTime: "10:00",
    endTime: "11:30",
    attendeesCount: 8,
    attendeeEmails: ["dev@technova.ir", "qa@technova.ir"],
    equipmentNeeded: ["projector", "whiteboard"],
    cateringNeeded: true,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "book-2",
    orgId: "org-1",
    roomId: "room-101",
    roomName: "اتاق نوآوری البرز",
    title: "ارائه نتایج کمپین نوروزی و برنامه‌ریزی فصلی",
    description: "تحلیل KPIهای جذب کاربر و بودجه‌ریزی سه‌ماهه دوم",
    organizerName: "سارا محمدی",
    organizerEmail: "s.mohammadi@technova.ir",
    department: "مارکتینگ و رشد",
    date: todayStr,
    startTime: "14:00",
    endTime: "15:30",
    attendeesCount: 10,
    attendeeEmails: ["mkt@technova.ir"],
    equipmentNeeded: ["smart_tv", "videoconf"],
    cateringNeeded: true,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "book-3",
    orgId: "org-1",
    roomId: "room-102",
    roomName: "تالار هیئت مدیره دماوند",
    title: "جلسه هیئت مدیره و گزارش مالی فصل گذشته",
    description: "بررسی گزارش حسابرسی و تصمیم‌گیری افزایش سرمایه",
    organizerName: "دکتر کاظمی",
    organizerEmail: "kazemi@technova.ir",
    department: "مدیریت ارشد",
    date: todayStr,
    startTime: "11:00",
    endTime: "13:00",
    attendeesCount: 15,
    attendeeEmails: ["board@technova.ir"],
    equipmentNeeded: ["projector", "catering", "mic_system"],
    cateringNeeded: true,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "book-4",
    orgId: "org-1",
    roomId: "room-104",
    roomName: "اتاق مصاحبه و پرایوت سبلان",
    title: "مصاحبه فنی ارشد React و Node.js",
    description: "ارزیابی فنی متقاضی استخدام موقعیت Senior Fullstack",
    organizerName: "پیمان صادقی",
    organizerEmail: "p.sadeghi@technova.ir",
    department: "منابع انسانی",
    date: todayStr,
    startTime: "16:00",
    endTime: "17:00",
    attendeesCount: 3,
    attendeeEmails: ["hr@technova.ir"],
    equipmentNeeded: ["videoconf"],
    cateringNeeded: false,
    status: "pending_approval",
    createdAt: new Date().toISOString(),
  },
];

let users: User[] = [
  {
    id: "user-super",
    organizationId: "org-1",
    orgId: "org-1",
    employeeNumber: "DIDAR-001",
    firstName: "مدیر ارشد",
    lastName: "دیدار",
    name: "مدیر ارشد سامانه دیدار",
    email: "admin@didar.ir",
    password: "password123",
    status: "ACTIVE",
    role: "SUPER_ADMIN",
    department: "مدیریت کل سیستم",
    jobTitle: "مدیر ارشد پلتفرم",
    phone: "09120000001",
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "user-org-admin",
    organizationId: "org-1",
    orgId: "org-1",
    employeeNumber: "TECH-101",
    firstName: "علیرضا",
    lastName: "راد",
    name: "مهندس علیرضا راد",
    email: "admin@technova.ir",
    password: "password123",
    status: "ACTIVE",
    role: "ORGANIZATION_ADMIN",
    department: "تیم فنی و مهندسی",
    jobTitle: "معاون فناوری و زیرساخت",
    phone: "09121112233",
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "user-facility",
    organizationId: "org-1",
    orgId: "org-1",
    employeeNumber: "TECH-202",
    firstName: "مریم",
    lastName: "کمالی",
    name: "مریم کمالی",
    email: "facility@technova.ir",
    password: "password123",
    status: "ACTIVE",
    role: "MANAGER",
    department: "امور اداری و تشریفات",
    jobTitle: "سرپرست خدمات و جلسات",
    phone: "09123334455",
    createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: "user-employee",
    organizationId: "org-1",
    orgId: "org-1",
    employeeNumber: "TECH-303",
    firstName: "علی",
    lastName: "احمدی",
    name: "علی احمدی",
    email: "employee@technova.ir",
    password: "password123",
    status: "ACTIVE",
    role: "EMPLOYEE",
    department: "مارکتینگ و رشد",
    jobTitle: "کارشناس ارشد دیجیتال مارکتینگ",
    phone: "09127778899",
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

// Helper to extract JWT user and enforce multi-tenant isolation
function extractJwtUser(req: Request): { userId: string; organizationId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  try {
    return jwtService.verify(token) as { userId: string; organizationId: string; role: string };
  } catch {
    return null;
  }
}

// In-memory verification codes for forgot password
const passwordResetCodes: Record<string, { code: string; expiresAt: number }> = {};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const useDatabase = isDatabaseConfigured();

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: useDatabase ? "postgresql" : "in-memory",
    });
  });

  // Check PostgreSQL Database Connection Status
  app.get("/api/db/status", async (req: Request, res: Response) => {
    const status = await checkDbStatus();
    res.json(status);
  });

  if (useDatabase) {
    getDbPool();
  } else {
    console.warn(
      "⚠️ No DATABASE_URL / DATABASE_HOST in .env — org/auth APIs use in-memory data",
    );
  }

  if (!useDatabase) {
  // --- Organizations APIs (in-memory only) ---
  app.get("/api/organizations", (req: Request, res: Response) => {
    res.json(organizations);
  });

  app.get("/api/organizations/:id", (req: Request, res: Response) => {
    const org = organizations.find((o) => o.id === req.params.id);
    if (!org) {
      return res.status(404).json({ error: "سازمان یافت نشد" });
    }
    res.json(org);
  });

  // Provision / Buy & Setup for New Organization
  const handleCreateOrganization = (req: Request, res: Response) => {
    const {
      name,
      code,
      domain,
      status,
      slug,
      logo,
      primaryColor,
      plan,
      contactEmail,
      buildings,
      departments,
      workHours,
      settings,
      initialRooms,
    } = req.body;

    if (!name || (!contactEmail && !code)) {
      return res.status(400).json({ error: "نام سازمان و شناسه/کد سازمان الزامی است" });
    }

    const normalizedCode = (code || slug || name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))
      .trim()
      .toUpperCase();

    if (organizations.some((o) => o.code === normalizedCode)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `An organization with code '${normalizedCode}' already exists`,
      });
    }

    const orgId = `org-${Date.now()}`;
    const newOrg: Organization = {
      id: orgId,
      name: name.trim(),
      code: normalizedCode,
      domain: domain || (contactEmail ? contactEmail.split("@")[1] : undefined),
      status: (status || "ACTIVE").toUpperCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      slug: slug || normalizedCode.toLowerCase(),
      logo: logo || "🏢",
      primaryColor: primaryColor || "#2563eb",
      plan: plan || "business",
      contactEmail: contactEmail || `admin@${domain || 'didar.ir'}`,
      buildings: buildings && buildings.length ? buildings : ["ساختمان مرکزی"],
      departments:
        departments && departments.length
          ? departments
          : ["فنی و مهندسی", "مارکتینگ", "منابع انسانی", "مدیریت", "مالی"],
      workHours: workHours || { start: "08:00", end: "19:00" },
      settings: settings || {
        autoApprove: true,
        maxBookingHours: 4,
        allowWeekend: false,
      },
    };

    organizations.push(newOrg);

    // If initial rooms were passed during setup, generate them
    if (Array.isArray(initialRooms) && initialRooms.length > 0) {
      initialRooms.forEach((r: Partial<Room>, index: number) => {
        rooms.push({
          id: `room-${Date.now()}-${index}`,
          orgId: orgId,
          name: r.name || `اتاق جلسات ${index + 1}`,
          code: r.code || `RM-${101 + index}`,
          floor: Number(r.floor) || 1,
          building: r.building || (newOrg.buildings && newOrg.buildings[0]) || "ساختمان مرکزی",
          capacity: Number(r.capacity) || 8,
          amenities: r.amenities || ["projector", "whiteboard", "wifi"],
          imageUrl:
            r.imageUrl ||
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
          status: "available",
          color: r.color || newOrg.primaryColor || "#2563eb",
          requiresApproval: !!r.requiresApproval,
        });
      });
    } else {
      // Default initial meeting rooms tailored for the new org
      const defaultBuilding = (newOrg.buildings && newOrg.buildings[0]) || "ساختمان مرکزی";
      const defaultColor = newOrg.primaryColor || "#2563eb";
      rooms.push(
        {
          id: `room-${Date.now()}-1`,
          orgId: orgId,
          name: "اتاق جلسات اصلی",
          code: "M-101",
          floor: 1,
          building: defaultBuilding,
          capacity: 10,
          amenities: ["projector", "whiteboard", "videoconf", "wifi"],
          imageUrl:
            "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
          status: "available",
          color: defaultColor,
          requiresApproval: false,
        },
        {
          id: `room-${Date.now()}-2`,
          orgId: orgId,
          name: "اتاق کنفرانس و ارائه",
          code: "C-201",
          floor: 2,
          building: defaultBuilding,
          capacity: 20,
          amenities: ["projector", "smart_tv", "whiteboard", "videoconf", "catering", "wifi"],
          imageUrl:
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
          status: "available",
          color: "#8b5cf6",
          requiresApproval: true,
        }
      );
    }

    res.status(201).json({
      message: "Organization created successfully",
      organization: newOrg,
      ...newOrg,
    });
  };

  app.post("/api/organizations", handleCreateOrganization);
  app.post("/organizations", handleCreateOrganization);

  // POST /organizations/:id/admin
  // Requirement: Create initial Organization Administrator
  const handleCreateOrgAdmin = (req: Request, res: Response) => {
    const orgId = req.params.id;
    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: `سازمانی با شناسه '${orgId}' یافت نشد`,
      });
    }

    const { firstName, lastName, email, password, employeeNumber, jobTitle, phone } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: "نام، نام خانوادگی، ایمیل و رمز عبور اولیه ادمین سازمان الزامی است",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `کاربری با ایمیل '${normalizedEmail}' قبلاً در سیستم ثبت شده است`,
      });
    }

    const newAdmin: User = {
      id: `usr-${Date.now()}`,
      orgId: org.id,
      organizationId: org.id,
      orgName: org.name,
      employeeNumber: employeeNumber || "ADM-001",
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: normalizedEmail,
      password: password.trim(),
      role: "ORGANIZATION_ADMIN",
      status: "ACTIVE",
      department: "مدیریت ارشد",
      jobTitle: jobTitle || "مدیر ارشد سازمان",
      phone: phone || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newAdmin);
    const { password: _, ...safeAdmin } = newAdmin;

    res.status(201).json({
      message: "مدیر ارشد سازمان با موفقیت ایجاد شد",
      admin: safeAdmin,
      user: safeAdmin,
    });
  };

  app.post("/api/organizations/:id/admin", handleCreateOrgAdmin);
  app.post("/organizations/:id/admin", handleCreateOrgAdmin);

  // Update Org Settings & Branding
  app.patch("/api/organizations/:id", (req: Request, res: Response) => {
    const index = organizations.findIndex((o) => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "سازمان یافت نشد" });
    }
    organizations[index] = {
      ...organizations[index],
      ...req.body,
    };
    res.json(organizations[index]);
  });

  } // end in-memory organizations

  // --- Rooms APIs ---
  app.get("/api/rooms", (req: Request, res: Response) => {
    const { orgId, capacity, amenity, floor, building, status } = req.query;
    let filtered = [...rooms];

    if (orgId) {
      filtered = filtered.filter((r) => r.orgId === orgId);
    }
    if (capacity) {
      filtered = filtered.filter((r) => r.capacity >= Number(capacity));
    }
    if (floor) {
      filtered = filtered.filter((r) => r.floor === Number(floor));
    }
    if (building) {
      filtered = filtered.filter((r) => r.building === building);
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }
    if (amenity) {
      filtered = filtered.filter((r) => r.amenities.includes(String(amenity)));
    }

    res.json(filtered);
  });

  app.post("/api/rooms", (req: Request, res: Response) => {
    const {
      orgId,
      name,
      code,
      floor,
      building,
      capacity,
      amenities,
      imageUrl,
      color,
      requiresApproval,
    } = req.body;

    if (!orgId || !name || !capacity) {
      return res.status(400).json({ error: "اطلاعات سازمان، نام اتاق و ظرفیت الزامی است" });
    }

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      orgId,
      name,
      code: code || `RM-${Math.floor(100 + Math.random() * 900)}`,
      floor: Number(floor) || 1,
      building: building || "ساختمان مرکزی",
      capacity: Number(capacity),
      amenities: amenities || ["wifi", "whiteboard"],
      imageUrl:
        imageUrl ||
        "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&auto=format&fit=crop&q=80",
      status: "available",
      color: color || "#3b82f6",
      requiresApproval: !!requiresApproval,
    };

    rooms.push(newRoom);
    res.status(201).json(newRoom);
  });

  app.put("/api/rooms/:id", (req: Request, res: Response) => {
    const index = rooms.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "اتاق پیدا نشد" });
    }

    rooms[index] = {
      ...rooms[index],
      ...req.body,
    };
    res.json(rooms[index]);
  });

  app.delete("/api/rooms/:id", (req: Request, res: Response) => {
    const index = rooms.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "اتاق پیدا نشد" });
    }
    // Also remove bookings
    bookings = bookings.filter((b) => b.roomId !== req.params.id);
    rooms.splice(index, 1);
    res.json({ success: true, message: "اتاق با موفقیت حذف شد" });
  });

  // --- Bookings APIs ---
  app.get("/api/bookings", (req: Request, res: Response) => {
    const { orgId, roomId, date, department, status } = req.query;
    let filtered = [...bookings];

    if (orgId) {
      filtered = filtered.filter((b) => b.orgId === orgId);
    }
    if (roomId) {
      filtered = filtered.filter((b) => b.roomId === roomId);
    }
    if (date) {
      filtered = filtered.filter((b) => b.date === date);
    }
    if (department) {
      filtered = filtered.filter((b) => b.department === department);
    }
    if (status) {
      filtered = filtered.filter((b) => b.status === status);
    }

    // Sort by date and startTime
    filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    res.json(filtered);
  });

  // Create booking with Conflict Engine
  app.post("/api/bookings", (req: Request, res: Response) => {
    const {
      orgId,
      roomId,
      title,
      description,
      organizerName,
      organizerEmail,
      department,
      date,
      startTime,
      endTime,
      attendeesCount,
      attendeeEmails,
      equipmentNeeded,
      cateringNeeded,
    } = req.body;

    if (!orgId || !roomId || !title || !organizerName || !date || !startTime || !endTime) {
      return res.status(400).json({ error: "تمام فیلدهای الزامی فرم را تکمیل فرمایید" });
    }

    // Find Room
    const room = rooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: "اتاق مورد نظر یافت نشد" });
    }

    if (room.status === "maintenance") {
      return res.status(400).json({ error: "این اتاق در حال حاضر در وضعیت تعمیرات یا غیرفعال است" });
    }

    // Conflict Check: Check if room is already booked for overlapping time on the same date
    const isConflict = bookings.some((b) => {
      if (b.roomId !== roomId || b.date !== date || b.status === "cancelled") {
        return false;
      }
      // Overlap condition: startA < endB && endA > startB
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (isConflict) {
      return res.status(409).json({
        error: "تداخل زمانی رخ داده است! این اتاق در بازه ساعتی انتخاب شده قبلاً رزرو شده است.",
      });
    }

    // Check organization approval policy
    const org = organizations.find((o) => o.id === orgId);
    let initialStatus: Booking["status"] = "confirmed";
    if (room.requiresApproval || (org?.settings && !org.settings.autoApprove)) {
      initialStatus = "pending_approval";
    }

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      orgId,
      roomId,
      roomName: room.name,
      title,
      description: description || "",
      organizerName,
      organizerEmail: organizerEmail || `${organizerName.replace(/\s+/g, ".")}@${org?.slug || "company"}.ir`,
      department: department || "عمومی",
      date,
      startTime,
      endTime,
      attendeesCount: Number(attendeesCount) || 2,
      attendeeEmails: Array.isArray(attendeeEmails) ? attendeeEmails : [],
      equipmentNeeded: Array.isArray(equipmentNeeded) ? equipmentNeeded : [],
      cateringNeeded: !!cateringNeeded,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    res.status(201).json(newBooking);
  });

  // Change booking status (confirm, cancel, approve)
  app.patch("/api/bookings/:id/status", (req: Request, res: Response) => {
    const { status } = req.body;
    const index = bookings.findIndex((b) => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    }

    if (!["confirmed", "pending_approval", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "وضعیت ارسالی نامعتبر است" });
    }

    bookings[index].status = status;
    res.json(bookings[index]);
  });

  app.delete("/api/bookings/:id", (req: Request, res: Response) => {
    const index = bookings.findIndex((b) => b.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    }
    bookings[index].status = "cancelled";
    res.json({ success: true, message: "رزرو با موفقیت لغو گردید", booking: bookings[index] });
  });

  // --- Analytics & Stats API ---
  app.get("/api/stats", (req: Request, res: Response) => {
    const { orgId } = req.query;
    const orgRooms = rooms.filter((r) => !orgId || r.orgId === orgId);
    const orgBookings = bookings.filter(
      (b) => (!orgId || b.orgId === orgId) && b.status !== "cancelled"
    );

    const todayBookings = orgBookings.filter((b) => b.date === todayStr);

    // Current hour
    const now = new Date();
    const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    // Active meetings right now
    const activeNow = todayBookings.filter(
      (b) => b.startTime <= currentHourStr && b.endTime >= currentHourStr
    );

    // Pending approvals
    const pendingApprovals = orgBookings.filter((b) => b.status === "pending_approval").length;

    // Room popularity
    const roomBookingCounts: Record<string, number> = {};
    orgBookings.forEach((b) => {
      roomBookingCounts[b.roomName] = (roomBookingCounts[b.roomName] || 0) + 1;
    });

    const popularRooms = Object.entries(roomBookingCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Department utilization
    const departmentCounts: Record<string, number> = {};
    orgBookings.forEach((b) => {
      departmentCounts[b.department] = (departmentCounts[b.department] || 0) + 1;
    });

    res.json({
      totalRooms: orgRooms.length,
      availableRoomsNow: Math.max(0, orgRooms.length - activeNow.length),
      activeMeetingsNow: activeNow.length,
      todayBookingsCount: todayBookings.length,
      pendingApprovals,
      totalHistoricalBookings: orgBookings.length,
      popularRooms,
      departmentStats: departmentCounts,
    });
  });

  // Nest mounts after rooms/bookings/stats so Express handles those paths first.
  if (useDatabase) {
    try {
      await attachNestApiToExpress(app);
      console.log("✅ PostgreSQL mode: org/auth/users APIs → NestJS + TypeORM (.env)");
    } catch (err) {
      console.error("❌ Failed to start NestJS with PostgreSQL:", err);
      process.exit(1);
    }
  }

  if (!useDatabase) {
  // ==========================================
  // --- AUTHENTICATION & RBAC APIS (in-memory) ---
  // ==========================================

  // Multi-Tenant Subdomain & Dual-Option Login:
  // Option 1: email + password (subdomain verified if present)
  // Option 2: employeeNumber + password (organization detected from subdomain)
  const handleLogin = (req: Request, res: Response) => {
    const { email, employeeNumber, organizationCode, organizationSlug, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "لطفاً رمز عبور را وارد کنید" });
    }

    // 1. Resolve organization from request Host (subdomain) or headers
    const host = (req.headers["x-forwarded-host"] as string) || req.headers["host"] || "";
    const cleanHost = host.split(":")[0].trim().toLowerCase();
    let detectedSlug: string | null = null;
    const reserved = new Set(["app", "api", "admin", "www", "mail", "localhost", "127.0.0.1", "didarhub"]);

    if (req.headers["x-organization-slug"]) {
      detectedSlug = String(req.headers["x-organization-slug"]).trim().toLowerCase();
    } else if (organizationSlug) {
      detectedSlug = organizationSlug.trim().toLowerCase();
    } else if (cleanHost.includes(".")) {
      const parts = cleanHost.split(".");
      if (parts.length >= 2 && !reserved.has(parts[0])) {
        detectedSlug = parts[0];
      }
    }

    let targetOrg: Organization | undefined;
    if (detectedSlug) {
      targetOrg = organizations.find(
        (o) => o.slug?.toLowerCase() === detectedSlug || o.code?.toLowerCase() === detectedSlug,
      );
    } else if (organizationCode) {
      targetOrg = organizations.find(
        (o) => o.code?.toUpperCase() === organizationCode.trim().toUpperCase(),
      );
    }

    let user: User | undefined;

    if (email) {
      // Option 1: Email + Password
      const normalizedEmail = email.trim().toLowerCase();
      user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          error: "Unauthorized",
          message: "کاربری با این ایمیل یافت نشد",
        });
      }

      // If accessed from an organization subdomain, verify that user belongs to it
      if (targetOrg && user.organizationId !== targetOrg.id && user.orgId !== targetOrg.id) {
        return res.status(401).json({
          statusCode: 401,
          error: "Unauthorized",
          message: `کاربر '${normalizedEmail}' متعلق به فضای سازمانی '${targetOrg.name}' نیست`,
        });
      }
    } else if (employeeNumber) {
      // Option 2: Employee Number + Password (requires tenant from subdomain)
      if (!targetOrg) {
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message:
            "ورود با شماره پرسنلی نیازمند ورود از طریق ساب‌دامین اختصاصی سازمان (مانند https://company.didarhub.ir/login) یا ارسال اسلاگ سازمان است",
        });
      }

      if (targetOrg.status !== "ACTIVE") {
        return res.status(403).json({
          statusCode: 403,
          error: "Forbidden",
          message: `سازمان '${targetOrg.name}' در وضعیت ${targetOrg.status} قرار دارد و دسترسی به آن مسدود است`,
        });
      }

      user = users.find(
        (u) =>
          u.employeeNumber?.trim().toLowerCase() === employeeNumber.trim().toLowerCase() &&
          (u.organizationId === targetOrg!.id || u.orgId === targetOrg!.id),
      );

      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          error: "Unauthorized",
          message: "شماره پرسنلی یا مشخصات وارد شده برای این سازمان معتبر نیست",
        });
      }
    } else {
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: "ورود نیازمند ایمیل یا شماره پرسنلی (با ساب‌دامین سازمانی) و رمز عبور است",
      });
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({
        statusCode: 401,
        error: "Unauthorized",
        message: "رمز عبور وارد شده نادرست است",
      });
    }

    if (user.status === "SUSPENDED" || user.status === "suspended") {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "حساب کاربری شما توسط مدیر سازمان معلق شده است",
      });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "حساب کاربری شما غیرفعال است. لطفاً با مدیر سازمان تماس بگیرید",
      });
    }

    // Update lastLoginAt
    const nowIso = new Date().toISOString();
    user.lastLoginAt = nowIso;
    user.lastLogin = nowIso;

    // JWT Payload containing: { userId, organizationId, role }
    const orgId = user.organizationId || user.orgId || "org-1";
    const role = (user.role || "EMPLOYEE").toString().toUpperCase();

    const token = jwtService.sign({
      userId: user.id,
      organizationId: orgId,
      role: role,
    });

    const { password: _, ...safeUser } = user;

    res.json({
      accessToken: token,
      token,
      tokenType: "Bearer",
      requiresPasswordChange: user.status === "INVITED",
      user: {
        ...safeUser,
        organizationId: orgId,
        role: role,
      },
      message: `خوش آمدید، ${user.firstName || user.name || user.email}`,
    });
  };

  app.post("/api/auth/login", handleLogin);
  app.post("/auth/login", handleLogin);

  // POST /auth/change-password
  // Change initial/temporary password
  const handleChangePassword = (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const caller = extractJwtUser(req);

    if (!caller) {
      return res.status(401).json({
        statusCode: 401,
        error: "Unauthorized",
        message: "برای تغییر رمز عبور، ورود به سامانه با توکن JWT الزامی است",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: "رمز عبور فعلی و رمز عبور جدید الزامی هستند",
      });
    }

    const user = users.find((u) => u.id === caller.userId);
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    if (user.password && user.password !== currentPassword) {
      return res.status(400).json({ error: "رمز عبور فعلی تطابق ندارد" });
    }

    user.password = newPassword.trim();
    user.status = "ACTIVE";
    user.updatedAt = new Date().toISOString();

    res.json({
      message: "رمز عبور با موفقیت تغییر کرد. می‌توانید با رمز عبور جدید وارد شوید",
    });
  };

  app.post("/api/auth/change-password", handleChangePassword);
  app.post("/auth/change-password", handleChangePassword);

  // POST /auth/register
  // Updated Requirement: Public registration is disabled.
  // Only Organization Administrator can create/invite employees.
  const handleRegisterDisabled = (req: Request, res: Response) => {
    res.status(403).json({
      statusCode: 403,
      error: "Forbidden",
      message:
        "ثبت‌نام عمومی در پلتفرم دیدار غیرفعال است. سازمان‌ها سامانه را خریداری کرده و مدیر سازمان (Organization Admin) کارکنان را از طریق مسیر POST /organizations/:id/users ایجاد و دعوت می‌کند.",
    });
  };

  app.post("/api/auth/register", handleRegisterDisabled);
  app.post("/auth/register", handleRegisterDisabled);

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "لطفاً آدرس ایمیل خود را وارد کنید" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: "کاربری با این آدرس ایمیل در پلتفرم دیدار ثبت نشده است" });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    passwordResetCodes[normalizedEmail] = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    };

    console.log(`[DIDAR-AUTH] Password reset code for ${normalizedEmail}: ${code}`);

    res.json({
      success: true,
      message: "کد تأیید ۶ رقمی بازنشانی رمز عبور به ایمیل شما ارسال شد",
      simulatedCode: code, // Provided for effortless in-preview testing
    });
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "ایمیل، کد تأیید و رمز عبور جدید الزامی است" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const stored = passwordResetCodes[normalizedEmail];

    if (!stored || stored.code !== code.trim()) {
      return res.status(400).json({ error: "کد تأیید وارد شده نامعتبر یا منقضی شده است" });
    }

    if (Date.now() > stored.expiresAt) {
      delete passwordResetCodes[normalizedEmail];
      return res.status(400).json({ error: "کد تأیید منقضی شده است. لطفاً مجدداً درخواست دهید" });
    }

    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    user.password = newPassword.trim();
    delete passwordResetCodes[normalizedEmail];

    res.json({
      success: true,
      message: "رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید",
    });
  });

  // --- Users & RBAC Management APIs ---

  // POST /organizations/:id/users (and /api/organizations/:id/users)
  // Flow Requirement: Organization Admin creates employees for their organization
  const handleCreateEmployee = (req: Request, res: Response) => {
    const orgId = req.params.id;
    const caller = extractJwtUser(req);

    // Multi-tenant service-level isolation
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== orgId) {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "نقض حریم چندمستأجری: شما فقط مجاز به تعریف کارمند برای سازمان خود هستید",
      });
    }

    const org = organizations.find((o) => o.id === orgId);
    if (!org) {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: `سازمانی با شناسه '${orgId}' یافت نشد`,
      });
    }

    const {
      employeeNumber,
      firstName,
      lastName,
      name,
      email,
      password,
      role,
      status,
      department,
      jobTitle,
      phone,
    } = req.body;

    if (!email || (!firstName && !name)) {
      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message: "نام، نام خانوادگی و ایمیل پرسنل الزامی است",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `کاربری با ایمیل '${normalizedEmail}' قبلاً در سیستم ثبت شده است`,
      });
    }

    const finalEmployeeNumber = (
      employeeNumber || `EMP-${Date.now().toString().slice(-4)}`
    ).trim();

    // Composite uniqueness: employeeNumber must be unique within this organization
    const existingEmpNum = users.find(
      (u) =>
        (u.organizationId === orgId || u.orgId === orgId) &&
        u.employeeNumber?.trim().toLowerCase() === finalEmployeeNumber.toLowerCase(),
    );
    if (existingEmpNum) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `شماره پرسنلی '${finalEmployeeNumber}' قبلاً در این سازمان ثبت شده است`,
      });
    }

    const finalFirstName = firstName || (name ? name.split(" ")[0] : "کاربر");
    const finalLastName =
      lastName || (name ? name.split(" ").slice(1).join(" ") : "پرسنل");
    const formattedName = name || `${finalFirstName} ${finalLastName}`.trim();

    const assignedRole = (role || "EMPLOYEE").toString().toUpperCase();

    const newUser: User = {
      id: `user-${Date.now()}`,
      organizationId: orgId,
      orgId: orgId,
      employeeNumber: finalEmployeeNumber,
      firstName: finalFirstName,
      lastName: finalLastName,
      name: formattedName,
      email: normalizedEmail,
      password: password || "password123",
      status: (status || "ACTIVE").toUpperCase(),
      role: assignedRole as any,
      department: department || (org.departments?.[0] || "عمومی"),
      jobTitle: jobTitle || "کارشناس",
      phone: phone || "",
      orgName: org.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLogin: undefined,
    };

    users.push(newUser);
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({
      message: "Employee created successfully",
      user: safeUser,
      ...safeUser,
    });
  };

  app.post("/api/organizations/:id/users", handleCreateEmployee);
  app.post("/organizations/:id/users", handleCreateEmployee);

  // GET /organizations/:id/users (and /api/organizations/:id/users)
  // Scoped strictly by organization ID
  const handleListEmployees = (req: Request, res: Response) => {
    const orgId = req.params.id;
    const caller = extractJwtUser(req);

    // Multi-tenant service-level isolation
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== orgId) {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "دسترسی غیرمجاز: داده‌های کارمندان سازمان دیگر قابل مشاهده نیست",
      });
    }

    const orgUsers = users.filter(
      (u) => u.organizationId === orgId || u.orgId === orgId,
    );

    const safeUsers = orgUsers.map(({ password, ...u }) => u);
    res.json(safeUsers);
  };

  app.get("/api/organizations/:id/users", handleListEmployees);
  app.get("/organizations/:id/users", handleListEmployees);

  // GET /api/users (General query with org filtering)
  app.get("/api/users", (req: Request, res: Response) => {
    const { orgId } = req.query;
    const caller = extractJwtUser(req);

    let filtered = users;
    if (orgId && orgId !== "all") {
      filtered = users.filter((u) => u.organizationId === orgId || u.orgId === orgId);
    } else if (caller && caller.role !== "SUPER_ADMIN") {
      // Auto-scope to caller's organization if not super admin
      filtered = users.filter(
        (u) => u.organizationId === caller.organizationId || u.orgId === caller.organizationId,
      );
    }

    const safeUsers = filtered.map(({ password, ...u }) => u);
    res.json(safeUsers);
  });

  // POST /api/users (Legacy add user redirected to organization scoping)
  app.post("/api/users", (req: Request, res: Response) => {
    const targetOrgId = req.body.orgId || req.body.organizationId || "org-1";
    req.params.id = targetOrgId;
    return handleCreateEmployee(req, res);
  });

  // PATCH /users/:id/role (and /api/users/:id/role)
  const handleUpdateRole = (req: Request, res: Response) => {
    const { role } = req.body;
    const caller = extractJwtUser(req);

    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    const targetOrgId = user.organizationId || user.orgId;
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== targetOrgId) {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "عدم دسترسی: تغییر نقش کارمند سازمان دیگر مجاز نیست",
      });
    }

    const normalizedRole = role.toString().toUpperCase();
    user.role = normalizedRole as any;
    user.updatedAt = new Date().toISOString();

    const { password: _, ...safeUser } = user;
    res.json({
      message: `Employee role updated to ${normalizedRole}`,
      user: safeUser,
      ...safeUser,
    });
  };

  app.patch("/api/users/:id/role", handleUpdateRole);
  app.patch("/users/:id/role", handleUpdateRole);

  // PATCH /users/:id/status (and /api/users/:id/status)
  // Enable / disable employee with multi-tenant isolation
  const handleUpdateStatus = (req: Request, res: Response) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "وضعیت (status) الزامی است" });
    }

    const caller = extractJwtUser(req);
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    const targetOrgId = user.organizationId || user.orgId;
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== targetOrgId) {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "عدم دسترسی: تغییر وضعیت کارمند سازمان دیگر مجاز نیست",
      });
    }

    const normalizedStatus = status.toString().toUpperCase();
    user.status = normalizedStatus as any;
    user.updatedAt = new Date().toISOString();

    const { password: _, ...safeUser } = user;
    res.json({
      message: `Employee status updated to ${normalizedStatus}`,
      user: safeUser,
      ...safeUser,
    });
  };

  app.patch("/api/users/:id/status", handleUpdateStatus);
  app.patch("/users/:id/status", handleUpdateStatus);

  // DELETE /api/users/:id
  app.delete("/api/users/:id", (req: Request, res: Response) => {
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    const deleted = users.splice(idx, 1)[0];
    res.json({ message: `کاربر ${deleted.name} حذف شد` });
  });

  } // end in-memory auth / users

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Meeting Room Server running on http://localhost:${PORT}`);
  });
}

startServer();
