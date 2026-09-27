export const LOGIN_PATH = "/login";

export function buildLoginUrl(orgSlugOrId?: string | null): string {
  if (!orgSlugOrId?.trim()) return LOGIN_PATH;
  return `${LOGIN_PATH}?org=${encodeURIComponent(orgSlugOrId.trim())}`;
}

export function readLoginRoute(): {
  onLoginPage: boolean;
  org?: string;
  auth?: string;
} {
  if (typeof window === "undefined") return { onLoginPage: false };
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const onLoginPage = path === LOGIN_PATH;
  const sp = new URLSearchParams(window.location.search);
  return {
    onLoginPage,
    org: sp.get("org") || undefined,
    auth: sp.get("auth") || undefined,
  };
}

export function navigateToLoginPath(
  orgSlugOrId?: string | null,
  replace = false,
): void {
  if (typeof window === "undefined") return;
  const url = buildLoginUrl(orgSlugOrId);
  if (replace) window.history.replaceState({}, "", url);
  else window.history.pushState({}, "", url);
}

export function navigateToLandingPath(replace = false): void {
  if (typeof window === "undefined") return;
  const target = "/";
  if (replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
}

export function navigateToAppHome(replace = true): void {
  if (typeof window === "undefined") return;
  const target = "/";
  if (replace) window.history.replaceState({}, "", target);
  else window.history.pushState({}, "", target);
}
