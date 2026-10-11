import type { Express, Request, Response } from "express";
import { checkDbStatus } from "../services/dbService";
import {
  extractJwtUser,
  resolveRequestOrgId,
  isBookingOrganizer,
  isProtectedAdmin,
  canManageTeams,
} from "./authHelpers";
import { asyncRoute, stripPassword } from "./http";
import type { Booking, Organization, Room, TeamRecord, User } from "./types";
import * as store from "./persistence/store";
import * as userNotifications from "./persistence/user-notifications.store";
import * as supportTickets from "./persistence/support-tickets.store";
import type { AppNotification } from "./types";
import { registerAuthRoutes } from "./auth/auth.routes";
import { registerSetupRoutes } from "./installation/setup.routes";
import { registerAdminRoutes } from "./admin/admin.routes";
import { registerEnterpriseRoutes } from "./enterprise/enterprise.routes";
import { normalizePasswordForStorage } from "./auth/password.service";
import { validateBookingTimes } from "../utils/bookingRules";

async function populateTeamResponse(team: TeamRecord) {
  const members = await store.getTeamMembersPopulated(team.id);
  const creatorUser = team.createdBy ? await store.getUserById(team.createdBy) : null;
  return {
    ...team,
    createdByName: creatorUser?.name || "مدیر سازمان",
    memberCount: members.length,
    members,
  };
}

async function healthPayload() {
  const db = await checkDbStatus();
  const database = db.connected ? "connected" : "disconnected";
  const status = db.connected ? "healthy" : "unhealthy";
  return { status, database, timestamp: new Date().toISOString() };
}

export function registerApiRoutes(app: Express): void {
  app.get("/health", asyncRoute(async (_req, res) => {
    const body = await healthPayload();
    res.status(body.status === "healthy" ? 200 : 503).json(body);
  }));

  app.get("/api/health", asyncRoute(async (_req, res) => {
    const body = await healthPayload();
    res.status(body.status === "healthy" ? 200 : 503).json(body);
  }));

  app.get("/api/db/status", asyncRoute(async (_req, res) => {
    res.json(await checkDbStatus());
  }));

  registerSetupRoutes(app);
  registerAdminRoutes(app);
  registerEnterpriseRoutes(app);

  app.get("/api/organizations", asyncRoute(async (_req, res) => {
    res.json(await store.listOrganizations());
  }));

  app.get("/api/organizations/:id", asyncRoute(async (req, res) => {
    const org = await store.getOrganizationById(req.params.id);
    if (!org) return res.status(404).json({ error: "سازمان یافت نشد" });
    res.json(org);
  }));

  const handleCreateOrganization = asyncRoute(async (req, res) => {
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

    if (await store.organizationCodeExists(normalizedCode)) {
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
      contactEmail: contactEmail || `admin@${domain || "rooomchi.ir"}`,
      buildings: buildings?.length ? buildings : ["ساختمان مرکزی"],
      departments: departments?.length
        ? departments
        : ["فنی و مهندسی", "مارکتینگ", "منابع انسانی", "مدیریت", "مالی"],
      workHours: workHours || { start: "08:00", end: "19:00" },
      settings: settings || { autoApprove: true, maxBookingHours: 4, allowWeekend: false },
    };

    await store.createOrganization(newOrg, Array.isArray(initialRooms) ? initialRooms : []);
    res.status(201).json({ message: "Organization created successfully", organization: newOrg, ...newOrg });
  });

  app.post("/api/organizations", handleCreateOrganization);
  app.post("/organizations", handleCreateOrganization);

  const handleCreateOrgAdmin = asyncRoute(async (req, res) => {
    const orgId = req.params.id;
    const org = await store.getOrganizationById(orgId);
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
    if (await store.emailExists(normalizedEmail)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `کاربری با ایمیل '${normalizedEmail}' قبلاً در سیستم ثبت شده است`,
      });
    }

    const newAdmin = await store.insertUser({
      id: `usr-${Date.now()}`,
      organizationId: org.id,
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
      orgName: org.name,
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: "مدیر ارشد سازمان با موفقیت ایجاد شد",
      admin: stripPassword(newAdmin),
      user: stripPassword(newAdmin),
    });
  });

  app.post("/api/organizations/:id/admin", handleCreateOrgAdmin);
  app.post("/organizations/:id/admin", handleCreateOrgAdmin);

  app.patch("/api/organizations/:id", asyncRoute(async (req, res) => {
    const updated = await store.patchOrganization(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "سازمان یافت نشد" });
    res.json(updated);
  }));

  app.get("/api/rooms", asyncRoute(async (req, res) => {
    const { orgId, capacity, amenity, floor, building, status } = req.query;
    const rooms = await store.listRooms({
      orgId: orgId ? String(orgId) : undefined,
      capacity: capacity ? Number(capacity) : undefined,
      floor: floor ? Number(floor) : undefined,
      building: building ? String(building) : undefined,
      status: status ? String(status) : undefined,
      amenity: amenity ? String(amenity) : undefined,
    });
    res.json(rooms);
  }));

  app.post("/api/rooms", asyncRoute(async (req, res) => {
    const { orgId, name, code, floor, building, capacity, amenities, imageUrl, color, requiresApproval } =
      req.body;
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
    await store.createRoom(newRoom);
    res.status(201).json(newRoom);
  }));

  app.put("/api/rooms/:id", asyncRoute(async (req, res) => {
    const updated = await store.updateRoom(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "اتاق پیدا نشد" });
    res.json(updated);
  }));

  app.delete("/api/rooms/:id", asyncRoute(async (req, res) => {
    const ok = await store.deleteRoom(req.params.id);
    if (!ok) return res.status(404).json({ error: "اتاق پیدا نشد" });
    res.json({ success: true, message: "اتاق با موفقیت حذف شد" });
  }));

  app.get("/api/bookings", asyncRoute(async (req, res) => {
    const { roomId, date, department, status, scope } = req.query;
    const jwtUser = extractJwtUser(req);
    const orgId = resolveRequestOrgId(jwtUser, req.query.orgId);
    const scopeAll = scope === "all" || scope === "org";

    let forUser: { id?: string; email?: string } | undefined;
    if (jwtUser && !scopeAll) {
      const dbUser = await store.getUserById(jwtUser.userId);
      forUser = {
        id: jwtUser.userId,
        email: dbUser?.email || undefined,
      };
    }
    if (!jwtUser) {
      return res.json([]);
    }

    const bookings = await store.listBookings({
      orgId,
      roomId: roomId ? String(roomId) : undefined,
      date: date ? String(date) : undefined,
      department: department ? String(department) : undefined,
      status: status ? String(status) : undefined,
      forUser,
    });
    res.json(bookings);
  }));

  app.post("/api/bookings", asyncRoute(async (req, res) => {
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

    if (organizerEmail) {
      const callerUser = await store.findUserByEmail(organizerEmail);
      if (callerUser && callerUser.isProfileComplete === false) {
        return res.status(403).json({
          statusCode: 403,
          error: "IncompleteProfile",
          requiresProfileCompletion: true,
          message:
            "ثبت‌نام شما هنوز کامل نشده است! برای رزرو اتاق و ثبت جلسات، ابتدا باید مشخصات تکمیلی خود را ثبت کنید.",
        });
      }
    }

    const room = await store.getRoomById(roomId);
    if (!room) return res.status(404).json({ error: "اتاق مورد نظر یافت نشد" });
    if (room.status === "maintenance") {
      return res.status(400).json({ error: "این اتاق در حال حاضر در وضعیت تعمیرات یا غیرفعال است" });
    }

    if (await store.hasBookingConflict(roomId, date, startTime, endTime)) {
      return res.status(409).json({
        error: "تداخل زمانی رخ داده است! این اتاق در بازه ساعتی انتخاب شده قبلاً رزرو شده است.",
      });
    }

    const org = await store.getOrganizationById(orgId);
    if (org) {
      const workStart = org.workHours?.start || "08:00";
      const workEnd = org.workHours?.end || "19:00";
      const maxH = org.settings?.maxBookingHours ?? 4;
      const rulesError = validateBookingTimes(
        String(startTime),
        String(endTime),
        workStart,
        workEnd,
        maxH,
      );
      if (rulesError) {
        return res.status(400).json({ error: rulesError });
      }
    }

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
      organizerEmail:
        organizerEmail ||
        `${organizerName.replace(/\s+/g, ".")}@${org?.slug || "company"}.ir`,
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

    const jwtUser = extractJwtUser(req);
    const organizerId = jwtUser?.userId ?? null;
    await store.createBooking(newBooking, {
      organizerId,
    });
    res.status(201).json({ ...newBooking, organizerId });
  }));

  app.patch("/api/bookings/:id/status", asyncRoute(async (req, res) => {
    const { status } = req.body;
    if (!["confirmed", "pending_approval", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "وضعیت ارسالی نامعتبر است" });
    }
    const updated = await store.updateBookingStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    res.json(updated);
  }));

  app.delete("/api/bookings/:id", asyncRoute(async (req, res) => {
    const jwtUser = extractJwtUser(req);
    if (!jwtUser) {
      return res.status(401).json({ error: "برای لغو رزرو باید وارد حساب شوید" });
    }
    const existing = await store.getBookingById(req.params.id);
    if (!existing) return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    const dbUser = await store.getUserById(jwtUser.userId);
    if (
      !isBookingOrganizer(existing, {
        userId: jwtUser.userId,
        email: dbUser?.email,
      })
    ) {
      return res.status(403).json({
        error: "فقط برگزارکننده جلسه می‌تواند این رزرو را لغو کند",
      });
    }
    const booking = await store.cancelBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    res.json({ success: true, message: "رزرو با موفقیت لغو گردید", booking });
  }));

  app.get("/api/stats", asyncRoute(async (req, res) => {
    const { scope, range } = req.query;
    const jwtUser = extractJwtUser(req);
    const orgId = resolveRequestOrgId(jwtUser, req.query.orgId);
    const scopeAll = scope === "all" || scope === "org";
    const rangeParam =
      range === "week" || range === "month" || range === "quarter"
        ? (range as "week" | "month" | "quarter")
        : undefined;

    if (!jwtUser) {
      return res.json(await store.getStatsData({ orgId, range: rangeParam }));
    }

    let forUser: { id?: string; email?: string } | undefined;
    if (!scopeAll) {
      const dbUser = await store.getUserById(jwtUser.userId);
      forUser = {
        id: jwtUser.userId,
        email: dbUser?.email || undefined,
      };
    }

    res.json(
      await store.getStatsData({
        orgId,
        forUser,
        range: rangeParam,
      }),
    );
  }));

  registerAuthRoutes(app);

  // --- Users ---
  async function createEmployeeHandler(req: Request, res: Response) {
    const orgId = req.params.id;
    const caller = extractJwtUser(req);
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== orgId) {
      return res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "نقض حریم چندمستأجری",
      });
    }
    const org = await store.getOrganizationById(orgId);
    if (!org) {
      return res.status(404).json({
        statusCode: 404,
        error: "Not Found",
        message: `سازمانی با شناسه '${orgId}' یافت نشد`,
      });
    }

    const { employeeNumber, firstName, lastName, name, email, password, role, status, department, jobTitle, phone } =
      req.body;
    if (!email || (!firstName && !name)) {
      return res.status(400).json({ statusCode: 400, error: "Bad Request", message: "نام و ایمیل الزامی است" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await store.emailExists(normalizedEmail)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `کاربری با ایمیل '${normalizedEmail}' قبلاً ثبت شده است`,
      });
    }
    const finalEmployeeNumber = (employeeNumber || `EMP-${Date.now().toString().slice(-4)}`).trim();
    if (await store.employeeNumberExistsInOrg(orgId, finalEmployeeNumber)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: `شماره پرسنلی '${finalEmployeeNumber}' قبلاً در این سازمان ثبت شده است`,
      });
    }
    const finalFirstName = firstName || (name ? name.split(" ")[0] : "کاربر");
    const finalLastName = lastName || (name ? name.split(" ").slice(1).join(" ") : "پرسنل");
    const formattedName = name || `${finalFirstName} ${finalLastName}`.trim();
    const assignedRole = (role || "EMPLOYEE").toString().toUpperCase();

    const plainPassword = password || (process.env.NODE_ENV === "production" ? "" : "password123");
    if (!plainPassword) {
      return res.status(400).json({ message: "رمز عبور الزامی است" });
    }
    const hashedPassword = await normalizePasswordForStorage(plainPassword);

    const newUser = await store.insertUser({
      id: `user-${Date.now()}`,
      organizationId: orgId,
      employeeNumber: finalEmployeeNumber,
      firstName: finalFirstName,
      lastName: finalLastName,
      name: formattedName,
      email: normalizedEmail,
      password: hashedPassword,
      status: (status || "ACTIVE").toUpperCase(),
      role: assignedRole,
      department: department || org.departments?.[0] || "عمومی",
      jobTitle: jobTitle || "کارشناس",
      phone: phone || "",
      orgName: org.name,
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
    });
    const safeUser = stripPassword(newUser);
    res.status(201).json({ message: "Employee created successfully", user: safeUser, ...safeUser });
  }

  const handleCreateEmployee = asyncRoute(createEmployeeHandler);

  app.post("/api/organizations/:id/users", handleCreateEmployee);
  app.post("/organizations/:id/users", handleCreateEmployee);

  const handleListEmployees = asyncRoute(async (req, res) => {
    const orgId = req.params.id;
    const caller = extractJwtUser(req);
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== orgId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "دسترسی غیرمجاز" });
    }
    const orgUsers = await store.listUsers({ orgId });
    res.json(orgUsers.map(stripPassword));
  });

  app.get("/api/organizations/:id/users", handleListEmployees);
  app.get("/organizations/:id/users", handleListEmployees);

  app.get("/api/users", asyncRoute(async (req, res) => {
    const { orgId } = req.query;
    const caller = extractJwtUser(req);
    let filtered;
    if (orgId && orgId !== "all") {
      filtered = await store.listUsers({ orgId: String(orgId) });
    } else if (caller && caller.role !== "SUPER_ADMIN") {
      filtered = await store.listUsers({ orgId: caller.organizationId });
    } else {
      filtered = await store.listUsers({});
    }
    res.json(filtered.map(stripPassword));
  }));

  app.post("/api/users", asyncRoute(async (req, res) => {
    req.params = { ...req.params, id: req.body.orgId || req.body.organizationId || "org-1" };
    await createEmployeeHandler(req, res);
  }));

  const handleUpdateRole = asyncRoute(async (req, res) => {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "نقش (role) الزامی است" });
    const caller = extractJwtUser(req);
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    if (isProtectedAdmin(user)) {
      return res.status(403).json({ statusCode: 403, error: "این کاربر قابل تغییر نقش نیست" });
    }
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== user.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const updated = await store.updateUser(user.id, { role: String(role) });
    const safeUser = stripPassword(updated!);
    res.json({ message: `Employee role updated to ${safeUser.role}`, user: safeUser, ...safeUser });
  });

  app.patch("/api/users/:id/role", handleUpdateRole);
  app.patch("/users/:id/role", handleUpdateRole);

  const handleUpdateStatus = asyncRoute(async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "وضعیت (status) الزامی است" });
    const caller = extractJwtUser(req);
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    const normalizedStatus = status.toString().toLowerCase() === "suspended" ? "SUSPENDED" : "ACTIVE";
    if (isProtectedAdmin(user) && normalizedStatus !== "ACTIVE") {
      return res.status(403).json({ statusCode: 403, error: "امکان تعلیق مدیران اصلی وجود ندارد" });
    }
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== user.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const updated = await store.updateUser(user.id, { status: normalizedStatus });
    const safeUser = stripPassword(updated!);
    res.json({ message: `Employee status updated to ${normalizedStatus}`, user: safeUser, ...safeUser });
  });

  app.patch("/api/users/:id/status", handleUpdateStatus);
  app.patch("/users/:id/status", handleUpdateStatus);

  const handleDeleteUser = asyncRoute(async (req, res) => {
    const user = await store.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    if (isProtectedAdmin(user)) {
      return res.status(403).json({
        statusCode: 403,
        error: "این کاربر از مدیران اصلی و دائمی سامانه است و قابل حذف نیست",
      });
    }
    const deleted = await store.deleteUser(req.params.id);
    res.json({ message: `کاربر ${deleted?.name} حذف شد` });
  });

  app.delete("/api/users/:id", handleDeleteUser);
  app.delete("/users/:id", handleDeleteUser);

  // --- Teams ---
  const handleGetTeams = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    let targetOrgId = req.query.orgId as string | undefined;
    if (!targetOrgId && caller) targetOrgId = caller.organizationId;
    if (!targetOrgId) {
      return res.json([]);
    }
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== targetOrgId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const orgTeams = await store.listTeams(targetOrgId);
    const populated = await Promise.all(orgTeams.map(populateTeamResponse));
    res.json(populated);
  });

  app.get("/api/teams", handleGetTeams);
  app.get("/teams", handleGetTeams);

  const handleGetTeamById = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const team = await store.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "تیم مورد نظر یافت نشد" });
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== team.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    res.json(await populateTeamResponse(team));
  });

  app.get("/api/teams/:id", handleGetTeamById);
  app.get("/teams/:id", handleGetTeamById);

  const handleCreateTeam = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const { name, description, organizationId, orgId, memberIds } = req.body;
    if (caller && !canManageTeams(caller.role)) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (!name?.trim()) return res.status(400).json({ error: "نام تیم الزامی است" });
    const targetOrgId = organizationId || orgId || caller?.organizationId || "org-1";
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== targetOrgId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (Array.isArray(memberIds)) {
      for (const uid of memberIds) {
        const u = await store.getUserById(uid);
        if (!u) return res.status(400).json({ error: `کاربر با شناسه ${uid} یافت نشد` });
        if (u.organizationId !== targetOrgId) {
          return res.status(400).json({ error: `کاربر ${u.name} متعلق به این سازمان نیست` });
        }
      }
    }
    const newTeam: TeamRecord = {
      id: `team-${Date.now()}`,
      organizationId: targetOrgId,
      name: name.trim(),
      description: description?.trim() || "",
      createdBy: caller?.userId || "user-org-admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.createTeam(newTeam, Array.isArray(memberIds) ? memberIds : []);
    res.status(201).json(await populateTeamResponse(newTeam));
  });

  app.post("/api/teams", handleCreateTeam);
  app.post("/teams", handleCreateTeam);

  const handleUpdateTeam = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const team = await store.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "تیم مورد نظر یافت نشد" });
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== team.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (caller && !canManageTeams(caller.role)) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const { name, description } = req.body;
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: "نام تیم نمی‌تواند خالی باشد" });
    }
    const updated = await store.updateTeam(req.params.id, {
      name: name?.trim(),
      description: description?.trim(),
    });
    res.json(await populateTeamResponse(updated!));
  });

  app.patch("/api/teams/:id", handleUpdateTeam);
  app.patch("/teams/:id", handleUpdateTeam);

  const handleDeleteTeam = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const team = await store.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "تیم مورد نظر یافت نشد" });
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== team.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (caller && !canManageTeams(caller.role)) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    await store.deleteTeam(team.id);
    res.json({ success: true, message: `تیم «${team.name}» با موفقیت حذف شد` });
  });

  app.delete("/api/teams/:id", handleDeleteTeam);
  app.delete("/teams/:id", handleDeleteTeam);

  const handleAddTeamMembers = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const team = await store.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "تیم مورد نظر یافت نشد" });
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== team.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (caller && !canManageTeams(caller.role)) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "لیست شناسه‌های کاربری (userIds) الزامی است" });
    }
    for (const uid of userIds) {
      const u = await store.getUserById(uid);
      if (!u) return res.status(400).json({ error: `کاربر با شناسه ${uid} یافت نشد` });
      if (u.organizationId !== team.organizationId) {
        return res.status(400).json({ error: `کاربر ${u.name} متعلق به این سازمان نمی‌باشد` });
      }
    }
    await store.addTeamMembers(team.id, userIds);
    res.json(await populateTeamResponse(team));
  });

  app.post("/api/teams/:id/members", handleAddTeamMembers);
  app.post("/teams/:id/members", handleAddTeamMembers);

  const handleRemoveTeamMember = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const team = await store.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ error: "تیم مورد نظر یافت نشد" });
    if (caller && caller.role !== "SUPER_ADMIN" && caller.organizationId !== team.organizationId) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    if (caller && !canManageTeams(caller.role)) {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "عدم دسترسی" });
    }
    const removed = await store.removeTeamMember(team.id, req.params.userId);
    if (!removed) return res.status(404).json({ error: "عضو مورد نظر در این تیم یافت نشد" });
    res.json(await populateTeamResponse(team));
  });

  app.delete("/api/teams/:id/members/:userId", handleRemoveTeamMember);
  app.delete("/teams/:id/members/:userId", handleRemoveTeamMember);

  // --- In-app notifications ---
  app.get("/api/notifications", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId) {
      return res.status(401).json({ error: "ورود الزامی است" });
    }
    const items = await userNotifications.listUserNotifications(caller.userId);
    res.json(items);
  }));

  app.post("/api/notifications", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId) {
      return res.status(401).json({ error: "ورود الزامی است" });
    }
    const body = req.body as Partial<AppNotification>;
    if (!body.title || !body.message || !body.type) {
      return res.status(400).json({ error: "title، message و type الزامی است" });
    }
    const created = await userNotifications.insertUserNotification(caller.userId, {
      orgId: body.orgId || caller.organizationId,
      title: String(body.title),
      message: String(body.message),
      type: body.type,
      bookingId: body.bookingId,
      roomName: body.roomName,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      organizerName: body.organizerName,
      userEmail: body.userEmail,
    });
    res.status(201).json(created);
  }));

  app.patch("/api/notifications/read-all", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId) return res.status(401).json({ error: "ورود الزامی است" });
    await userNotifications.markAllUserNotificationsRead(caller.userId);
    res.json({ ok: true });
  }));

  app.patch("/api/notifications/:id/read", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId) return res.status(401).json({ error: "ورود الزامی است" });
    await userNotifications.markUserNotificationRead(caller.userId, req.params.id);
    res.json({ ok: true });
  }));

  app.delete("/api/notifications", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId) return res.status(401).json({ error: "ورود الزامی است" });
    await userNotifications.clearUserNotifications(caller.userId);
    res.json({ ok: true });
  }));

  function isOrgAdminRole(role: string): boolean {
    const r = role.toUpperCase();
    return r === "SUPER_ADMIN" || r === "ORGANIZATION_ADMIN" || r === "ORG_ADMIN";
  }

  app.get("/api/support-tickets", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId || !caller.organizationId) {
      return res.status(401).json({ error: "ورود الزامی است" });
    }
    const list = isOrgAdminRole(caller.role)
      ? await supportTickets.listSupportTicketsForOrg(caller.organizationId)
      : await supportTickets.listSupportTicketsForUser(caller.organizationId, caller.userId);
    res.json(list);
  }));

  app.post("/api/support-tickets", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId || !caller.organizationId) {
      return res.status(401).json({ error: "ورود الزامی است" });
    }
    const body = req.body as Record<string, unknown>;
    if (!body.subject || !body.description) {
      return res.status(400).json({ error: "عنوان و شرح تیکت الزامی است" });
    }
    const user = await store.getUserById(caller.userId);
    const created = await supportTickets.insertSupportTicket({
      organizationId: caller.organizationId,
      userId: caller.userId,
      userEmail: user?.email || String(body.userEmail || ""),
      userName: user?.name || String(body.userName || ""),
      subject: String(body.subject).trim(),
      category: String(body.category || "other"),
      priority: String(body.priority || "medium"),
      description: String(body.description).trim(),
      contactPhone: body.contactPhone ? String(body.contactPhone) : undefined,
    });
    res.status(201).json(created);
  }));

  app.patch("/api/support-tickets/:id", asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    if (!caller?.userId || !caller.organizationId) {
      return res.status(401).json({ error: "ورود الزامی است" });
    }
    if (!isOrgAdminRole(caller.role)) {
      return res.status(403).json({ error: "دسترسی مجاز نیست" });
    }
    const body = req.body as Record<string, unknown>;
    const updated = await supportTickets.patchSupportTicket(caller.organizationId, req.params.id, {
      status: body.status ? String(body.status) : undefined,
      adminNote: body.adminNote !== undefined ? String(body.adminNote) : undefined,
      priority: body.priority ? String(body.priority) : undefined,
    });
    if (!updated) return res.status(404).json({ error: "تیکت یافت نشد" });
    res.json(updated);
  }));
}
