export type TicketCategory =
  | 'technical'
  | 'booking'
  | 'account'
  | 'suggestion'
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high';

export type SupportTicket = {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  contactPhone?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  orgId?: string;
  orgName?: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
};

export const STORAGE_KEY = 'rooomchi-support-tickets';

export const categoryLabels: Record<TicketCategory, string> = {
  technical: 'مشکل فنی',
  booking: 'رزرو و اتاق‌ها',
  account: 'حساب کاربری',
  suggestion: 'پیشنهاد',
  other: 'سایر',
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'فوری',
};

export const statusLabels: Record<SupportTicket['status'], string> = {
  open: 'باز',
  in_progress: 'در حال بررسی',
  resolved: 'بسته شده',
};

export function loadTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupportTicket[];
  } catch {
    return [];
  }
}

export function saveTickets(tickets: SupportTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

export function updateTicket(
  id: string,
  patch: Partial<Pick<SupportTicket, 'status' | 'adminNote' | 'priority'>>
): SupportTicket[] {
  const next = loadTickets().map((t) =>
    t.id === id
      ? { ...t, ...patch, updatedAt: new Date().toISOString() }
      : t
  );
  saveTickets(next);
  return next;
}

export function ticketBelongsToOrg(ticket: SupportTicket, orgId: string, orgName?: string): boolean {
  if (ticket.orgId && ticket.orgId === orgId) return true;
  if (!ticket.orgId && orgName && ticket.orgName === orgName) return true;
  return false;
}
