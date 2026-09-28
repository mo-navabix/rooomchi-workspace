import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENC_PREFIX = "enc:v1:";

function resolveKey(): Buffer {
  const secret =
    process.env.SETUP_ENCRYPTION_KEY?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "rooomchi_jwt_dev_only_change_in_production";
  return scryptSync(secret, "rooomchi-setup-secrets", 32);
}

export function encryptSecret(plain: string): string {
  if (!plain) return plain;
  if (plain.startsWith(ENC_PREFIX)) return plain;
  const key = resolveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(value: string): string {
  if (!value?.startsWith(ENC_PREFIX)) return value;
  const key = resolveKey();
  const body = value.slice(ENC_PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) return value;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function encryptConfigSecrets<T extends Record<string, unknown>>(
  config: T,
  secretKeys: string[],
): T {
  const out = { ...config };
  for (const key of secretKeys) {
    const v = out[key];
    if (typeof v === "string" && v.trim()) {
      (out as Record<string, unknown>)[key] = encryptSecret(v);
    }
  }
  return out;
}

export function decryptConfigSecrets<T extends Record<string, unknown>>(
  config: T,
  secretKeys: string[],
): T {
  const out = { ...config };
  for (const key of secretKeys) {
    const v = out[key];
    if (typeof v === "string") {
      (out as Record<string, unknown>)[key] = decryptSecret(v);
    }
  }
  return out;
}
