import type { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import type { User } from "./types";

export const jwtService = new JwtService({
  secret: process.env.JWT_SECRET || "didar_enterprise_jwt_super_secret_key_2026",
});

export function extractJwtUser(
  req: Request,
): { userId: string; organizationId: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  try {
    return jwtService.verify(token) as { userId: string; organizationId: string; role: string };
  } catch {
    return null;
  }
}

export function isProtectedAdmin(
  user: User | { id?: string; email?: string; isPermanentAdmin?: boolean } | undefined,
): boolean {
  if (!user) return false;
  return (
    user.isPermanentAdmin === true ||
    user.id === "user-super" ||
    user.id === "user-super-2" ||
    user.email?.toLowerCase() === "admin@didar.ir" ||
    user.email?.toLowerCase() === "root@didar.ir"
  );
}

export function canManageTeams(role?: string): boolean {
  if (!role) return true;
  const upper = role.toUpperCase();
  return (
    upper === "SUPER_ADMIN" ||
    upper === "ORGANIZATION_ADMIN" ||
    upper === "MANAGER" ||
    upper === "ROOM_MANAGER"
  );
}
