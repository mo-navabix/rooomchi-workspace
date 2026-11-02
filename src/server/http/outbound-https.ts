import fs from "node:fs";
import https from "node:https";
import tls from "node:tls";

let trustStoreReady = false;

/** Mozilla bundled + OS trust store (Windows/macOS/Linux). Call before outbound HTTPS. */
export function ensureOutboundTlsTrustStore(): void {
  if (trustStoreReady) return;
  trustStoreReady = true;

  if (typeof tls.setDefaultCACertificates !== "function") return;

  try {
    const bundled = tls.getCACertificates("default");
    let merged = bundled;
    try {
      const system = tls.getCACertificates("system");
      if (system?.length) merged = [...bundled, ...system];
    } catch {
      // Older Node without system store
    }

    const extraPath = process.env.NODE_EXTRA_CA_CERTS?.trim();
    if (extraPath && fs.existsSync(extraPath)) {
      merged = [...merged, fs.readFileSync(extraPath, "utf8")];
    }

    tls.setDefaultCACertificates(merged);
  } catch (err) {
    console.warn("[tls] could not configure outbound CA trust store:", err);
  }
}

let agent: https.Agent | undefined;

/** Outbound HTTPS to third-party APIs (Kavenegar, webhooks). */
export function getOutboundHttpsAgent(): https.Agent {
  ensureOutboundTlsTrustStore();
  if (!agent) {
    agent = new https.Agent({
      family: 4,
      minVersion: "TLSv1.2",
    });
  }
  return agent;
}

export function formatOutboundTlsError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/unable to verify the first certificate|UNABLE_TO_VERIFY|self signed certificate/i.test(msg)) {
    return (
      "خطای گواهی SSL. NODE_EXTRA_CA_CERTS را برای CA سازمان تنظیم کنید، یا Node را به 22.19+ به‌روز کنید."
    );
  }
  return msg;
}

ensureOutboundTlsTrustStore();
