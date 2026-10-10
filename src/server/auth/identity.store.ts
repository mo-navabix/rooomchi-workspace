import { randomUUID } from "crypto";
import { query } from "../persistence/db";
import type { AuthProviderId } from "./types";
import type { User } from "../types";
import * as store from "../persistence/store";
import { normalizePasswordForStorage } from "./password.service";
import { normalizeUserRole } from "../../constants/rbac";

export async function findIdentity(
  organizationId: string,
  provider: AuthProviderId,
  providerUserId: string,
) {
  const { rows } = await query(
    `SELECT * FROM user_external_identities
     WHERE organization_id = $1 AND provider = $2 AND provider_user_id = $3 LIMIT 1`,
    [organizationId, provider, providerUserId],
  );
  return rows[0] as Record<string, unknown> | undefined;
}

export async function linkIdentity(params: {
  userId: string;
  organizationId: string;
  provider: AuthProviderId;
  providerUserId: string;
  providerEmail?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const id = `ext-${randomUUID()}`;
  await query(
    `INSERT INTO user_external_identities (
      id, user_id, organization_id, provider, provider_user_id, provider_email, metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
    ON CONFLICT (organization_id, provider, provider_user_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      provider_email = EXCLUDED.provider_email,
      metadata = EXCLUDED.metadata`,
    [
      id,
      params.userId,
      params.organizationId,
      params.provider,
      params.providerUserId,
      params.providerEmail?.toLowerCase() || null,
      JSON.stringify(params.metadata || {}),
    ],
  );
}

export async function findUserByProviderEmail(
  organizationId: string,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  const byUser = await store.findUserByEmail(normalized);
  if (byUser && byUser.organizationId === organizationId) return byUser;
  const { rows } = await query(
    `SELECT u.* FROM users u
     INNER JOIN user_external_identities e ON e.user_id = u.id
     WHERE e.organization_id = $1 AND LOWER(e.provider_email) = $2 LIMIT 1`,
    [organizationId, normalized],
  );
  if (!rows[0]) return null;
  return store.getUserById(String(rows[0].id));
}

export async function provisionUser(params: {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  provider: AuthProviderId;
  providerUserId: string;
  metadata?: Record<string, unknown>;
  password?: string;
}): Promise<User> {
  const normalizedEmail = params.email.trim().toLowerCase();
  let user = await findUserByProviderEmail(params.organizationId, normalizedEmail);

  const desiredRole = normalizeUserRole(params.role);

  if (!user) {
    const passwordHash = params.password
      ? await normalizePasswordForStorage(params.password)
      : undefined;
    user = await store.insertUser({
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      organizationId: params.organizationId,
      employeeNumber: `EXT-${Math.floor(10000 + Math.random() * 90000)}`,
      firstName: params.firstName,
      lastName: params.lastName,
      name: `${params.firstName} ${params.lastName}`.trim(),
      email: normalizedEmail,
      password: passwordHash,
      status: "ACTIVE",
      role: desiredRole,
      department: "عمومی",
      jobTitle: "کاربر",
      phone: "",
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
    });
  } else {
    const currentRole = normalizeUserRole(user.role);
    const skipRoleSync =
      user.isPermanentAdmin === true || currentRole === "super_admin";
    const displayName = `${params.firstName} ${params.lastName}`.trim();
    const patch: Partial<User> = {
      firstName: params.firstName,
      lastName: params.lastName,
      name: displayName || user.name,
    };
    if (!skipRoleSync && currentRole !== desiredRole) {
      patch.role = desiredRole;
    }
    user = (await store.updateUser(user.id, patch)) ?? user;
  }

  await linkIdentity({
    userId: user.id,
    organizationId: params.organizationId,
    provider: params.provider,
    providerUserId: params.providerUserId,
    providerEmail: normalizedEmail,
    metadata: params.metadata,
  });

  return (await store.getUserById(user.id))!;
}
