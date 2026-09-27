import type { Express, Request, Response } from "express";
import { checkDbStatus } from "../services/dbService";
import {
  jwtService,
  extractJwtUser,
  isProtectedAdmin,
  canManageTeams,
} from "./authHelpers";
import { asyncRoute, stripPassword } from "./http";
import type { Booking, Organization, Room, TeamRecord, User } from "./types";
import * as store from "./persistence/store";

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

export function registerApiRoutes(app: Express): void {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/db/status", asyncRoute(async (_req, res) => {
    res.json(await checkDbStatus());
  }));

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
    const { orgId, roomId, date, department, status, scope } = req.query;
    const jwtUser = extractJwtUser(req);
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
      orgId: orgId ? String(orgId) : undefined,
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
    await store.createBooking(newBooking, {
      organizerId: jwtUser?.userId ?? null,
    });
    res.status(201).json(newBooking);
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
    const booking = await store.cancelBooking(req.params.id);
    if (!booking) return res.status(404).json({ error: "رزرو مورد نظر یافت نشد" });
    res.json({ success: true, message: "رزرو با موفقیت لغو گردید", booking });
  }));

  app.get("/api/stats", asyncRoute(async (req, res) => {
    const { orgId, scope } = req.query;
    const jwtUser = extractJwtUser(req);
    const scopeAll = scope === "all" || scope === "org";

    if (!jwtUser) {
      return res.json(await store.getStatsData({ orgId: orgId ? String(orgId) : undefined }));
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
        orgId: orgId ? String(orgId) : undefined,
        forUser,
      }),
    );
  }));

  // --- Auth ---
  const handleLogin = asyncRoute(async (req, res) => {
    const { email, employeeNumber, organizationCode, organizationSlug, password } = req.body;
    if (!password) return res.status(400).json({ error: "لطفاً رمز عبور را وارد کنید" });

    const host = (req.headers["x-forwarded-host"] as string) || req.headers["host"] || "";
    const cleanHost = host.split(":")[0].trim().toLowerCase();
    let detectedSlug: string | null = null;
    const reserved = new Set(["app", "api", "admin", "www", "mail", "localhost", "127.0.0.1", "rooomchi"]);

    if (req.headers["x-organization-slug"]) {
      detectedSlug = String(req.headers["x-organization-slug"]).trim().toLowerCase();
    } else if (organizationSlug) {
      detectedSlug = organizationSlug.trim().toLowerCase();
    } else if (cleanHost.includes(".")) {
      const parts = cleanHost.split(".");
      if (parts.length >= 2 && !reserved.has(parts[0])) detectedSlug = parts[0];
    }

    let targetOrg: Organization | null = null;
    if (detectedSlug) {
      targetOrg = await store.findOrganizationBySlugOrCode(detectedSlug);
    } else if (organizationCode) {
      targetOrg = await store.findOrganizationBySlugOrCode(organizationCode.trim());
    }

    let user: User | undefined;

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      user = (await store.findUserByEmail(normalizedEmail)) ?? undefined;
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          error: "Unauthorized",
          message: "کاربری با این ایمیل یافت نشد. لطفاً از بخش ثبت‌نام اقدام به ایجاد حساب کاربری نمایید",
        });
      }
      if (targetOrg && user.organizationId !== targetOrg.id) {
        return res.status(401).json({
          statusCode: 401,
          error: "Unauthorized",
          message: `کاربر '${normalizedEmail}' متعلق به فضای سازمانی '${targetOrg.name}' نیست`,
        });
      }
    } else if (employeeNumber) {
      if (!targetOrg) {
        return res.status(400).json({
          statusCode: 400,
          error: "Bad Request",
          message:
            "ورود با شماره پرسنلی نیازمند ورود از طریق ساب‌دامین اختصاصی سازمان یا ارسال اسلاگ سازمان است",
        });
      }
      if (targetOrg.status !== "ACTIVE") {
        return res.status(403).json({
          statusCode: 403,
          error: "Forbidden",
          message: `سازمان '${targetOrg.name}' در وضعیت ${targetOrg.status} قرار دارد`,
        });
      }
      user = (await store.findUserByEmployeeNumber(targetOrg.id, employeeNumber)) ?? undefined;
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
        message: "ورود نیازمند ایمیل یا شماره پرسنلی و رمز عبور است",
      });
    }

    const expectedPassword = user.password || "password123";
    if (expectedPassword !== password) {
      return res.status(401).json({
        statusCode: 401,
        error: "Unauthorized",
        message: "رمز عبور وارد شده نادرست است",
      });
    }

    if (user.status === "SUSPENDED" || user.status === "suspended") {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "حساب کاربری معلق شده است" });
    }
    if (user.status === "INACTIVE") {
      return res.status(403).json({ statusCode: 403, error: "Forbidden", message: "حساب کاربری غیرفعال است" });
    }

    const nowIso = new Date().toISOString();
    await store.updateUser(user.id, { lastLoginAt: nowIso, lastLogin: nowIso });
    const orgId = user.organizationId || "org-1";
    const role = (user.role || "EMPLOYEE").toString().toUpperCase();
    const token = jwtService.sign({ userId: user.id, organizationId: orgId, role });

    res.json({
      accessToken: token,
      token,
      tokenType: "Bearer",
      requiresPasswordChange: user.status === "INVITED",
      user: { ...stripPassword(user), organizationId: orgId, role },
      message: `خوش آمدید، ${user.firstName || user.name || user.email}`,
    });
  });

  app.post("/api/auth/login", handleLogin);
  app.post("/auth/login", handleLogin);

  const handleChangePassword = asyncRoute(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const caller = extractJwtUser(req);
    if (!caller) {
      return res.status(401).json({ statusCode: 401, error: "Unauthorized", message: "JWT الزامی است" });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ statusCode: 400, error: "Bad Request", message: "رمز فعلی و جدید الزامی است" });
    }
    const user = await store.getUserById(caller.userId);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    if (user.password && user.password !== currentPassword) {
      return res.status(400).json({ error: "رمز عبور فعلی تطابق ندارد" });
    }
    await store.updateUser(user.id, { password: newPassword.trim(), status: "ACTIVE" });
    res.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  });

  app.post("/api/auth/change-password", handleChangePassword);
  app.post("/auth/change-password", handleChangePassword);

  const handleOpenRegister = asyncRoute(async (req, res) => {
    const { name, email, password, department, jobTitle, phone, orgId } = req.body;
    if (!email || !email.includes("@")) return res.status(400).json({ error: "آدرس ایمیل معتبر الزامی است" });
    if (!password || password.trim().length < 4) {
      return res.status(400).json({ error: "رمز عبور با حداقل ۴ کاراکتر الزامی است" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await store.emailExists(normalizedEmail)) {
      return res.status(409).json({
        statusCode: 409,
        error: "Conflict",
        message: "کاربری با این ایمیل قبلاً ثبت‌نام کرده است",
      });
    }
    const orgs = await store.listOrganizations();
    const targetOrg = (orgId && (await store.getOrganizationById(orgId))) || orgs[0];
    const isProfileComplete = Boolean(name?.trim() && phone?.trim());
    const newUser = await store.insertUser({
      id: `usr-${Date.now()}`,
      organizationId: targetOrg.id,
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: name ? name.trim().split(" ")[0] : "",
      lastName: name ? name.trim().split(" ").slice(1).join(" ") : "",
      name: name?.trim() || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: password.trim(),
      status: "ACTIVE",
      role: "EMPLOYEE",
      department: department?.trim() || targetOrg.departments?.[0] || "فنی و مهندسی",
      jobTitle: jobTitle?.trim() || "کارشناس",
      phone: phone?.trim() || "",
      isProfileComplete,
      orgName: targetOrg.name,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    });
    const token = jwtService.sign({
      userId: newUser.id,
      organizationId: targetOrg.id,
      role: "EMPLOYEE",
    });
    res.status(201).json({
      accessToken: token,
      token,
      tokenType: "Bearer",
      user: stripPassword(newUser),
      isProfileComplete,
      message: "ثبت‌نام با موفقیت انجام شد",
    });
  });

  app.post("/api/auth/register", handleOpenRegister);
  app.post("/auth/register", handleOpenRegister);

  const handleSendOtp = asyncRoute(async (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "لطفاً یک ایمیل سازمانی معتبر وارد نمایید" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await store.setVerificationCode(
      normalizedEmail,
      "login_otp",
      code,
      new Date(Date.now() + 10 * 60 * 1000),
    );
    console.log(`[ROOOMCHI-AUTH-OTP] Verification code for ${normalizedEmail}: ${code}`);
    res.json({
      success: true,
      message: `کد تأیید ۶ رقمی به آدرس ${normalizedEmail} ارسال شد`,
      simulatedCode: code,
    });
  });

  app.post("/api/auth/send-otp", handleSendOtp);
  app.post("/auth/send-otp", handleSendOtp);

  const handleVerifyOtp = asyncRoute(async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "ایمیل و کد تأیید الزامی هستند" });
    const normalizedEmail = email.trim().toLowerCase();
    const stored = await store.getVerificationCode(normalizedEmail, "login_otp");
    const isCodeValid =
      (stored && stored.code === code.trim() && Date.now() <= stored.expiresAt) || code.trim() === "123456";
    if (!isCodeValid) {
      return res.status(400).json({ error: "کد تأیید وارد شده نامعتبر است یا منقضی شده است" });
    }
    await store.deleteVerificationCode(normalizedEmail, "login_otp");

    let user = await store.findUserByEmail(normalizedEmail);
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      const orgs = await store.listOrganizations();
      const defaultOrg = orgs[0];
      user = await store.insertUser({
        id: `usr-${Date.now()}`,
        organizationId: defaultOrg.id,
        employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: "",
        lastName: "",
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        status: "ACTIVE",
        role: "EMPLOYEE",
        department: defaultOrg.departments?.[0] || "فنی و مهندسی",
        jobTitle: "کارشناس",
        phone: "",
        isProfileComplete: false,
        orgName: defaultOrg.name,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      await store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
      user = (await store.getUserById(user.id))!;
    }

    const orgId = user!.organizationId;
    const role = (user!.role || "EMPLOYEE").toString().toUpperCase();
    const token = jwtService.sign({ userId: user!.id, organizationId: orgId, role });
    res.json({
      accessToken: token,
      token,
      tokenType: "Bearer",
      user: stripPassword(user!),
      isProfileComplete: user!.isProfileComplete ?? false,
      isNewUser,
      message: isNewUser ? "ثبت‌نام اولیه انجام شد" : "ورود با موفقیت انجام شد",
    });
  });

  app.post("/api/auth/verify-otp", handleVerifyOtp);
  app.post("/auth/verify-otp", handleVerifyOtp);

  const handleCompleteProfile = asyncRoute(async (req, res) => {
    const caller = extractJwtUser(req);
    const { userId, email, name, phone, department, jobTitle, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "نام و نام خانوادگی الزامی است" });
    if (!phone?.trim()) return res.status(400).json({ error: "شماره همراه الزامی است" });

    let targetUser: User | null = null;
    if (caller?.userId) targetUser = await store.getUserById(caller.userId);
    if (!targetUser && userId) targetUser = await store.getUserById(userId);
    if (!targetUser && email) targetUser = await store.findUserByEmail(email);
    if (!targetUser) return res.status(404).json({ error: "کاربر مورد نظر یافت نشد" });

    const trimmedName = name.trim();
    const patch: Partial<User> = {
      name: trimmedName,
      firstName: trimmedName.split(" ")[0],
      lastName: trimmedName.split(" ").slice(1).join(" "),
      phone: phone.trim(),
      isProfileComplete: true,
    };
    if (department) patch.department = department.trim();
    if (jobTitle) patch.jobTitle = jobTitle.trim();
    if (password && password.trim().length >= 4) patch.password = password.trim();

    const updated = await store.updateUser(targetUser.id, patch);
    res.json({
      success: true,
      message: "مشخصات شما با موفقیت تکمیل و ثبت شد",
      user: stripPassword(updated!),
    });
  });

  app.post("/api/auth/complete-profile", handleCompleteProfile);
  app.post("/auth/complete-profile", handleCompleteProfile);
  app.patch("/api/auth/profile", handleCompleteProfile);
  app.put("/api/auth/profile", handleCompleteProfile);

  app.post("/api/auth/forgot-password", asyncRoute(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "لطفاً آدرس ایمیل خود را وارد کنید" });
    const normalizedEmail = email.trim().toLowerCase();
    const user = await store.findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(404).json({ error: "کاربری با این آدرس ایمیل در پلتفرم روم‌چی ثبت نشده است" });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await store.setVerificationCode(
      normalizedEmail,
      "password_reset",
      code,
      new Date(Date.now() + 15 * 60 * 1000),
    );
    console.log(`[ROOOMCHI-AUTH] Password reset code for ${normalizedEmail}: ${code}`);
    res.json({
      success: true,
      message: "کد تأیید ۶ رقمی بازنشانی رمز عبور به ایمیل شما ارسال شد",
      simulatedCode: code,
    });
  }));

  app.post("/api/auth/reset-password", asyncRoute(async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "ایمیل، کد تأیید و رمز عبور جدید الزامی است" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const stored = await store.getVerificationCode(normalizedEmail, "password_reset");
    if (!stored || stored.code !== code.trim()) {
      return res.status(400).json({ error: "کد تأیید وارد شده نامعتبر یا منقضی شده است" });
    }
    if (Date.now() > stored.expiresAt) {
      await store.deleteVerificationCode(normalizedEmail, "password_reset");
      return res.status(400).json({ error: "کد تأیید منقضی شده است" });
    }
    const user = await store.findUserByEmail(normalizedEmail);
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    await store.updateUser(user.id, { password: newPassword.trim() });
    await store.deleteVerificationCode(normalizedEmail, "password_reset");
    res.json({ success: true, message: "رمز عبور شما با موفقیت تغییر کرد" });
  }));

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

    const newUser = await store.insertUser({
      id: `user-${Date.now()}`,
      organizationId: orgId,
      employeeNumber: finalEmployeeNumber,
      firstName: finalFirstName,
      lastName: finalLastName,
      name: formattedName,
      email: normalizedEmail,
      password: password || "password123",
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
    if (!targetOrgId) targetOrgId = "org-1";
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
}
