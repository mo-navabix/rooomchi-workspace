import React, { useState, useEffect, useRef } from 'react';
import { Team, User } from '../../types';
import { ApiService } from '../../services/apiService';
import {
  Users,
  Search,
  Check,
  X,
  Plus,
  Building2,
  Mail,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/jalali';

interface ParticipantSelectorProps {
  currentOrgId: string;
  currentUserEmail?: string;
  roomCapacity?: number;
  inviteeEmails: string[];
  onChangeInvitees: (emails: string[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (e: string) => e.trim().toLowerCase();

export const ParticipantSelector: React.FC<ParticipantSelectorProps> = ({
  currentOrgId,
  currentUserEmail,
  roomCapacity,
  inviteeEmails,
  onChangeInvitees,
  showToast,
}) => {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch teams & users for current organization
  useEffect(() => {
    if (!currentOrgId) return;
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      ApiService.getTeams(currentOrgId).catch(() => []),
      ApiService.getUsers(currentOrgId).catch(() => []),
    ])
      .then(([fetchedTeams, fetchedUsers]) => {
        if (!isMounted) return;
        setTeams(fetchedTeams);
        setOrgUsers(fetchedUsers);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentOrgId]);

  // Check prefilled team from session storage
  useEffect(() => {
    try {
      const prefillRaw = sessionStorage.getItem('didar_prefill_team_emails');
      const teamName = sessionStorage.getItem('didar_prefill_team_name');
      if (prefillRaw) {
        const parsed = JSON.parse(prefillRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          sessionStorage.removeItem('didar_prefill_team_emails');
          sessionStorage.removeItem('didar_prefill_team_name');
          addMultipleEmails(parsed, teamName || 'تیم انتخابی');
        }
      }
    } catch {}
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSingleEmail = (raw: string) => {
    const email = normalizeEmail(raw);
    if (!email) return;

    if (!EMAIL_RE.test(email)) {
      showToast('لطفاً یک ایمیل معتبر وارد کنید', 'error');
      return;
    }

    const self = normalizeEmail(currentUserEmail || '');
    if (self && email === self) {
      showToast('شما به عنوان برگزارکننده به طور خودکار در جلسه حضور دارید', 'info');
      setQuery('');
      setIsDropdownOpen(false);
      return;
    }

    if (inviteeEmails.includes(email)) {
      showToast('این شخص قبلاً به لیست مدعوین اضافه شده است', 'info');
      setQuery('');
      setIsDropdownOpen(false);
      return;
    }

    onChangeInvitees([...inviteeEmails, email]);
    setQuery('');
    setIsDropdownOpen(false);
  };

  const removeInvitee = (email: string) => {
    onChangeInvitees(inviteeEmails.filter((e) => e !== email));
  };

  const addMultipleEmails = (emails: string[], groupName?: string) => {
    const self = normalizeEmail(currentUserEmail || '');
    const validEmails = emails
      .map(normalizeEmail)
      .filter((e) => EMAIL_RE.test(e) && e !== self);

    const newEmails = Array.from(new Set([...inviteeEmails, ...validEmails]));
    const addedCount = newEmails.length - inviteeEmails.length;

    onChangeInvitees(newEmails);

    if (addedCount > 0) {
      showToast(
        `${toPersianDigits(addedCount)} نفر ${groupName ? `از ${groupName}` : ''} به جلسه اضافه شدند`,
        'success'
      );
    } else {
      showToast('تمامی اعضای این تیم قبلاً اضافه شده بودند', 'info');
    }
  };

  const toggleTeam = (team: Team) => {
    const memberEmails = (team.members || [])
      .map((m) => m.user?.email)
      .filter((e): e is string => Boolean(e))
      .map(normalizeEmail);

    const isFullyAdded =
      memberEmails.length > 0 &&
      memberEmails.every((em) => inviteeEmails.includes(em));

    if (isFullyAdded) {
      // Remove this team's members
      onChangeInvitees(inviteeEmails.filter((em) => !memberEmails.includes(em)));
      showToast(`اعضای ${team.name} از جلسه حذف شدند`, 'info');
    } else {
      // Add this team's members
      addMultipleEmails(memberEmails, team.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUsers.length > 0 && query.trim()) {
        addSingleEmail(filteredUsers[0].email);
      } else if (query.trim()) {
        addSingleEmail(query);
      }
    }
  };

  // Filtered colleague suggestions based on query
  const filteredUsers = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const self = normalizeEmail(currentUserEmail || '');
    return orgUsers.filter((u) => {
      const email = normalizeEmail(u.email);
      if (email === self) return false;
      if (!q) return true;
      return (
        u.name?.toLowerCase().includes(q) ||
        email.includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    });
  }, [orgUsers, query, currentUserEmail]);

  // Capacity check
  const totalCount = inviteeEmails.length + 1; // +1 for host
  const isOverCapacity = roomCapacity && roomCapacity > 0 ? totalCount > roomCapacity : false;

  return (
    <div ref={containerRef} className="space-y-2.5">
      {/* Header & Capacity */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-[#0F786E] dark:text-[#5eead4]" />
          <span>حاضرین و مدعوین جلسه</span>
          {inviteeEmails.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#0F786E] dark:text-[#5eead4] border border-emerald-200/50">
              {toPersianDigits(inviteeEmails.length)} نفر
            </span>
          )}
        </div>

        {roomCapacity && roomCapacity > 0 && (
          <div
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
              isOverCapacity
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isOverCapacity && <AlertCircle className="w-3 h-3 text-rose-500" />}
            <span>
              ظرفیت: {toPersianDigits(totalCount)} از {toPersianDigits(roomCapacity)} نفر
            </span>
          </div>
        )}
      </div>

      {/* Smart Search & Invite Field */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            id="input-booking-invite"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="جستجو بر اساس نام یا ایمیل همکار (یا تایپ ایمیل و فشردن Enter)..."
            className="w-full text-xs pr-8 pl-16 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#0F172A] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40 focus:border-[#0F786E] transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />

          {query.trim() && (
            <button
              type="button"
              onClick={() => addSingleEmail(query)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0F786E] hover:bg-[#0D6B63] text-white text-[10px] font-bold cursor-pointer transition-colors"
            >
              افزودن
            </button>
          )}
        </div>

        {/* Colleagues Suggestions Dropdown */}
        {isDropdownOpen && (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] shadow-xl p-1 space-y-0.5">
            {filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                {query.includes('@')
                  ? 'کلید Enter را برای افزودن این ایمیل فشار دهید'
                  : 'همکاری با این نام یافت نشد'}
              </div>
            ) : (
              filteredUsers.slice(0, 8).map((user) => {
                const isAlreadyAdded = inviteeEmails.includes(normalizeEmail(user.email));
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        addSingleEmail(user.email);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-right transition-colors cursor-pointer ${
                      isAlreadyAdded
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 opacity-75'
                        : 'hover:bg-slate-50 dark:hover:bg-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[#0F786E] dark:text-[#5eead4] text-[10px] font-bold flex items-center justify-center shrink-0">
                        {user.name ? user.name.slice(0, 1) : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {user.name || user.email}
                          </span>
                          {user.department && (
                            <span className="text-[10px] text-slate-400">
                              ({user.department})
                            </span>
                          )}
                        </div>
                        <p dir="ltr" className="text-[10px] text-slate-400 truncate text-right">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {isAlreadyAdded ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0F786E] dark:text-[#5eead4] shrink-0">
                        <Check className="w-3 h-3" />
                        <span>دعوت شده</span>
                      </span>
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-slate-400 hover:text-[#0F786E] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick Team Chips (Compact & Ergonomic) */}
      {teams.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#0F786E] dark:text-[#5eead4]" />
              <span>افزودن گروهی اعضای تیم:</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {teams.map((team) => {
              const memberEmails = (team.members || [])
                .map((m) => m.user?.email)
                .filter((e): e is string => Boolean(e))
                .map(normalizeEmail);

              const isFullyAdded =
                memberEmails.length > 0 &&
                memberEmails.every((em) => inviteeEmails.includes(em));

              const count = team.memberCount ?? memberEmails.length;

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => toggleTeam(team)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                    isFullyAdded
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#0F786E] dark:text-[#5eead4] border-emerald-300 dark:border-emerald-700/60 shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0F172A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#334155] hover:border-[#0F786E]/50'
                  }`}
                >
                  {isFullyAdded ? (
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{team.name}</span>
                  <span className="text-[9px] opacity-75 font-normal">
                    ({toPersianDigits(count)} نفر)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Invitees Chips Display */}
      {inviteeEmails.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-[#334155]">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>مدعوین این جلسه:</span>
            {inviteeEmails.length > 1 && (
              <button
                type="button"
                onClick={() => onChangeInvitees([])}
                className="text-rose-500 hover:text-rose-600 text-[10px] font-semibold hover:underline cursor-pointer"
              >
                پاک‌کردن همه
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
            {inviteeEmails.map((email) => {
              const matchedUser = orgUsers.find(
                (u) => normalizeEmail(u.email) === normalizeEmail(email)
              );

              return (
                <span
                  key={email}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-[#334155] text-xs font-medium shadow-xs"
                >
                  <span className="w-4 h-4 rounded-full bg-[#0F786E]/15 text-[#0F786E] dark:text-[#5eead4] text-[9px] font-bold flex items-center justify-center shrink-0">
                    {matchedUser?.name ? matchedUser.name.slice(0, 1) : email.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[140px]">
                    {matchedUser?.name || email}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeInvitee(email)}
                    className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-0.5 rounded-sm shrink-0"
                    aria-label="حذف"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
