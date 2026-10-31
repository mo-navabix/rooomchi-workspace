import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  AccessControlConfig,
  ActiveTab,
  AppNotification,
  Organization,
  Permission,
  Room,
  User,
  UserRole,
} from "../types";

export type BookingModalDraft = {
  date: string;
  startTime: string;
  endTime: string;
};
import { ApiService } from "../services/apiService";
import { hasPermission, normalizeUserRole } from "../constants/rbac";
import {
  applyOrgBrandTheme,
  clearOrgBrandThemeOverrides,
} from "../utils/orgBrandTheme";
import { dropLegacySharedNotifications } from "../utils/userNotificationsStorage";
import {
  formatOrgDate,
  formatOrgDateLong,
  formatOrgDigits,
  getOrgLocalePreferences,
  type OrgLocalePreferences,
} from "../utils/orgLocale";
import { tPortal } from "../i18n/portalUi";
import {
  navigateToAppHome,
  navigateToLandingPath,
  navigateToLoginPath,
  navigateToSetupPath,
  readLoginRoute,
  readSetupRoute,
} from "../utils/appNavigation";
import {
  extractTenantSlugFromHostname,
  findOrganizationByHostname,
  isOrgPortalHost,
  isPlatformLandingHost,
  normalizeBrowserHostname,
} from "../utils/orgPortalHost";

interface ToastInfo {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export type AuthModalView = "login" | "register" | "otp" | "forgot" | "reset";
export type AppTheme = "light" | "dark";
export type ViewMode = "landing" | "login" | "app" | "setup";

interface AppContextType {
  // Theme & View Mode
  theme: AppTheme;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  goToLogin: (options?: { org?: string; authView?: AuthModalView }) => void;
  goToLanding: () => void;
  installationInitialized: boolean | null;
  finishSetupAndSignIn: (user: User, token: string) => Promise<void>;

  // Tenancy & Data
  organizations: Organization[];
  currentOrg: Organization | null;
  orgLocale: OrgLocalePreferences & {
    formatDate: (iso?: string | null) => string;
    formatDateLong: (iso?: string | null) => string;
    formatDigits: (n: number | string | null | undefined) => string;
    t: (key: string) => string;
  };
  activeTab: ActiveTab;
  isLoading: boolean;
  toast: ToastInfo | null;
  searchQuery: string;
  selectedRoomForBooking: Room | null;
  bookingModalDraft: BookingModalDraft | null;
  isBookingModalOpen: boolean;
  isProvisioningModalOpen: boolean;
  isCompleteProfileModalOpen: boolean;
  pendingRoomForBooking: Room | null;

  // RBAC & Auth State
  currentUser: User | null;
  userRole: UserRole;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalView: AuthModalView;
  pendingResetEmail: string;

  // RBAC & Permissions
  can: (permission: Permission) => boolean;

  // Navigation & UI Actions
  switchOrg: (orgId: string) => void;
  setUserRole: (role: UserRole) => void;
  setActiveTab: (tab: ActiveTab) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  openBookingModal: (room?: Room, draft?: BookingModalDraft) => void;
  closeBookingModal: () => void;
  openCompleteProfileModal: (pendingRoom?: Room) => void;
  closeCompleteProfileModal: () => void;
  isRegistrationComplete: () => boolean;
  openProvisioningModal: () => void;
  closeProvisioningModal: () => void;
  setSearchQuery: (q: string) => void;
  /** Increment after create/cancel/status change so calendar & dashboard refetch. */
  bookingsDataVersion: number;
  notifyBookingsChanged: () => void;
  refreshOrganizations: () => Promise<void>;
  updateCurrentOrgData: (updated: Partial<Organization>) => void;
  updateCurrentUser: (updated: Partial<User>) => void;

  // Auth Actions
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  login: (credentials: {
    email: string;
    password: string;
    organizationSlug?: string;
  }) => Promise<void>;
  completeAuthLogin: (res: {
    user: User;
    token?: string;
    accessToken?: string;
    message?: string;
  }) => void;
  register: (data: {
    name: string;
    email: string;
    password: string;
    orgId?: string;
    department?: string;
    jobTitle?: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<void>;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (
    email: string,
    code: string,
    password: string,
  ) => Promise<{ isProfileComplete: boolean }>;
  completeRegistration: (data: {
    name: string;
    phone: string;
    department?: string;
    jobTitle?: string;
    password?: string;
  }) => Promise<void>;
  logout: () => void;
  forgotPassword: (
    email: string,
  ) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  addNotification: (
    notification: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // Google Login & Profile Sync
  loginWithGoogle: () => Promise<void>;
  syncGoogleProfile: (googleEmail?: string) => Promise<void>;

  // Access Control & Security Policies
  accessControl: AccessControlConfig;
  updateAccessControl: (updates: Partial<AccessControlConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "rooomchi_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "rooomchi_auth_token";
const LOCAL_STORAGE_THEME_KEY = "rooomchi_theme";
const LOCAL_STORAGE_VIEW_KEY = "rooomchi_view_mode";
const DEFAULT_ACCESS_CONTROL: AccessControlConfig = {
  googleAuthEnabled: true,
  googleAutoSignOut: true,
  allowedGoogleDomains: ["*"],
  emailPasswordAuthEnabled: true,
  selfRegistrationEnabled: true,
  requireApprovalAfterHours: true,
  guestBookingEnabled: false,
  employeeAnalyticsEnabled: true,
  allowParticipantModifications: false,
  sessionTimeoutMinutes: 60,
  twoFactorAuthRequired: false,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Theme & View Mode State
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return "light";
  });

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const route = readLoginRoute();
      if (route.onLoginPage) return "login";
      if (readSetupRoute()) return "setup";
      const host = normalizeBrowserHostname();
      if (host && !isPlatformLandingHost(host) && extractTenantSlugFromHostname(host)) {
        return "login";
      }
      const saved = localStorage.getItem(LOCAL_STORAGE_VIEW_KEY);
      if (saved === "app" || saved === "login") {
        return saved;
      }
      if (saved === "landing" && isPlatformLandingHost(host)) {
        return "landing";
      }
    } catch {}
    return "landing";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(LOCAL_STORAGE_VIEW_KEY, mode);
    } catch (e) {
      console.error(e);
    }
  };

  const [installationInitialized, setInstallationInitialized] = useState<boolean | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] =
    useState<Room | null>(null);
  const [bookingModalDraft, setBookingModalDraft] =
    useState<BookingModalDraft | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] =
    useState<boolean>(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] =
    useState<boolean>(false);
  const [pendingRoomForBooking, setPendingRoomForBooking] =
    useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookingsDataVersion, setBookingsDataVersion] = useState(0);
  const notifyBookingsChanged = useCallback(() => {
    setBookingsDataVersion((v) => v + 1);
  }, []);

  // Access Control & Security Policies State
  const [accessControl, setAccessControl] = useState<AccessControlConfig>(DEFAULT_ACCESS_CONTROL);

  const updateAccessControl = useCallback((updates: Partial<AccessControlConfig>) => {
    setAccessControl((prev) => ({ ...prev, ...updates }));
  }, []);

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved) as User;
      return { ...parsed, role: normalizeUserRole(parsed.role) };
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>("login");
  const [pendingResetEmail, setPendingResetEmail] = useState<string>("");

  const goToLogin = useCallback(
    (options?: { org?: string; authView?: AuthModalView }) => {
      setViewMode("login");
      navigateToLoginPath(options?.org ?? null);
      if (options?.authView && options.authView !== "login") {
        setAuthModalView(options.authView);
        setIsAuthModalOpen(true);
      }
    },
    [],
  );

  const goToLanding = useCallback(() => {
    if (
      organizations.length > 0 &&
      isOrgPortalHost(organizations) &&
      !isPlatformLandingHost(normalizeBrowserHostname())
    ) {
      setViewMode("login");
      return;
    }
    setViewMode("landing");
    navigateToLandingPath();
  }, [organizations]);

  // If currentUser exists, use their role, else fallback to 'employee'
  const userRole: UserRole = normalizeUserRole(currentUser?.role);
  const isAuthenticated = !!currentUser;

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Math.random().toString(36).substring(2, 9);
      setToast({ id, type, message });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 4000);
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // RBAC Permission Checker
  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(userRole, permission);
    },
    [userRole],
  );

  const refreshOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const orgs = await ApiService.getOrganizations();
      setOrganizations(orgs);
      const hostOrg = findOrganizationByHostname(orgs);
      if (
        orgs.length > 0 &&
        (!currentOrg || !orgs.some((o) => o.id === currentOrg.id))
      ) {
        if (hostOrg) {
          setCurrentOrg(hostOrg);
        } else if (currentUser?.orgId) {
          const matching = orgs.find((o) => o.id === currentUser.orgId);
          setCurrentOrg(matching || orgs[0]);
        } else {
          setCurrentOrg(orgs[0]);
        }
      } else if (hostOrg && currentOrg?.id !== hostOrg.id) {
        setCurrentOrg(hostOrg);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "خطا در بارگذاری سازمان‌ها", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, currentUser, showToast]);

  useEffect(() => {
    ApiService.getSetupStatus()
      .then((status) => {
        setInstallationInitialized(status.initialized);
        if (!status.initialized) {
          setViewMode("setup");
          navigateToSetupPath(true);
          setIsLoading(false);
          return;
        }
        if (readSetupRoute()) {
          navigateToAppHome(true);
        }
        refreshOrganizations();
      })
      .catch(() => {
        setInstallationInitialized(true);
        refreshOrganizations();
      });
  }, []);

  /** Org theme applies only inside the portal; landing keeps Rooomchi CSS defaults. */
  useEffect(() => {
    if (viewMode === "landing") {
      clearOrgBrandThemeOverrides();
    } else {
      applyOrgBrandTheme(currentOrg?.primaryColor);
    }
  }, [viewMode, currentOrg?.id, currentOrg?.primaryColor, theme]);

  const orgLocalePrefs = useMemo(
    () => getOrgLocalePreferences(currentOrg),
    [currentOrg],
  );

  const orgLocale = useMemo(
    () => ({
      ...orgLocalePrefs,
      formatDate: (iso?: string | null) => formatOrgDate(iso, orgLocalePrefs),
      formatDateLong: (iso?: string | null) => formatOrgDateLong(iso, orgLocalePrefs),
      formatDigits: (n: number | string | null | undefined) =>
        formatOrgDigits(n, orgLocalePrefs.language),
      t: (key: string) => tPortal(orgLocalePrefs.language, key),
    }),
    [orgLocalePrefs],
  );

  useEffect(() => {
    if (viewMode === "landing" || viewMode === "setup") return;
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
  }, [viewMode]);

  useEffect(() => {
    if (!currentOrg?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const auth = await ApiService.getOrganizationAuthSettings(currentOrg.id);
        if (cancelled) return;
        const stored = (currentOrg.settings as { accessControl?: Partial<AccessControlConfig> })
          ?.accessControl;
        setAccessControl({
          ...DEFAULT_ACCESS_CONTROL,
          ...stored,
          googleAuthEnabled: auth.googleEnabled,
          emailPasswordAuthEnabled: auth.localEnabled,
          selfRegistrationEnabled: auth.authPolicies?.selfRegistrationEnabled !== false,
        });
      } catch {
        /* defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrg?.id, currentOrg?.settings]);

  // Deep-link: /login?org=... — or org-branded host (custom domain / tenant subdomain)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (organizations.length === 0) return;

    try {
      const route = readLoginRoute();
      const searchParams = new URLSearchParams(window.location.search);
      const authParam = searchParams.get("auth") || route.auth;
      const orgParam = searchParams.get("org") || route.org;
      const path = window.location.pathname.replace(/\/+$/, "") || "/";

      const resolveOrg = (raw: string) => {
        const decodedOrg = decodeURIComponent(raw).toLowerCase().trim();
        return organizations.find(
          (o) =>
            o.id.toLowerCase() === decodedOrg ||
            (o.slug && o.slug.toLowerCase() === decodedOrg) ||
            o.name.toLowerCase() === decodedOrg,
        );
      };

      const hostOrg = findOrganizationByHostname(organizations);
      if (hostOrg) {
        setCurrentOrg(hostOrg);
      }

      if (orgParam) {
        const matched = resolveOrg(orgParam);
        if (matched) {
          setCurrentOrg(matched);
        }
      }

      const onOrgPortal = isOrgPortalHost(organizations);
      const wantsLogin =
        route.onLoginPage ||
        authParam === "login" ||
        authParam === "register" ||
        (onOrgPortal && !currentUser && (path === "/" || route.onLoginPage));

      if (wantsLogin && !currentUser) {
        setViewMode("login");
        if (orgParam) {
          const matched = resolveOrg(orgParam);
          navigateToLoginPath(matched?.slug || matched?.id || orgParam, true);
          if (matched && (route.onLoginPage || authParam)) {
            showToast(`صفحه ورود «${matched.name}»`, "info");
          }
        } else if (route.onLoginPage) {
          navigateToLoginPath(hostOrg?.slug || hostOrg?.id || null, true);
        }
        if (authParam === "register") {
          setAuthModalView("register");
          setIsAuthModalOpen(true);
        }
      }
    } catch (e) {
      console.error("Failed to parse URL query params", e);
    }
  }, [organizations, showToast, currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => {
      const route = readLoginRoute();
      if (installationInitialized === false) {
        setViewMode("setup");
        return;
      }
      if (readSetupRoute()) setViewMode("setup");
      else if (route.onLoginPage) setViewMode("login");
      else if (window.location.pathname === "/" || window.location.pathname === "") {
        const onOrgPortal =
          organizations.length > 0 &&
          isOrgPortalHost(organizations) &&
          !isPlatformLandingHost(normalizeBrowserHostname());
        setViewMode(onOrgPortal && !currentUser ? "login" : "landing");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [installationInitialized, organizations, currentUser]);

  // Sync user state with localStorage
  const saveUserSession = (user: User, token: string) => {
    const normalized = { ...user, role: normalizeUserRole(user.role) };
    setCurrentUser(normalized);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(normalized));
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
    } catch (e) {
      console.error("Failed to write to localStorage", e);
    }
  };

  const clearUserSession = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    } catch (e) {
      console.error("Failed to clear localStorage", e);
    }
  };

  const finishSetupAndSignIn = useCallback(
    async (user: User, token: string) => {
      saveUserSession(user, token);
      setInstallationInitialized(true);
      setViewMode("app");
      navigateToAppHome(true);
      const orgs = await ApiService.getOrganizations();
      setOrganizations(orgs);
      const orgId = user.orgId;
      if (orgId) {
        const match = orgs.find((o) => o.id === orgId);
        if (match) setCurrentOrg(match);
      }
    },
    [],
  );

  const switchOrg = (orgId: string) => {
    const found = organizations.find((o) => o.id === orgId);
    if (found) {
      setCurrentOrg(found);
      showToast(`سازمان فعال به «${found.name}» تغییر یافت`, "info");
    }
  };

  const setUserRole = (role: UserRole) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      saveUserSession(updatedUser, "session_token");
    } else {
      // Create a guest session with this role
      const guestUser: User = {
        id: `guest-${Date.now()}`,
        name: role === "super_admin" ? "مدیر ارشد روم‌چی" : "کاربر سازمانی",
        email: `${role}@rooomchi.ir`,
        orgId: currentOrg?.id || "org-1",
        orgName: currentOrg?.name,
        role,
        department: "مدیریت",
        status: "active",
        createdAt: new Date().toISOString(),
      };
      saveUserSession(guestUser, "guest_token");
    }
    showToast(`نقش کاربری به «${role}» تغییر یافت`, "info");
  };

  const updateCurrentOrgData = (updated: Partial<Organization>) => {
    if (!currentOrg) return;
    const newOrg = { ...currentOrg, ...updated };
    setCurrentOrg(newOrg);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === newOrg.id ? newOrg : o)),
    );
  };

  const updateCurrentUser = (updated: Partial<User>) => {
    if (!currentUser) return;
    let token = "session_token";
    try {
      token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) || token;
    } catch {
      /* ignore */
    }
    saveUserSession({ ...currentUser, ...updated }, token);
  };

  // Auth Operations
  const openAuthModal = (view: AuthModalView = "login") => {
    if (view === "login") {
      goToLogin();
      return;
    }
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const completeAuthLogin = (res: {
    user: User;
    token?: string;
    accessToken?: string;
    message?: string;
  }) => {
    const token = res.token || res.accessToken;
    if (!token) throw new Error("توکن احراز هویت از سرور دریافت نشد");
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode("app");
    navigateToAppHome(true);
    showToast(res.message || `خوش آمدید، ${res.user.name}`, "success");
    if (res.user.orgId) {
      const org = organizations.find((o) => o.id === res.user.orgId);
      if (org) setCurrentOrg(org);
    }
  };

  const login = async (credentials: {
    email: string;
    password: string;
    organizationSlug?: string;
  }) => {
    const res = await ApiService.login(credentials);
    completeAuthLogin(res);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    orgId?: string;
    department?: string;
    jobTitle?: string;
    phone?: string;
    role?: UserRole;
  }) => {
    const orgId = data.orgId || currentOrg?.id || (organizations[0] ? organizations[0].id : "org-1");
    const res = await ApiService.register({
      ...data,
      orgId,
    });
    const token = res.token || (res as { accessToken?: string }).accessToken;
    if (!token) {
      throw new Error("توکن احراز هویت از سرور دریافت نشد");
    }
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode("app");
    navigateToAppHome(true);
    showToast(
      `ثبت‌نام با موفقیت انجام شد. به سامانه روم‌چی خوش آمدید`,
      "success",
    );
  };

  const logout = () => {
    const wasGoogle = currentUser?.avatarType === "google";
    clearUserSession();
    if (wasGoogle && accessControl.googleAutoSignOut) {
      showToast("شما با موفقیت از سامانه روم‌چی و حساب گوگل خارج شدید", "info");
    } else {
      showToast("شما با موفقیت از سامانه روم‌چی خارج شدید", "info");
    }
    setActiveTab("dashboard");
    goToLogin();
  };

  const authOrgContext = () =>
    currentOrg
      ? { organizationId: currentOrg.id, organizationSlug: currentOrg.slug }
      : undefined;

  const forgotPassword = async (email: string) => {
    setPendingResetEmail(email);
    const res = await ApiService.forgotPassword(email, authOrgContext());
    setAuthModalView("reset");
    return res;
  };

  const resetPassword = async (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => {
    await ApiService.resetPassword({ ...data, ...authOrgContext() });
    showToast("رمز عبور شما بازنشانی شد. لطفاً وارد شوید", "success");
    setAuthModalView("login");
  };

  const sendOtp = async (email: string) => {
    const res = await ApiService.sendOtp(email, authOrgContext());
    showToast(res.message || "کد تأیید ارسال شد", "info");
    return res;
  };

  const verifyOtp = async (email: string, code: string, password: string) => {
    const res = await ApiService.verifyOtp(email, code, authOrgContext(), password);
    const token = res.token || res.accessToken;
    if (!token) {
      throw new Error("توکن دریافت نشد");
    }
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode("app");
    showToast(
      res.isProfileComplete === false
        ? "ورود موفق! ثبت‌نام اولیه شما انجام شد. برای رزرو اتاق، لطفاً مشخصات خود را تکمیل کنید."
        : `خوش آمدید، ${res.user.name}`,
      "success",
    );
    if (res.user.orgId) {
      const org = organizations.find((o) => o.id === res.user.orgId);
      if (org) setCurrentOrg(org);
    }
    return { isProfileComplete: res.isProfileComplete };
  };

  const completeRegistration = async (data: {
    name: string;
    phone: string;
    department?: string;
    jobTitle?: string;
    password?: string;
  }) => {
    if (!currentUser) throw new Error("کاربر در وضعیت ورود قرار ندارد");
    const res = await ApiService.completeProfile({
      ...data,
      email: currentUser.email,
      userId: currentUser.id,
    });
    let token = "session_token";
    try {
      token = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY) || token;
    } catch {}
    saveUserSession(res.user, token);
    setIsCompleteProfileModalOpen(false);
    showToast("مشخصات شما با موفقیت ثبت شد! اکنون می‌توانید اتاق مورد نظر را رزرو کنید", "success");

    // If there was a pending room booking attempt, immediately launch it!
    if (pendingRoomForBooking) {
      const room = pendingRoomForBooking;
      setPendingRoomForBooking(null);
      setSelectedRoomForBooking(room);
      setIsBookingModalOpen(true);
    }
  };

  const isRegistrationComplete = useCallback((): boolean => {
    if (!currentUser) return false;
    if (currentUser.isProfileComplete === false) return false;
    const hasValidName = Boolean(
      currentUser.name &&
      currentUser.name.trim() !== "" &&
      currentUser.name.trim() !== currentUser.email.split("@")[0],
    );
    const hasValidPhone = Boolean(
      currentUser.phone && currentUser.phone.trim() !== "",
    );
    return hasValidName && hasValidPhone;
  }, [currentUser]);

  const openCompleteProfileModal = (pendingRoom?: Room) => {
    if (pendingRoom) {
      setPendingRoomForBooking(pendingRoom);
    }
    setIsCompleteProfileModalOpen(true);
  };

  const closeCompleteProfileModal = () => {
    setIsCompleteProfileModalOpen(false);
  };

  const openBookingModal = (room?: Room, draft?: BookingModalDraft) => {
    // 1. If not authenticated at all:
    if (!currentUser) {
      showToast("برای رزرو اتاق، لطفاً وارد سامانه شوید یا ثبت‌نام کنید", "info");
      goToLogin();
      return;
    }

    // 2. If authenticated but registration is incomplete (email-only registration):
    if (!isRegistrationComplete()) {
      showToast(
        "همکار گرامی، برای رزرو اتاق ابتدا باید ثبت‌نام و اطلاعات کاربری خود را تکمیل نمایید",
        "error",
      );
      openCompleteProfileModal(room);
      return;
    }

    // 3. Complete user: proceed directly to booking modal
    setBookingModalDraft(draft ?? null);
    setSelectedRoomForBooking(room || null);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedRoomForBooking(null);
    setBookingModalDraft(null);
  };

  const openProvisioningModal = () => {
    setIsProvisioningModalOpen(true);
  };

  const closeProvisioningModal = () => {
    setIsProvisioningModalOpen(false);
  };

  // ==========================================
  // Notifications System (Header Bell) — per user
  // ==========================================
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    dropLegacySharedNotifications();
    if (!currentUser?.id) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const fromApi = await ApiService.getNotifications();
        if (!cancelled) setNotifications(fromApi);
      } catch {
        if (!cancelled) setNotifications([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.orgId, currentOrg?.id]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const addNotification = useCallback(
    (item: Omit<AppNotification, "id" | "createdAt" | "isRead">) => {
      if (!currentUser?.id) return;
      const userId = currentUser.id;
      const payload = {
        ...item,
        orgId: item.orgId || currentUser.orgId || currentOrg?.id,
        userEmail: item.userEmail || currentUser.email,
      };
      void (async () => {
        const saved = await ApiService.createNotification(payload);
        const newNotif: AppNotification = saved ?? {
          ...payload,
          userId,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
      })();
    },
    [currentUser?.id, currentUser?.email, currentUser?.orgId, currentOrg?.id],
  );

  const markNotificationAsRead = useCallback(
    (id: string) => {
      if (!currentUser?.id) return;
      const userId = currentUser.id;
      void ApiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    },
    [currentUser?.id],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    void ApiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [currentUser?.id]);

  const clearAllNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    void ApiService.clearNotifications();
    setNotifications([]);
  }, [currentUser?.id]);

  // ==========================================
  // Google Login & Profile Sync
  // ==========================================
  const loginWithGoogle = async () => {
    const orgId = currentOrg?.id || organizations[0]?.id;
    const slug = currentOrg?.slug;
    if (!orgId && !slug) {
      showToast("ابتدا سازمان را انتخاب کنید.", "error");
      return;
    }
    ApiService.startGoogleOAuth({
      organizationId: orgId,
      organizationSlug: slug,
      redirectAfter: "/",
    });
  };

  const syncGoogleProfile = async (googleEmail?: string) => {
    if (!currentUser) return;
    const targetEmail = googleEmail || currentUser.email;
    const picture =
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80";
    updateCurrentUser({
      avatar: picture,
      avatarType: "google",
    });
    showToast(
      `تصویر نمایه حساب گوگل (${targetEmail}) با موفقیت بر روی پروفایل تنظیم شد`,
      "success",
    );
  };

  return (
    <AppContext.Provider
      value={{
        // Theme & View Mode
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        goToLogin,
        goToLanding,
        installationInitialized,
        finishSetupAndSignIn,

        organizations,
        currentOrg,
        orgLocale,
        activeTab,
        isLoading,
        toast,
        searchQuery,
        selectedRoomForBooking,
        bookingModalDraft,
        isBookingModalOpen,
        isProvisioningModalOpen,
        isCompleteProfileModalOpen,
        pendingRoomForBooking,

        // Auth & RBAC
        currentUser,
        userRole,
        isAuthenticated,
        isAuthModalOpen,
        authModalView,
        pendingResetEmail,
        can,

        // Actions
        switchOrg,
        setUserRole,
        setActiveTab,
        showToast,
        hideToast,
        openBookingModal,
        closeBookingModal,
        openCompleteProfileModal,
        closeCompleteProfileModal,
        isRegistrationComplete,
        openProvisioningModal,
        closeProvisioningModal,
        setSearchQuery,
        bookingsDataVersion,
        notifyBookingsChanged,
        refreshOrganizations,
        updateCurrentOrgData,
        updateCurrentUser,

        // Auth Operations
        openAuthModal,
        closeAuthModal,
        login,
        completeAuthLogin,
        register,
        sendOtp,
        verifyOtp,
        completeRegistration,
        logout,
        forgotPassword,
        resetPassword,

        // Notifications
        notifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,

        // Google Auth & Sync
        loginWithGoogle,
        syncGoogleProfile,

        // Access Control & Security
        accessControl,
        updateAccessControl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
