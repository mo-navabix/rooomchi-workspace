import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { User, UserRole } from '../../types';
import {
  ROLE_DEFINITIONS,
  PERMISSION_LIST,
  hasPermission,
} from '../../constants/rbac';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Lock,
  Edit2,
  Trash2,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { AdminRbacSkeleton } from '../common/Skeletons';

export const AdminRbacView: React.FC = () => {
  const { currentOrg, showToast, can } = useApp();

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'matrix'>('users');

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('employee');
  const [newDept, setNewDept] = useState<string>('');
  const [newJobTitle, setNewJobTitle] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchUsers = async () => {
    if (!currentOrg) return;
    try {
      setIsLoading(true);
      const data = await ApiService.getUsers(currentOrg.id);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentOrg]);

  const isPermanentUser = (user: User) =>
    Boolean(
      user.isPermanentAdmin ||
      user.id === 'user-super' ||
      user.id === 'user-super-2' ||
      user.email?.toLowerCase() === 'admin@didar.ir' ||
      user.email?.toLowerCase() === 'root@didar.ir'
    );

  const handleRoleChange = async (userId: string, targetRole: UserRole, userName: string) => {
    const target = users.find((u) => u.id === userId);
    if (target && isPermanentUser(target)) {
      showToast('امکان تغییر نقش مدیران اصلی و دائمی سامانه وجود ندارد', 'error');
      return;
    }
    try {
      const updated = await ApiService.updateUserRole(userId, targetRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      showToast(`نقش «${userName}» به ${ROLE_DEFINITIONS[targetRole].titleFa} تغییر یافت`, 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر نقش کاربر', 'error');
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (isPermanentUser(user)) {
      showToast('مدیران اصلی و دائمی سامانه قابل تعلیق نیستند', 'error');
      return;
    }
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const updated = await ApiService.updateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast(
        newStatus === 'suspended'
          ? `حساب کاربری «${user.name}» به حالت تعلیق درآمد`
          : `حساب کاربری «${user.name}» فعال شد`,
        'info'
      );
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت کاربر', 'error');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (isPermanentUser(user)) {
      showToast('این کاربر از مدیران اصلی سایت است و تحت هیچ شرایطی قابل حذف نمی‌باشد', 'error');
      return;
    }
    if (!window.confirm(`آیا از حذف دسترسی «${user.name}» اطمینان دارید؟`)) return;
    try {
      await ApiService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast('کاربر با موفقیت حذف گردید', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف کاربر', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !newName.trim() || !newEmail.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await ApiService.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        orgId: currentOrg.id,
        role: newRole,
        department: newDept || currentOrg.departments[0] || 'عمومی',
        jobTitle: newJobTitle || 'کارشناس',
        phone: newPhone.trim(),
      });
      setUsers((prev) => [...prev, created]);
      showToast(`کاربر «${created.name}» با نقش ${ROLE_DEFINITIONS[newRole].titleFa} ایجاد شد`, 'success');
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
    } catch (err: any) {
      showToast(err.message || 'خطا در ایجاد کاربر', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = u.department?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  const rolesList: UserRole[] = ['super_admin', 'org_admin', 'room_manager', 'employee'];

  if (isLoading) {
    return <AdminRbacSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col gap-4 transition-colors">
        <div>
          <div className="text-xs font-semibold text-[#10B981] dark:text-[#34D399] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>مدیریت دسترسی‌های مبتنی بر نقش (RBAC)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تخصیص نقش‌های چهارگانه سازمانی، تعیین مجوزهای امنیتی و نظارت بر پرسنل
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Sub-tabs */}
          <div className="portal-tabs-scroll bg-slate-100 dark:bg-[#334155] p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'users' ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              کاربران ({users.length})
            </button>
            <button
              onClick={() => setActiveSubTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'matrix' ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ماتریس دسترسی‌ها
            </button>
          </div>

          <button
            onClick={() => {
              setNewDept(currentOrg?.departments[0] || '');
              setIsAddModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center px-3.5 py-2 bg-[#10B981] hover:bg-[#0D6B63] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>افزودن پرسنل</span>
          </button>
        </div>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {rolesList.map((r) => {
          const meta = ROLE_DEFINITIONS[r];
          const count = users.filter((u) => u.role === r).length;
          return (
            <div
              key={r}
              className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                    {meta.titleEn}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{count} کاربر</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{meta.titleFa}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {meta.description}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#334155] flex items-center justify-between text-[10px] text-slate-400">
                <span>تعداد مجوزها:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{meta.permissions.length} مجوز فعال</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SUB-TAB 1: USERS LIST & ROLE SWITCHER */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="جستجو نام، ایمیل یا دپارتمان..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-3 pr-9 py-2 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">فیلتر نقش:</span>
              <div className="relative w-full sm:w-48">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full text-xs pr-3.5 pl-9 py-2 appearance-none bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] rounded-xl text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer"
                >
                  <option value="all">همه نقش‌ها</option>
                  <option value="super_admin">مدیر کل دیدار</option>
                  <option value="org_admin">مدیر سازمان</option>
                  <option value="room_manager">مدیر تشریفات</option>
                  <option value="employee">کارمند عادی</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#334155]">
                  <tr>
                    <th className="px-5 py-4 whitespace-nowrap">نام کاربر و اطلاعات</th>
                    <th className="px-5 py-4 whitespace-nowrap">ایمیل و تماس</th>
                    <th className="px-5 py-4 whitespace-nowrap">واحد و سمت</th>
                    <th className="px-5 py-4 whitespace-nowrap">نقش RBAC (قابل تغییر)</th>
                    <th className="px-5 py-4 whitespace-nowrap">وضعیت</th>
                    <th className="px-5 py-4 text-left whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                  {filteredUsers.map((user) => {
                    const isPermanent = isPermanentUser(user);
                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-[#334155]/50 transition-colors ${
                          isPermanent ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                isPermanent
                                  ? 'bg-gradient-to-tr from-amber-600 to-amber-500 shadow-xs'
                                  : 'bg-gradient-to-tr from-slate-700 to-slate-900'
                              }`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                <span>{user.name}</span>
                                {isPermanent && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/50">
                                    <Shield className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    <span>مدیر اصلی و دائمی (غیرقابل حذف)</span>
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ثبت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          <div className="font-mono text-left" dir="ltr">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{user.department}</div>
                          <div className="text-[11px] text-slate-400">{user.jobTitle || 'پرسنل'}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isPermanent ? (
                            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-bold text-xs min-w-[200px]">
                              <span>مدیر کل سیستم (Super Admin)</span>
                              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                          ) : (
                            <div className="relative inline-block w-full min-w-[200px]">
                              <select
                                value={user.role}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value as UserRole, user.name)
                                }
                                className="w-full text-xs pr-3 pl-8 py-2 appearance-none rounded-xl border border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#0F172A] font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#10B981] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#334155] transition-colors"
                              >
                                <option value="employee">کارمند عادی (Employee)</option>
                                <option value="room_manager">مدیر تشریفات (Room Manager)</option>
                                <option value="org_admin">مدیر ارشد سازمان (Org Admin)</option>
                                <option value="super_admin">مدیر کل سیستم (Super Admin)</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {isPermanent ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فعال دائمی</span>
                            </span>
                          ) : user.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/90 dark:bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>فعال</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100/90 dark:bg-rose-950/50 px-3 py-1 rounded-xl border border-rose-200/50 dark:border-rose-900/40">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>معلق‌شده</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-left whitespace-nowrap">
                          {isPermanent ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>حفاظت‌شده (غیرقابل حذف)</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                  user.status === 'active'
                                    ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40'
                                }`}
                                title={user.status === 'active' ? 'تعلیق حساب' : 'فعال‌سازی حساب'}
                              >
                                {user.status === 'active' ? 'تعلیق' : 'فعال‌سازی'}
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-lg transition-colors"
                                title="حذف کاربر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE PERMISSIONS MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-[#334155] bg-slate-50/50 dark:bg-[#0D1527] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">ماتریس انحصاری مجوزها و دسترسی‌ها</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مقایسه شفاف اختیارات نقش‌ها در لایه‌های مختلف پلتفرم دیدار
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] px-3 py-1 rounded-lg">
              استاندارد امنیت اطلاعات سازمانی
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1527] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-[#334155]">
                <tr>
                  <th className="px-5 py-3.5">عنوان مجوز و شرح</th>
                  <th className="px-5 py-3.5 text-center">دسته</th>
                  <th className="px-4 py-3.5 text-center text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30">
                    مدیر کل دیدار
                  </th>
                  <th className="px-4 py-3.5 text-center text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30">
                    مدیر سازمان
                  </th>
                  <th className="px-4 py-3.5 text-center text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/30">
                    مدیر تشریفات
                  </th>
                  <th className="px-4 py-3.5 text-center text-slate-800 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/40">
                    کارمند عادی
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#334155]">
                {PERMISSION_LIST.map((perm) => (
                  <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-[#334155]/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{perm.titleFa}</div>
                      <div className="text-[11px] text-slate-400 max-w-md">{perm.description}</div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[10px] font-semibold bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200/50 dark:border-[#334155]">
                        {perm.category}
                      </span>
                    </td>
                    {/* Checkmarks per role */}
                    {rolesList.map((r) => {
                      const granted = hasPermission(r, perm.key);
                      return (
                        <td key={r} className="px-4 py-3.5 text-center">
                          {granted ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#10B981]">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-[#0F172A] text-slate-300 dark:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#334155] w-full max-w-md overflow-hidden transition-colors">
            <div className="px-6 py-4 bg-[#0F786E] text-white flex items-center justify-between border-b border-[#334155]">
              <h3 className="text-sm font-bold">افزودن پرسنل جدید به {currentOrg?.name}</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: نیلوفر افشار"
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ایمیل سازمانی *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="n.afshar@company.ir"
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg focus:ring-2 focus:ring-[#10B981] bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white text-left"
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نقش سازمانی
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                  >
                    <option value="employee">کارمند عادی</option>
                    <option value="room_manager">مدیر تشریفات</option>
                    <option value="org_admin">مدیر سازمان</option>
                    <option value="super_admin">مدیر کل سیستم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">دپارتمان</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                  >
                    {(currentOrg?.departments ?? []).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">سمت شغلی</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="مثال: مدیر مارکتینگ"
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره همراه
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-[#334155] rounded-lg text-left bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#334155]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-[#0D6B63] rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'در حال ثبت...' : 'ایجاد حساب کاربری'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
