import React, { useState } from 'react';
import { Team } from '../../../types';
import { toPersianDigits } from '../../../utils/jalali';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  Shield,
  Clock,
} from 'lucide-react';

interface TeamsListProps {
  teams: Team[];
  isLoading: boolean;
  canManage: boolean;
  onSelectTeam: (team: Team) => void;
  onCreateTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
  onBookForTeam: (team: Team) => void;
}

export const TeamsList: React.FC<TeamsListProps> = ({
  teams,
  isLoading,
  canManage,
  onSelectTeam,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
  onBookForTeam,
}) => {
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filtered = teams.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const totalMembers = teams.reduce(
    (sum, t) => sum + (t.memberCount ?? t.members?.length ?? 0),
    0,
  );

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0 flex-1 text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              تیم‌ها و گروه‌های کاری سازمان
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {search.trim()
                ? `${toPersianDigits(filtered.length)} نتیجه از ${toPersianDigits(teams.length)} تیم`
                : `${toPersianDigits(teams.length)} تیم ثبت‌شده در سازمان`}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                <Users className="w-3 h-3" />
                {toPersianDigits(teams.length)} تیم
              </span>
              {totalMembers > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {toPersianDigits(totalMembers)} عضو
                </span>
              )}
            </div>
          </div>

          {canManage && (
            <button
              type="button"
              id="btn-create-new-team"
              onClick={onCreateTeam}
              className="portal-btn-primary w-full lg:w-auto inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold cursor-pointer shadow-sm shadow-[#0F786E]/15 dark:shadow-black/30 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد تیم جدید</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#1E293B] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-[#334155] shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="input-search-teams"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام یا شرح تیم..."
            className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F786E]/40 dark:text-white"
          />
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800 animate-pulse p-5 space-y-3"
            >
              <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-700 rounded-md" />
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-md" />
              <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            {search ? 'تیمی با این مشخصات یافت نشد' : 'هنوز تیمی ثبت نشده است'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
            {search
              ? 'کلمه کلیدی دیگری را جستجو کنید یا فیلتر را پاک کنید.'
              : 'با ایجاد گروه‌های کاری مثل «تیم مارکتینگ» یا «تیم طراحی»، در هنگام رزرو اتاق با یک کلیک همه اعضا را دعوت کنید.'}
          </p>
          {canManage && !search && (
            <button
              type="button"
              id="btn-empty-create-team"
              onClick={onCreateTeam}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F786E] hover:bg-[#0D6B63] text-white text-xs font-bold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              ایجاد اولین تیم
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((team) => {
            const memberCount = team.memberCount ?? team.members?.length ?? 0;
            const previewMembers = team.members?.slice(0, 4) ?? [];

            return (
              <div
                key={team.id}
                id={`team-card-${team.id}`}
                className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all hover:border-[#0F786E]/40 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon, Name & Menu */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-[#0F786E] dark:text-[#5eead4] flex items-center justify-center font-bold text-base border border-emerald-500/20 shrink-0">
                        {team.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3
                          onClick={() => onSelectTeam(team)}
                          className="font-bold text-slate-800 dark:text-white text-sm hover:text-[#0F786E] dark:hover:text-[#5eead4] transition-colors cursor-pointer line-clamp-1"
                          title={team.name}
                        >
                          {team.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#0F786E]" />
                            {memberCount} عضو
                          </span>
                          {team.createdByName && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{team.createdByName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        id={`btn-menu-team-${team.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === team.id ? null : team.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        aria-label="منوی عملیات"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === team.id && (
                        <div
                          className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-[#0F172A] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-20 text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onSelectTeam(team);
                            }}
                            className="w-full px-3 py-2 text-right hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            مشاهده و مدیریت اعضا
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onEditTeam(team);
                              }}
                              className="w-full px-3 py-2 text-right hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                              ویرایش تیم
                            </button>
                          )}

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteTeam(team);
                              }}
                              className="w-full px-3 py-2 text-right hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer border-t border-slate-100 dark:border-slate-800/80"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              حذف تیم
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[34px] mb-4">
                    {team.description || 'توضیحاتی برای این تیم ثبت نشده است.'}
                  </p>

                  {/* Members Avatars preview */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center -space-x-2 space-x-reverse">
                      {previewMembers.map((tm, idx) => (
                        <div
                          key={tm.id || idx}
                          title={tm.user?.name || 'عضو تیم'}
                          className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-[#1E293B] flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-200"
                        >
                          {(tm.user?.name || 'ع').slice(0, 1)}
                        </div>
                      ))}
                      {memberCount > 4 && (
                        <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-white dark:border-[#1E293B] flex items-center justify-center text-[10px] font-bold text-[#0F786E] dark:text-[#5eead4]">
                          +{memberCount - 4}
                        </div>
                      )}
                      {memberCount === 0 && (
                        <span className="text-[11px] text-slate-400 italic">بدون عضو</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTeam(team)}
                      className="text-xs font-semibold text-[#0F786E] dark:text-[#5eead4] hover:underline cursor-pointer"
                    >
                      جزئیات تیم ←
                    </button>
                  </div>
                </div>

                {/* Quick Meeting Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onBookForTeam(team)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-[#0F786E] dark:text-[#5eead4] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>رزرو جلسه با این تیم</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
