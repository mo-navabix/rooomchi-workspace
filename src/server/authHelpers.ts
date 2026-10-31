import type { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import type { Booking, User } from "./types";

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET must be set in production");
  }
  return secret || "rooomchi_jwt_dev_only_change_in_production";
}

export const jwtService = new JwtService({
  secret: resolveJwtSecret(),
});

export type JwtPayload = { userId: string; organizationId: string; role: string };

export function extractJwtUser(req: Request): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  try {
    return jwtService.verify(token) as JwtPayload;
  } catch {
    return null;
  }
}

/** Resolve tenant org for API reads; non–super-admins are always scoped to their JWT org. */
export function resolveRequestOrgId(
  jwtUser: JwtPayload | null,
  queryOrgId: unknown,
): string | undefined {
  const requested = queryOrgId != null && String(queryOrgId).trim()
    ? String(queryOrgId).trim()
    : undefined;
  if (!jwtUser) return requested;
  const role = (jwtUser.role || "").toUpperCase();
  if (role === "SUPER_ADMIN") {
    return requested || jwtUser.organizationId || undefined;
  }
  return jwtUser.organizationId || requested;
}

export function isProtectedAdmin(
  user: User | { id?: string; email?: string; isPermanentAdmin?: boolean } | undefined,
): boolean {
  if (!user) return false;
  return (
    user.isPermanentAdmin === true ||
    user.id === "user-super" ||
    user.id === "user-super-2" ||
    user.email?.toLowerCase() === "admin@rooomchi.ir" ||
    user.email?.toLowerCase() === "root@rooomchi.ir"
  );
}

export function canManageTeams(role?: string): boolean {
  if (!role) return true;
  const upper = role.toUpperCase();
  return (
    upper === "SUPER_ADMIN" ||
    upper === "ORGANIZATION_ADMIN" ||
    upper === "MANAGER" ||
    upper === "ROOM_MANAGER" ||
    upper === "SUPERVISOR"
  );
}

/** True if the signed-in user created the booking (not merely an invitee). */
export function isBookingOrganizer(
  booking: Pick<Booking, "organizerId" | "organizerEmail">,
  user: { userId: string; email?: string | null },
): boolean {
  if (booking.organizerId && booking.organizerId === user.userId) return true;
  const orgEmail = booking.organizerEmail?.trim().toLowerCase();
  const email = user.email?.trim().toLowerCase();
  return !!orgEmail && !!email && orgEmail === email;
}

/** Roles that may list all organization bookings (calendar admin, analytics, etc.). */
export function canViewAllOrgBookings(role?: string): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return (
    upper === "SUPER_ADMIN" ||
    upper === "ORGANIZATION_ADMIN" ||
    upper === "ORG_ADMIN" ||
    upper === "ROOM_MANAGER" ||
    upper === "MANAGER"
  );
}
