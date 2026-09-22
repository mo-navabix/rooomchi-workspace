import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { ApiService } from '../../services/apiService';
import {
  UserPlus,
  Users,
  UserCheck,
  Search,
  Check,
  X,
  Plus,
  Building2,
  ChevronDown,
} from 'lucide-react';

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
  const [activeMode, setActiveMode] = useState<'individual' | 'teams'>('individual');
  const [emailInput, setEmailInput] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Fetch teams & users for current organization
  useEffect(() => {
    if (!currentOrgId) return;
    let isMounted = true;
    setIsLoadingTeams(true);

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
        if (isMounted) setIsLoadingTeams(false);
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

  const addSingleEmail = (raw: string) => {
    const email = normalizeEmail(raw);
    if (!email) return;

    if (!EMAIL_RE.test(email)) {
      showToast('لطفاً یک ایمیل معتبر وارد کنید', 'error');
      return;
    }

    const self = normalizeEmail(currentUserEmail || '');
    if (self && email === self) {
      showToast('خودتان برگزارکننده جلسه هستید؛ نیازی به افزودن نیست', 'info');
      return;
    }

    if (inviteeEmails.includes(email)) {
      showToast('این شخص قبلاً به لیست حاضرین اضافه شده است', 'info');
      setEmailInput('');
      return;
    }

    if (roomCapacity && 1 + inviteeEmails.length >= roomCapacity) {
      showToast(`ظرفیت این اتاق حداکثر ${roomCapacity} نفر است`, 'error');
      return;
    }

    onChangeInvitees([...inviteeEmails, email]);
    setEmailInput('');
    setIsUserDropdownOpen(false);
  };

  const addMultipleEmails = (emails: string[], sourceName?: string) => {
    const self = normalizeEmail(currentUserEmail || '');
    const validToAdd: string[] = [];

    for (const raw of emails) {
      const em = normalizeEmail(raw);
      if (!em || !EMAIL_RE.test(em)) continue;
      if (self && em === self) continue;
      if (inviteeEmails.includes(em) || validToAdd.includes(em)) continue;

      if (roomCapacity && 1 + inviteeEmails.length + validToAdd.length >= roomCapacity) {
        showToast(`حداکثر ظرفیت اتاق (${roomCapacity} نفر) تکمیل شد`, 'error');
        break;
      }
      validToAdd.push(em);
    }

    if (validToAdd.length === 0) {
      showToast(`تمام اعضای ${sourceName || 'این گروه'} قبلاً در جلسه حضور دارند`, 'info');
      return;
    }

    onChangeInvitees([...inviteeEmails, ...validToAdd]);
    showToast(`${validToAdd.length} نفر از اعضای ${sourceName || 'تیم'} به جلسه افزوده شدند`, 'success');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSingleEmail(emailInput);
    }
  };

  const removeInvitee = (email: string) => {
    onChangeInvitees(inviteeEmails.filter((e) => e !== email));
  };

  // Filter colleague suggestions
  const colleagueSuggestions = orgUsers.filter((u) => {
    const email = normalizeEmail(u.email);
    if (!email || email === normalizeEmail(currentUserEmail || '')) return false;
    if (inviteeEmails.includes(email)) return false;
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      email.includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-2.5 pt-1">
      {/* Header and Mode Selector Tab */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-[#0F786E]" />
          حاضرین و مدعوین جلسه
          <span className="text-[11px] font-normal text-slate-400">
            ({inviteeEmails.length} نفر افزوده شده)
          </span>
        </span>

        {/* Tab switchers: Individual Users vs Teams */}
        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
          <button
            type="button"
            id="tab-select-individual"
            onClick={() => setActiveMode('individual')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeMode === 'individual'
                ? 'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            افزودن فردی
          </button>
          <button
            type="button"
            id="tab-select-teams"
            onClick={() => setActiveMode('teams')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              activeMode === 'teams'
                ? 'bg-white dark:bg-[#0F172A] text-[#0F786E] dark:text-[#5eead4] shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>انتخاب تیم / گروه</span>
            {teams.length > 0 && (
              <span className="text-[9px] px-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0F786E] dark:text-[#5eead4]">
                {teams.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mode 1: Individual Users Input */}
      {activeMode === 'individual' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="email"
              id="input-booking-invite"
              dir="ltr"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setUserSearchQuery(e.target.value);
                setIsUserDropdownOpen(true);
              }}
              onFocus={() => setIsUserDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="email@company.ir — کلید Enter"
              className="w-full text-xs sm:text-sm pr-3 pl-16 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40 placeholder:text-slate-400 dark:text-white"
            />

            <button
              type="button"
              onClick={() => addSingleEmail(emailInput)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#0F786E] hover:bg-[#0D6B63] text-white text-[11px] font-bold cursor-pointer transition-colors"
            >
              افزودن
            </button>
          </div>

          {/* Quick Colleague Suggestion Dropdown */}
          {isUserDropdownOpen && colleagueSuggestions.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1E293B] shadow-md p-1.5 max-h-40 overflow-y-auto space-y-1">
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                <span>پیشنهاد همکاران در این سازمان:</span>
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  بستن
                </button>
              </div>
              {colleagueSuggestions.slice(0, 6).map((colleague) => (
                <div
                  key={colleague.id}
                  onClick={() => {
                    addSingleEmail(colleague.email);
                    setIsUserDropdownOpen(false);
                  }}
                  className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-[#0F172A] cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {colleague.name.slice(0, 1)}
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {colleague.name}
                    </span>
                    {colleague.department && (
                      <span className="text-[10px] text-slate-400">({colleague.department})</span>
                    )}
                  </div>
                  <span dir="ltr" className="text-[10px] text-slate-400">
                    {colleague.email}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Teams Selection */}
      {activeMode === 'teams' && (
        <div className="space-y-2 bg-slate-50 dark:bg-[#0F172A]/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            برای افزودن گروهی همه اعضای یک تیم، روی دکمه افزودن کلیک کنید:
          </p>

          {isLoadingTeams ? (
            <div className="py-4 text-center text-xs text-slate-400">در حال دریافت تیم‌ها...</div>
          ) : teams.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              هنوز تیمی در این سازمان تعریف نشده است.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {teams.map((team) => {
                const memberEmails = (team.members || [])
                  .map((m) => m.user?.email)
                  .filter((e): e is string => Boolean(e));

                const alreadyAddedCount = memberEmails.filter((em) =>
                  inviteeEmails.includes(normalizeEmail(em))
                ).length;

                const isFullyAdded =
                  memberEmails.length > 0 && alreadyAddedCount === memberEmails.length;

                return (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isFullyAdded
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-white dark:bg-[#1E293B] border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center font-bold text-xs shrink-0">
                        {team.name.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {team.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({team.memberCount ?? memberEmails.length} عضو)
                          </span>
                        </div>
                        {team.description && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {team.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {isFullyAdded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F786E] dark:text-[#5eead4] bg-white dark:bg-[#0F172A] px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                          <Check className="w-3 h-3 stroke-[3]" />
                          همه اعضا در جلسه هستند
                        </span>
                      ) : (
                        <button
                          type="button"
                          id={`btn-add-team-members-${team.id}`}
                          onClick={() => addMultipleEmails(memberEmails, team.name)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0F786E] hover:bg-[#0D6B63] text-white text-[11px] font-bold cursor-pointer transition-colors shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                          <span>
                            افزودن تیم
                            {alreadyAddedCount > 0 && ` (${memberEmails.length - alreadyAddedCount} نفر باقی‌مانده)`}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Invitees Chips Display */}
      {inviteeEmails.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>فهرست مدعوین جلسه:</span>
            <button
              type="button"
              onClick={() => onChangeInvitees([])}
              className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              پاک‌کردن همه
            </button>
          </div>

          <ul className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {inviteeEmails.map((email) => {
              // Lookup user name if exists
              const matchedUser = orgUsers.find(
                (u) => normalizeEmail(u.email) === normalizeEmail(email)
              );

              return (
                <li key={email}>
                  <span className="inline-flex items-center gap-1.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <span className="font-semibold">{matchedUser?.name || email}</span>
                    {matchedUser && (
                      <span dir="ltr" className="text-[10px] text-slate-400">
                        ({email})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeInvitee(email)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer shrink-0 transition-colors mr-0.5"
                      aria-label="حذف"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
