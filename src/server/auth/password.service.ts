import bcrypt from "bcryptjs";

const BCRYPT_PREFIX = "$2";

export function isPasswordHashed(value: string): boolean {
  return value.startsWith(BCRYPT_PREFIX) && value.length >= 50;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain: string, stored: string | undefined | null): Promise<boolean> {
  if (!stored) return false;
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return stored === plain;
}

export async function normalizePasswordForStorage(plain: string): Promise<string> {
  return hashPassword(plain);
}
