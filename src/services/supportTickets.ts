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

export function mapApiSupportTicket(
  row: Record<string, unknown>,
  orgName?: string,
): SupportTicket {
  return {
    id: String(row.id),
    subject: String(row.subject),
    category: row.category as TicketCategory,
    priority: row.priority as TicketPriority,
    description: String(row.description),
    contactPhone: row.contactPhone ? String(row.contactPhone) : undefined,
    userId: row.userId ? String(row.userId) : undefined,
    userEmail: row.userEmail ? String(row.userEmail) : undefined,
    userName: row.userName ? String(row.userName) : undefined,
    orgId: row.orgId ? String(row.orgId) : undefined,
    orgName,
    status: row.status as SupportTicket['status'],
    adminNote: row.adminNote ? String(row.adminNote) : undefined,
    createdAt: String(row.createdAt),
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}

export function ticketBelongsToOrg(ticket: SupportTicket, orgId: string, orgName?: string): boolean {
  if (ticket.orgId && ticket.orgId === orgId) return true;
  if (!ticket.orgId && orgName && ticket.orgName === orgName) return true;
  return false;
}
