import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { ApiService } from '../../services/apiService';
import { Team, User } from '../../types';
import { TeamFormData, TeamViewMode } from './types';
import { TeamsList } from './components/TeamsList';
import { TeamDetail } from './components/TeamDetail';
import { TeamForm } from './components/TeamForm';
import { AlertCircle, Trash2 } from 'lucide-react';

export const TeamsView: React.FC = () => {
  const {
    currentOrg,
    can,
    currentUser,
    showToast,
    openBookingModal,
    setActiveTab,
  } = useApp();

  const [mode, setMode] = useState<TeamViewMode>('list');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const canManage = can('MANAGE_TEAMS');

  const fetchTeamsData = useCallback(async () => {
    if (!currentOrg) return;
    setIsLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        ApiService.getTeams(currentOrg.id),
        ApiService.getUsers(currentOrg.id),
      ]);
      setTeams(teamsData);
      setOrgUsers(usersData);

      // Refresh selectedTeam if viewing detail
      if (selectedTeam) {
        const refreshed = teamsData.find((t) => t.id === selectedTeam.id);
        if (refreshed) {
          setSelectedTeam(refreshed);
        }
      }
    } catch (err: any) {
      console.error('Failed to load teams:', err);
      showToast(err.message || 'خطا در بارگذاری اطلاعات تیم‌ها', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrg, selectedTeam?.id, showToast]);

  useEffect(() => {
    fetchTeamsData();
  }, [currentOrg?.id]);

  const handleSelectTeam = async (team: Team) => {
    try {
      const detailed = await ApiService.getTeam(team.id);
      setSelectedTeam(detailed);
      setMode('detail');
    } catch (err: any) {
      setSelectedTeam(team);
      setMode('detail');
    }
  };

  const handleCreateTeamSubmit = async (data: TeamFormData) => {
    if (!currentOrg) return;
    setIsSubmitting(true);
    try {
      const created = await ApiService.createTeam({
        name: data.name,
        description: data.description,
        memberIds: data.memberIds,
        organizationId: currentOrg.id,
      });
      showToast(`تیم «${created.name}» با موفقیت ایجاد شد`, 'success');
      await fetchTeamsData();
      setSelectedTeam(created);
      setMode('detail');
    } catch (err: any) {
      showToast(err.message || 'خطا در ایجاد تیم', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeamSubmit = async (data: TeamFormData) => {
    if (!selectedTeam) return;
    setIsSubmitting(true);
    try {
      const updated = await ApiService.updateTeam(selectedTeam.id, {
        name: data.name,
        description: data.description,
      });

      // Synchronize members if changed
      const currentMemberIds = new Set(selectedTeam.members?.map((m) => m.userId) || []);
      const newMemberIds = new Set(data.memberIds);

      // Added members
      const toAdd = data.memberIds.filter((id) => !currentMemberIds.has(id));
      if (toAdd.length > 0) {
        await ApiService.addTeamMembers(selectedTeam.id, toAdd);
      }

      // Removed members
      const toRemove = Array.from(currentMemberIds).filter((id) => !newMemberIds.has(id));
      for (const uid of toRemove) {
        await ApiService.removeTeamMember(selectedTeam.id, uid);
      }

      showToast(`تیم «${updated.name}» با موفقیت به‌روزرسانی شد`, 'success');
      await fetchTeamsData();
      const fresh = await ApiService.getTeam(selectedTeam.id);
      setSelectedTeam(fresh);
      setMode('detail');
    } catch (err: any) {
      showToast(err.message || 'خطا در ویرایش تیم', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    setIsSubmitting(true);
    try {
      await ApiService.deleteTeam(teamToDelete.id);
      showToast(`تیم «${teamToDelete.name}» حذف گردید`, 'success');
      setTeamToDelete(null);
      if (selectedTeam?.id === teamToDelete.id) {
        setSelectedTeam(null);
        setMode('list');
      }
      await fetchTeamsData();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف تیم', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMembers = async (teamId: string, userIds: string[]) => {
    try {
      const updated = await ApiService.addTeamMembers(teamId, userIds);
      setSelectedTeam(updated);
      showToast(`${userIds.length} عضو جدید به تیم اضافه شدند`, 'success');
      await fetchTeamsData();
    } catch (err: any) {
      showToast(err.message || 'خطا در افزودن اعضا', 'error');
      throw err;
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const updated = await ApiService.removeTeamMember(teamId, userId);
      setSelectedTeam(updated);
      showToast('عضو مورد نظر از تیم حذف گردید', 'success');
      await fetchTeamsData();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف عضو تیم', 'error');
      throw err;
    }
  };

  const handleBookForTeam = (team: Team) => {
    // Collect team member emails
    const emails = team.members
      ?.map((m) => m.user?.email)
      .filter((em): em is string => Boolean(em)) || [];

    // Save to window / sessionStorage for BookingModal to auto-fill
    try {
      sessionStorage.setItem('rooomchi_prefill_team_emails', JSON.stringify(emails));
      sessionStorage.setItem('rooomchi_prefill_team_name', team.name);
    } catch {}

    openBookingModal();
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* View Switcher */}
      {mode === 'list' && (
        <TeamsList
          teams={teams}
          isLoading={isLoading}
          canManage={canManage}
          onSelectTeam={handleSelectTeam}
          onCreateTeam={() => {
            setSelectedTeam(null);
            setMode('create');
          }}
          onEditTeam={(team) => {
            setSelectedTeam(team);
            setMode('edit');
          }}
          onDeleteTeam={(team) => setTeamToDelete(team)}
          onBookForTeam={handleBookForTeam}
        />
      )}

      {mode === 'detail' && selectedTeam && (
        <TeamDetail
          team={selectedTeam}
          availableOrgUsers={orgUsers}
          canManage={canManage}
          onBack={() => {
            setSelectedTeam(null);
            setMode('list');
          }}
          onEdit={(team) => {
            setSelectedTeam(team);
            setMode('edit');
          }}
          onDelete={(team) => setTeamToDelete(team)}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
          onBookMeetingWithTeam={handleBookForTeam}
        />
      )}

      {(mode === 'create' || mode === 'edit') && (
        <TeamForm
          initialTeam={mode === 'edit' ? selectedTeam : null}
          availableOrgUsers={orgUsers}
          orgName={currentOrg?.name || 'سازمان فعال'}
          isSubmitting={isSubmitting}
          onSave={mode === 'edit' ? handleUpdateTeamSubmit : handleCreateTeamSubmit}
          onCancel={() => {
            if (mode === 'edit' && selectedTeam) {
              setMode('detail');
            } else {
              setSelectedTeam(null);
              setMode('list');
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                حذف تیم «{teamToDelete.name}»
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                آیا از حذف این تیم اطمینان دارید؟ با حذف تیم، اعضای آن حذف نخواهند شد اما این گروه از لیست انتخاب سریع جلسات برداشته خواهد شد.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setTeamToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                id="btn-confirm-delete-team"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isSubmitting ? 'در حال حذف...' : 'تأیید و حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
