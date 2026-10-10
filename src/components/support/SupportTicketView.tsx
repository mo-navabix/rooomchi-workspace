import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TicketCategory,
  TicketPriority,
  SupportTicket,
  categoryLabels,
  priorityLabels,
  statusLabels,
  mapApiSupportTicket,
} from '../../services/supportTickets';
import { ApiService } from '../../services/apiService';
import { Ticket, Send, Clock, CheckCircle2, Inbox, ChevronDown } from 'lucide-react';

export type { TicketCategory, TicketPriority, SupportTicket };

export const SupportTicketView: React.FC = () => {
  const { currentUser, currentOrg, isAuthenticated, openAuthModal, showToast } = useApp();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('technical');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const rows = await ApiService.getSupportTickets();
        setTickets(rows.map((r) => mapApiSupportTicket(r, currentOrg?.name)));
      } catch {
        setTickets([]);
      }
    })();
    if (currentUser?.phone) setContactPhone(currentUser.phone);
  }, [currentUser?.phone, isAuthenticated, currentOrg?.name]);

  const myTickets = tickets.filter(
    (t) => !currentUser || t.userEmail === currentUser.email || t.userId === currentUser.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      openAuthModal('login');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      showToast('عنوان و شرح تیکت الزامی است.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const created = await ApiService.createSupportTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        contactPhone: contactPhone.trim() || undefined,
      });
      const ticket = mapApiSupportTicket(created, currentOrg?.name);
      setTickets((prev) => [ticket, ...prev]);
      setSubject('');
      setDescription('');
      setCategory('technical');
      setPriority('medium');
      showToast(`تیکت ${ticket.id} با موفقیت ثبت شد.`, 'success');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="dark-surface-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl brand-icon-tile brand-icon-tile--lg">
          <Ticket className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">ثبت تیکت پشتیبانی</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          برای ثبت درخواست پشتیبانی ابتدا وارد حساب کاربری شوید.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-brand cursor-pointer"
        >
          ورود به سیستم
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl min-w-0 mx-auto w-full" id="support-ticket-view">
      <form onSubmit={handleSubmit} className="dark-surface-card rounded-3xl p-5 sm:p-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">عنوان تیکت</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثلاً: خطا در رزرو اتاق جلسه"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)]"
            maxLength={120}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">دسته‌بندی</span>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full appearance-none pr-3.5 pl-10 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] focus:border-[var(--brand-primary)] transition-all"
              >
                {(Object.keys(categoryLabels) as TicketCategory[]).map((key) => (
                  <option key={key} value={key}>{categoryLabels[key]}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">اولویت</span>
            <div className="relative">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full appearance-none pr-3.5 pl-10 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)] focus:border-[var(--brand-primary)] transition-all"
              >
                {(Object.keys(priorityLabels) as TicketPriority[]).map((key) => (
                  <option key={key} value={key}>{priorityLabels[key]}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">شرح مشکل یا درخواست</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="جزئیات را بنویسید تا سریع‌تر راهنمایی شوید..."
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)]"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">شماره تماس (اختیاری)</span>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            dir="ltr"
            placeholder="09xxxxxxxxx"
            className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#334155] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary-rgb)/0.40)]"
          />
        </label>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[var(--brand-primary-light)] hover:bg-[var(--brand-primary-hover)] disabled:opacity-60 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'در حال ارسال…' : 'ارسال تیکت'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Inbox className="w-4 h-4 text-[var(--brand-primary)]" />
          تیکت‌های من
        </h2>
        {myTickets.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center dark-surface-card rounded-2xl">
            هنوز تیکتی ثبت نکرده‌اید.
          </p>
        ) : (
          <ul className="space-y-2">
            {myTickets.map((t) => (
              <li
                key={t.id}
                className="dark-surface-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 text-right">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">{t.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'resolved'
                          ? 'bg-slate-100 text-slate-600 dark:bg-[#334155] dark:text-slate-300'
                          : t.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-brand-soft text-brand dark:bg-[rgb(var(--brand-primary-rgb)/0.15)] dark:text-[var(--brand-primary-on-dark)]'
                      }`}
                    >
                      {statusLabels[t.status]}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">{t.subject}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {categoryLabels[t.category]} · اولویت {priorityLabels[t.priority]}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                  {t.status === 'resolved' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {new Date(t.createdAt).toLocaleDateString('fa-IR')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
