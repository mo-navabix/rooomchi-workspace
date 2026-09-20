import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { ActiveTab, Organization, Permission, Room, User, UserRole } from '../types';
import { ApiService } from '../services/apiService';
import { hasPermission } from '../constants/rbac';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type AuthModalView = 'login' | 'register' | 'forgot' | 'reset';
export type AppTheme = 'light' | 'dark';
export type ViewMode = 'landing' | 'app';

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
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  openBookingModal: (room?: Room) => void;
  closeBookingModal: () => void;
  openProvisioningModal: () => void;
  closeProvisioningModal: () => void;
  setSearchQuery: (q: string) => void;
  refreshOrganizations: () => Promise<void>;
  updateCurrentOrgData: (updated: Partial<Organization>) => void;

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
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; simulatedCode?: string }>;
  resetPassword: (data: { email: string; code: string; newPassword: string }) => Promise<void>;
  quickLoginAs: (userRole: UserRole) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'didar_auth_user';
const LOCAL_STORAGE_TOKEN_KEY = 'didar_auth_token';
const LOCAL_STORAGE_THEME_KEY = 'didar_theme';
const LOCAL_STORAGE_VIEW_KEY = 'didar_view_mode';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme & View Mode State
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VIEW_KEY);
      if (saved === 'landing' || saved === 'app') return saved;
    } catch {}
    // Default to landing page for visitors
    return 'landing';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isProvisioningModalOpen, setIsProvisioningModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');
  const [pendingResetEmail, setPendingResetEmail] = useState<string>('');

  // If currentUser exists, use their role, else fallback to 'employee'
  const userRole: UserRole = currentUser?.role || 'employee';
  const isAuthenticated = !!currentUser;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // RBAC Permission Checker
  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(userRole, permission);
    },
    [userRole]
  );

  const refreshOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      const orgs = await ApiService.getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0 && (!currentOrg || !orgs.some((o) => o.id === currentOrg.id))) {
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
      showToast(err.message || 'خطا در بارگذاری سازمان‌ها', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, currentUser, showToast]);

  useEffect(() => {
    refreshOrganizations();
  }, []);

  // Sync user state with localStorage
  const saveUserSession = (user: User, token: string) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, token);
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  };

  const clearUserSession = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }
  };

  const switchOrg = (orgId: string) => {
    const found = organizations.find((o) => o.id === orgId);
    if (found) {
      setCurrentOrg(found);
      showToast(`سازمان فعال به «${found.name}» تغییر یافت`, 'info');
    }
  };

  const setUserRole = (role: UserRole) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, role };
      saveUserSession(updatedUser, 'session_token');
    } else {
      // Create a guest session with this role
      const guestUser: User = {
        id: `guest-${Date.now()}`,
        name: role === 'super_admin' ? 'مدیر ارشد دیدار' : 'کاربر سازمانی',
        email: `${role}@didar.ir`,
        orgId: currentOrg?.id || 'org-1',
        orgName: currentOrg?.name,
        role,
        department: 'مدیریت',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      saveUserSession(guestUser, 'guest_token');
    }
    showToast(`نقش کاربری به «${role}» تغییر یافت`, 'info');
  };

  const updateCurrentOrgData = (updated: Partial<Organization>) => {
    if (!currentOrg) return;
    const newOrg = { ...currentOrg, ...updated };
    setCurrentOrg(newOrg);
    setOrganizations((prev) => prev.map((o) => (o.id === newOrg.id ? newOrg : o)));
  };

  // Auth Operations
  const openAuthModal = (view: AuthModalView = 'login') => {
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
      throw new Error('توکن احراز هویت از سرور دریافت نشد');
    }
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode('app');
    showToast(`خوش آمدید، ${res.user.name}`, 'success');

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
    const orgId = data.orgId || currentOrg?.id;
    if (!orgId) {
      throw new Error('لطفاً ابتدا یک سازمان را انتخاب یا راه‌اندازی کنید، سپس ثبت‌نام کنید');
    }
    const res = await ApiService.register({
      ...data,
      orgId,
    });
    const token = res.token || (res as { accessToken?: string }).accessToken;
    if (!token) {
      throw new Error('توکن احراز هویت از سرور دریافت نشد');
    }
    saveUserSession(res.user, token);
    closeAuthModal();
    setViewMode('app');
    showToast(`ثبت‌نام با موفقیت انجام شد. به سامانه دیدار خوش آمدید`, 'success');
  };

  const logout = () => {
    clearUserSession();
    showToast('شما با موفقیت از سامانه دیدار خارج شدید', 'info');
    setActiveTab('dashboard');
  };

  const forgotPassword = async (email: string) => {
    setPendingResetEmail(email);
    const res = await ApiService.forgotPassword(email);
    setAuthModalView('reset');
    return res;
  };

  const resetPassword = async (data: { email: string; code: string; newPassword: string }) => {
    await ApiService.resetPassword(data);
    showToast('رمز عبور شما بازنشانی شد. لطفاً وارد شوید', 'success');
    setAuthModalView('login');
  };

  // Preset Fast Switching for quick demonstrations
  const quickLoginAs = async (role: UserRole) => {
    const roleAccounts: Record<UserRole, { email: string; password: string }> = {
      super_admin: { email: 'admin@didar.ir', password: 'password123' },
      org_admin: { email: 'admin@technova.ir', password: 'password123' },
      room_manager: { email: 'facility@technova.ir', password: 'password123' },
      employee: { email: 'employee@technova.ir', password: 'password123' },
    };

    const creds = roleAccounts[role];
    try {
      await login(creds);
    } catch (e: any) {
      showToast(e.message || 'خطا در ورود سریع', 'error');
    }
  };

  const openBookingModal = (room?: Room) => {
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
        openProvisioningModal,
        closeProvisioningModal,
        setSearchQuery,
        refreshOrganizations,
        updateCurrentOrgData,

        // Auth Operations
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        quickLoginAs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
