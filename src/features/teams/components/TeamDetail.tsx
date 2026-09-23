import React, { useState } from 'react';
import { Team, User } from '../../../types';
import { UserAvatar } from '../../../components/common/UserAvatar';
import {
  Users,
  ArrowRight,
  UserPlus,
  Trash2,
  Edit2,
  Calendar,
  Building2,
  Mail,
  Briefcase,
  Shield,
  Search,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface TeamDetailProps {
  team: Team;
  availableOrgUsers: User[];
  canManage: boolean;
  onBack: () => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onAddMembers: (teamId: string, userIds: string[]) => Promise<void>;
  onRemoveMember: (teamId: string, userId: string) => Promise<void>;
  onBookMeetingWithTeam: (team: Team) => void;
}

export const TeamDetail: React.FC<TeamDetailProps> = ({
  team,
  availableOrgUsers,
  canManage,
  onBack,
  onEdit,
  onDelete,
  onAddMembers,
  onRemoveMember,
  onBookMeetingWithTeam,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Existing member IDs
  const existingMemberUserIds = new Set(team.members?.map((m) => m.userId) ?? []);

  // Candidates from organization who are not yet in this team
  const candidateUsers = availableOrgUsers.filter(
    (u) => !existingMemberUserIds.has(u.id) && u.status === 'active'
  );

  const filteredCandidates = candidateUsers.filter((u) => {
    const q = searchMemberQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const handleToggleSelectCandidate = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmAddMembers = async () => {
    if (selectedUserIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onAddMembers(team.id, selectedUserIds);
      setSelectedUserIds([]);
      setIsAddingMember(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemoveMember = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await onRemoveMember(team.id, userId);
    } finally {
      setRemovingUserId(null);
    }
  };

  const members = team.members ?? [];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-[#0F786E] dark:hover:text-[#5eead4] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست تیم‌ها</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onBookMeetingWithTeam(team)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0F786E] hover:bg-[#0D6B63] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>رزرو جلسه برای این تیم</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => onEdit(team)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="ویرایش تیم"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => onDelete(team)}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 cursor-pointer"
              title="حذف تیم"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Team Header Card */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/30 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center font-black text-xl border border-emerald-500/20">
              {team.name.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {team.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                ایجاد شده توسط: {team.createdByName || 'مدیر ارشد سازمان'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[#0F786E] dark:text-[#5eead4] text-xs font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{members.length} عضو فعال</span>
            </div>
          </div>
        </div>

        {team.description && (
          <div className="pt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              توضیحات و اهداف تیم:
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {team.description}
            </p>
          </div>
        )}
      </div>

      {/* Members Section */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0F786E]" />
              لیست اعضای تیم
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              در زمان دعوت این تیم به جلسات، تمام این همکاران به طور خودکار به فهرست حاضرین افزوده خواهند شد.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              id="btn-open-add-member-modal"
              onClick={() => setIsAddingMember(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-[#0F786E] dark:text-[#5eead4] text-xs font-bold border border-emerald-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>افزودن عضو جدید</span>
            </button>
          )}
        </div>

        {/* Member Cards / Table */}
        {members.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              هنوز عضوی در این تیم ثبت نشده است.
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsAddingMember(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F786E] text-white text-xs font-bold cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                افزودن عضو
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((member) => {
              const u = member.user;
              const isBusy = removingUserId === member.userId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0F172A]/50 hover:bg-white dark:hover:bg-[#0F172A] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      user={u}
                      name={u?.name}
                      email={u?.email}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">
                        {u?.name || 'کاربر سیستم'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                        <span dir="ltr" className="truncate">{u?.email}</span>
                        {u?.department && (
                          <>
                            <span>•</span>
                            <span className="truncate">{u.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleConfirmRemoveMember(member.userId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                      title="حذف از تیم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0F786E]" />
                افزودن اعضا به تیم «{team.name}»
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingMember(false);
                  setSelectedUserIds([]);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  placeholder="جستجوی پرسنل بر اساس نام، ایمیل یا دپارتمان..."
                  className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40 dark:text-white"
                />
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>انتخاب شده: {selectedUserIds.length} نفر</span>
                {selectedUserIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer"
                  >
                    لغو انتخاب‌ها
                  </button>
                )}
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {candidateUsers.length === 0
                    ? 'همه پرسنل سازمان در حال حاضر عضو این تیم هستند.'
                    : 'پرسنلی با این نام یا مشخصات یافت نشد.'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {filteredCandidates.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleToggleSelectCandidate(user.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#0F786E]/40 dark:border-[#5eead4]/40'
                            : 'bg-white dark:bg-[#0F172A] border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-[#0F786E] border-[#0F786E] text-white'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate" dir="ltr">
                              {user.email} {user.department ? `· ${user.department}` : ''}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 shrink-0">
                          {user.jobTitle || 'کارمند'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 justify-end bg-slate-50 dark:bg-[#0F172A]/50">
              <button
                type="button"
                onClick={() => {
                  setIsAddingMember(false);
                  setSelectedUserIds([]);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={selectedUserIds.length === 0 || isSubmitting}
                onClick={handleConfirmAddMembers}
                className="px-4 py-2 rounded-xl bg-[#0F786E] hover:bg-[#0D6B63] text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isSubmitting ? 'در حال افزودن...' : `افزودن (${selectedUserIds.length}) عضو`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
