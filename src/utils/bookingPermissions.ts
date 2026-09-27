import type { Booking, User } from "../types";

/** True when the user created the booking (invitees cannot cancel). */
export function isBookingOrganizer(
  booking: Pick<Booking, "organizerId" | "organizerEmail">,
  user: Pick<User, "id" | "email">,
): boolean {
  if (booking.organizerId && booking.organizerId === user.id) return true;
  const orgEmail = booking.organizerEmail?.trim().toLowerCase();
  const email = user.email?.trim().toLowerCase();
  return !!orgEmail && !!email && orgEmail === email;
}
