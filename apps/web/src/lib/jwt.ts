type SessionJwtPayload = {
  exp?: number;
  sid?: string | null;
  role?: "admin" | "coach" | "student";
  studentProfileId?: string | null;
  coachUserId?: string | null;
  mfaEnabled?: boolean;
  passwordExpired?: boolean;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  if (typeof atob === "function") {
    return atob(`${normalized}${padding}`);
  }

  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

export function parseJwtPayload(token?: string | null): SessionJwtPayload | null {
  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as SessionJwtPayload;
  } catch {
    return null;
  }
}

export function isJwtExpired(token?: string | null, skewSeconds = 30) {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}

export function getDefaultAppPathFromToken(token?: string | null) {
  const payload = parseJwtPayload(token);

  if (payload?.passwordExpired) {
    return "/settings/security?force=1";
  }

  if (payload?.role === "student" && payload.studentProfileId) {
    return `/students/${payload.studentProfileId}`;
  }

  return "/dashboard";
}
