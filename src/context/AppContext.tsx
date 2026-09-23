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
import { ApiService } from "../services/apiService";
import { hasPermission, normalizeUserRole } from "../constants/rbac";

interface ToastInfo {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export type AuthModalView = "login" | "register" | "otp" | "forgot" | "reset";
export type AppTheme = "light" | "dark";
export type ViewMode = "landing" | "app";

interface AppContextType {
  // Theme & View Mode
  theme: AppTheme;
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Tenancy & Data
  organizations: Organization[];
  currentOrg: Organization | null;
  activeTab: ActiveTab;
  isLoading: boolean;
  toast: ToastInfo | null;
  searchQuery: string;
  selectedRoomForBooking: Room | null;
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
  openBookingModal: (room?: Room) => void;
  closeBookingModal: () => void;
  openCompleteProfileModal: (pendingRoom?: Room) => void;
  closeCompleteProfileModal: () => void;
  isRegistrationComplete: () => boolean;
  openProvisioningModal: () => void;
  closeProvisioningModal: () => void;
  setSearchQuery: (q: string) => void;
  refreshOrganizations: () => Promise<void>;
  updateCurrentOrgData: (updated: Partial<Organization>) => void;
  updateCurrentUser: (updated: Partial<User>) => void;

  // Auth Actions
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
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
  sendOtp: (email: string) => Promise<{ success: boolean; simulatedCode?: string; message: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ isProfileComplete: boolean }>;
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
  ) => Promise<{ success: boolean; simulatedCode?: string }>;
  resetPassword: (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => Promise<void>;
  quickLoginAs: (userRole: UserRole) => Promise<void>;

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
  loginWithGoogle: (customGoogleUser?: {
    email?: string;
    name?: string;
    picture?: string;
  }) => Promise<void>;
  syncGoogleProfile: (googleEmail?: string) => Promise<void>;

  // Access Control & Security Policies
  accessControl: AccessControlConfig;
  updateAccessControl: (updates: Partial<AccessControlConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "didar_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "didar_auth_token";
const LOCAL_STORAGE_THEME_KEY = "didar_theme";
const LOCAL_STORAGE_VIEW_KEY = "didar_view_mode";
const LOCAL_STORAGE_ACCESS_CONTROL_KEY = "roomchi_access_control_v1";

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
      const saved = localStorage.getItem(LOCAL_STORAGE_VIEW_KEY);
      if (saved === "landing" || saved === "app") return saved;
    } catch {}
    // Default to landing page for visitors
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

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] =
    useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] =
    useState<boolean>(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] =
    useState<boolean>(false);
  const [pendingRoomForBooking, setPendingRoomForBooking] =
    useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Access Control & Security Policies State
  const [accessControl, setAccessControl] = useState<AccessControlConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACCESS_CONTROL_KEY);
      if (saved) {
        return { ...DEFAULT_ACCESS_CONTROL, ...JSON.parse(saved) };
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_ACCESS_CONTROL;
  });

  const updateAccessControl = useCallback((updates: Partial<AccessControlConfig>) => {
    setAccessControl((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(LOCAL_STORAGE_ACCESS_CONTROL_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
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
      if (
        orgs.length > 0 &&
        (!currentOrg || !orgs.some((o) => o.id === currentOrg.id))
      ) {
        // If current user is tied to a specific org, select that org
        if (currentUser?.orgId) {
          const matching = orgs.find((o) => o.id === currentUser.orgId);
          setCurrentOrg(matching || orgs[0]);
        } else {
          setCurrentOrg(orgs[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "خطا در بارگذاری سازمان‌ها", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, currentUser, showToast]);

  useEffect(() => {
    refreshOrganizations();
  }, []);

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
        name: role === "super_admin" ? "مدیر ارشد دیدار" : "کاربر سازمانی",
        email: `${role}@didar.ir`,
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
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await ApiService.login(credentials);
    const token = res.token || (res as { accessToken?: string }).accessToken;
    if (!token) {
      throw new Error("توکن احراز هویت از سرور دریافت نشد");
    }
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode("app");
    showToast(`خوش آمدید، ${res.user.name}`, "success");

    // Switch to user's org if available
    if (res.user.orgId) {
      const org = organizations.find((o) => o.id === res.user.orgId);
      if (org) setCurrentOrg(org);
    }
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
    showToast(
      `ثبت‌نام با موفقیت انجام شد. به سامانه دیدار خوش آمدید`,
      "success",
    );
  };

  const logout = () => {
    const wasGoogle = currentUser?.avatarType === "google";
    clearUserSession();
    if (wasGoogle && accessControl.googleAutoSignOut) {
      showToast("شما با موفقیت از سامانه دیدار و حساب گوگل خارج شدید", "info");
    } else {
      showToast("شما با موفقیت از سامانه دیدار خارج شدید", "info");
    }
    setActiveTab("dashboard");
    setViewMode("landing");
  };

  const forgotPassword = async (email: string) => {
    setPendingResetEmail(email);
    const res = await ApiService.forgotPassword(email);
    setAuthModalView("reset");
    return res;
  };

  const resetPassword = async (data: {
    email: string;
    code: string;
    newPassword: string;
  }) => {
    await ApiService.resetPassword(data);
    showToast("رمز عبور شما بازنشانی شد. لطفاً وارد شوید", "success");
    setAuthModalView("login");
  };

  // Preset Fast Switching for quick demonstrations
  const quickLoginAs = async (role: UserRole) => {
    const roleAccounts: Record<UserRole, { email: string; password: string }> =
      {
        super_admin: { email: "admin@didar.ir", password: "password123" },
        org_admin: { email: "admin@technova.ir", password: "password123" },
        room_manager: {
          email: "facility@technova.ir",
          password: "password123",
        },
        employee: { email: "employee@technova.ir", password: "password123" },
      };

    const creds = roleAccounts[role];
    try {
      await login(creds);
    } catch (e: any) {
      showToast(e.message || "خطا در ورود سریع", "error");
    }
  };

  const sendOtp = async (email: string) => {
    const res = await ApiService.sendOtp(email);
    showToast(res.message || "کد تأیید ارسال شد", "info");
    return res;
  };

  const verifyOtp = async (email: string, code: string) => {
    const res = await ApiService.verifyOtp(email, code);
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

  const openBookingModal = (room?: Room) => {
    // 1. If not authenticated at all:
    if (!currentUser) {
      showToast("برای رزرو اتاق، لطفاً وارد سامانه شوید یا ثبت‌نام کنید", "info");
      openAuthModal("login");
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
    setSelectedRoomForBooking(room || null);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedRoomForBooking(null);
  };

  const openProvisioningModal = () => {
    setIsProvisioningModalOpen(true);
  };

  const closeProvisioningModal = () => {
    setIsProvisioningModalOpen(false);
  };

  // ==========================================
  // Notifications System (Header Bell)
  // ==========================================
  const LOCAL_STORAGE_NOTIFICATIONS_KEY = "roomchi_notifications_v1";

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      /* ignore */
    }
    return [
      {
        id: "notif-welcome",
        title: "به سامانه روم‌چی خوش آمدید",
        message: "سامانه مدیریت و رزرو هوشمند اتاق‌های جلسات آماده بهره‌برداری است.",
        type: "system",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ];
  });

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const addNotification = useCallback(
    (item: Omit<AppNotification, "id" | "createdAt" | "isRead">) => {
      const newNotif: AppNotification = {
        ...item,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        try {
          localStorage.setItem(
            LOCAL_STORAGE_NOTIFICATIONS_KEY,
            JSON.stringify(updated),
          );
        } catch {
          /* ignore */
        }
        return updated;
      });
    },
    [],
  );

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      try {
        localStorage.setItem(
          LOCAL_STORAGE_NOTIFICATIONS_KEY,
          JSON.stringify(updated),
        );
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      try {
        localStorage.setItem(
          LOCAL_STORAGE_NOTIFICATIONS_KEY,
          JSON.stringify(updated),
        );
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_NOTIFICATIONS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  // ==========================================
  // Google Login & Profile Sync
  // ==========================================
  const loginWithGoogle = async (customGoogleUser?: {
    email?: string;
    name?: string;
    picture?: string;
  }) => {
    if (!accessControl.googleAuthEnabled) {
      showToast(
        "ورود با حساب گوگل طبق سیاست امنیتی سازمان توسط مدیر غیرفعال شده است.",
        "error",
      );
      return;
    }

    const email = customGoogleUser?.email || "mohammad.navabi.2025@gmail.com";
    const name = customGoogleUser?.name || "محمد نوابی";
    // Authentic Google Profile Photo
    const picture =
      customGoogleUser?.picture ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=240&auto=format&fit=crop&q=80";

    const googleUser: User = {
      id: `user-google-${Date.now()}`,
      name,
      email,
      orgId: currentOrg?.id || (organizations[0]?.id || "org-1"),
      orgName: currentOrg?.name || "سازمان نوآوری و فناوری",
      role: "org_admin",
      department: "فناوری اطلاعات و ارتباطات",
      jobTitle: "مدیر ارشد سیستم‌ها",
      phone: "09121112233",
      avatar: picture,
      avatarType: "google",
      status: "active",
      createdAt: new Date().toISOString(),
      isProfileComplete: true,
    };

    saveUserSession(googleUser, `google_auth_token_${Date.now()}`);
    closeAuthModal();
    setViewMode("app");
    showToast(
      `ورود با حساب گوگل موفقیت‌آمیز بود! تصویر پروفایل Gmail با نمایه شما ست شد.`,
      "success",
    );
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

        organizations,
        currentOrg,
        activeTab,
        isLoading,
        toast,
        searchQuery,
        selectedRoomForBooking,
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
        refreshOrganizations,
        updateCurrentOrgData,
        updateCurrentUser,

        // Auth Operations
        openAuthModal,
        closeAuthModal,
        login,
        register,
        sendOtp,
        verifyOtp,
        completeRegistration,
        logout,
        forgotPassword,
        resetPassword,
        quickLoginAs,

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
