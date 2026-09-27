import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { hasPermission } from '../../constants/rbac';
import {
  SupportTicket,
  TicketCategory,
  TicketPriority,
  categoryLabels,
  loadTickets,
  priorityLabels,
  statusLabels,
  ticketBelongsToOrg,
  updateTicket,
} from '../../services/supportTickets';
import {
  Ticket,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { AdminBookingsSkeleton } from '../common/Skeletons';

const statusBadge: Record<SupportTicket['status'], string> = {
  open: 'bg-brand-soft text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)]',
  in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  resolved: 'bg-slate-100 text-slate-600 dark:bg-[#334155] dark:text-slate-300',
};

const priorityBadge: Record<TicketPriority, string> = {
  low: 'text-slate-500',
  medium: 'text-amber-600 dark:text-amber-400',
  high: 'text-rose-600 dark:text-rose-400 font-bold',
};

export const AdminSupportTicketsView: React.FC = () => {
  const { currentOrg, userRole, showToast } = useApp();
  const canManage = hasPermission(userRole, 'MANAGE_ORG_SETTINGS');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SupportTicket['status']>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TicketCategory>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<SupportTicket['status']>('open');
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () => {
    setTickets(loadTickets());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const orgTickets = useMemo(() => {
    if (!currentOrg) return [];
    return tickets
      .filter((t) => ticketBelongsToOrg(t, currentOrg.id, currentOrg.name))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tickets, currentOrg]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgTickets.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.userName?.toLowerCase().includes(q) ?? false) ||
        (t.userEmail?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [orgTickets, search, filterStatus, filterCategory]);

  const counts = useMemo(() => {
    const c = { open: 0, in_progress: 0, resolved: 0 };
    orgTickets.forEach((t) => {
      c[t.status] += 1;
    });
    return c;
  }, [orgTickets]);

  const selected = selectedId ? orgTickets.find((t) => t.id === selectedId) : undefined;

  useEffect(() => {
    if (selected) {
      setDraftStatus(selected.status);
      setDraftNote(selected.adminNote ?? '');
    }
  }, [selected?.id, selected?.status, selected?.adminNote]);

  const openDetail = (t: SupportTicket) => setSelectedId(t.id);

  const handleSave = () => {
    if (!selected) return;
    setSaving(true);
    try {
      const next = updateTicket(selected.id, {
        status: draftStatus,
        adminNote: draftNote.trim() || undefined,
      });
      setTickets(next);
      showToast('تیکت به‌روزرسانی شد.', 'success');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="dark-surface-card rounded-3xl p-10 text-center max-w-lg mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">دسترسی محدود</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          مدیریت تیکت‌های پشتیبانی فقط برای مدیران سازمان مجاز است.
        </p>
      </div>
    );
  }

  if (loading) {
    return <AdminBookingsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="bg-white dark:bg-[#1E293B] portal-card-pad rounded-2xl border border-slate-200 dark:border-[#334155] shadow-xs space-y-4">
        <div>
          <div className="text-xs font-semibold text-[var(--brand-primary-light)] dark:text-[var(--brand-primary-lighter)] flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            <span>پشتیبانی سازمان</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            بررسی درخواست‌های پرسنل، تغییر وضعیت و ثبت یادداشت داخلی
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {(
            [
              ['open', 'باز', counts.open],
              ['in_progress', 'در حال بررسی', counts.in_progress],
              ['resolved', 'بسته', counts.resolved],
            ] as const
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterStatus(key)}
              className={`rounded-xl border px-3 py-2.5 text-right transition-colors cursor-pointer ${
                filterStatus === key
                  ? 'border-[var(--brand-primary)] bg-brand-soft/80 dark:bg-[rgb(var(--brand-primary-rgb)/0.12)]'
                  : 'border-slate-200 dark:border-[#334155] hover:bg-slate-50 dark:hover:bg-[#0F172A]/50'
              }`}
            >
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{n}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-[#334155]">
          <div className="relative sm:col-span-6">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس شناسه، عنوان، نام یا ایمیل کاربر..."
              className="w-full pr-10 pl-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.30)] focus:border-[var(--brand-primary)] transition-all"
            />
          </div>
          <div className="relative sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="w-full appearance-none pr-3.5 pl-9 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.30)] focus:border-[var(--brand-primary)] transition-all"
            >
              <option value="all">همه وضعیت‌ها</option>
              {(Object.keys(statusLabels) as SupportTicket['status'][]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative sm:col-span-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
              className="w-full appearance-none pr-3.5 pl-9 py-2.5 rounded-xl text-xs font-medium bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.30)] focus:border-[var(--brand-primary)] transition-all"
            >
              <option value="all">همه دسته‌ها</option>
              {(Object.keys(categoryLabels) as TicketCategory[]).map((c) => (
                <option key={c} value={c}>{categoryLabels[c]}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-[#334155] rounded-3xl overflow-hidden shadow-xs min-h-[20rem]">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-[#334155] flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            {filtered.length} تیکت
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-16">تیکتی برای نمایش نیست.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-[#334155]/60 max-h-[32rem] overflow-y-auto">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(t)}
                    className={`w-full text-right px-4 py-4 hover:bg-slate-50 dark:hover:bg-[#0F172A]/40 transition-colors cursor-pointer ${
                      selectedId === t.id ? 'bg-brand-soft/60 dark:bg-[rgb(var(--brand-primary-rgb)/0.1)]' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400">{t.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge[t.status]}`}>
                        {statusLabels[t.status]}
                      </span>
                      <span className={`text-[10px] ${priorityBadge[t.priority]}`}>
                        {priorityLabels[t.priority]}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.subject}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t.userName ?? 'کاربر'} · {categoryLabels[t.category]} ·{' '}
                      {new Date(t.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 dark-surface-card rounded-3xl p-5 min-h-[20rem] sticky top-4">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 gap-2 py-12">
              <MessageSquare className="w-8 h-8 opacity-40" />
              <p className="text-sm">یک تیکت از لیست انتخاب کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-slate-400">{selected.id}</p>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{selected.subject}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#334155] cursor-pointer"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 border-y border-slate-100 dark:border-[#334155] py-3">
                <p className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {selected.userName ?? '—'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span dir="ltr" className="truncate">{selected.userEmail ?? '—'}</span>
                </p>
                {selected.contactPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span dir="ltr">{selected.contactPhone}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {new Date(selected.createdAt).toLocaleString('fa-IR')}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">شرح درخواست</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selected.description}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  وضعیت
                </label>
                <div className="relative">
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value as SupportTicket['status'])}
                    className="w-full appearance-none pr-4 pl-10 py-3 rounded-xl text-sm font-medium bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:border-[var(--brand-primary-light)] transition-all shadow-2xs"
                  >
                    {(Object.keys(statusLabels) as SupportTicket['status'][]).map((s) => (
                      <option key={s} value={s}>
                        {statusLabels[s]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  یادداشت داخلی (ادمین)
                </label>
                <textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  rows={3}
                  placeholder="برای تیم پشتیبانی؛ کاربر این متن را نمی‌بیند."
                  className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--brand-primary-light)] focus:border-[var(--brand-primary-light)] resize-y transition-all"
                />
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
