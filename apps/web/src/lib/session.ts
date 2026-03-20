import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiBaseUrl, isSecureCookie } from "./auth";
import {
  AUTH_COOKIE_NAME,
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
} from "./constants";
import { isJwtExpired } from "./jwt";

type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresIn?: number;
  user?: unknown;
};

async function requestRefresh(refreshToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as SessionPayload | null;
  return {
    ok: response.ok,
    payload,
    status: response.status,
  };
}

export function applySessionCookies(response: NextResponse, payload: SessionPayload) {
  response.cookies.set(AUTH_COOKIE_NAME, payload.accessToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: payload.accessTokenExpiresIn ?? DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, payload.refreshToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: payload.refreshTokenExpiresIn ?? DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function clearSessionCookies(response: NextResponse) {
  for (const cookieName of [AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME]) {
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

export async function resolveAccessTokenForRoute() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;

  if (accessToken && !isJwtExpired(accessToken)) {
    return {
      accessToken,
      refreshedSession: null as SessionPayload | null,
      refreshToken,
    };
  }

  if (!refreshToken) {
    return {
      accessToken: null,
      refreshedSession: null as SessionPayload | null,
      refreshToken: null,
    };
  }

  const refreshed = await requestRefresh(refreshToken);
  if (!refreshed.ok || !refreshed.payload?.accessToken || !refreshed.payload?.refreshToken) {
    return {
      accessToken: null,
      refreshedSession: null as SessionPayload | null,
      refreshToken,
    };
  }

  return {
    accessToken: refreshed.payload.accessToken,
    refreshedSession: refreshed.payload,
    refreshToken: refreshed.payload.refreshToken,
  };
}

export async function proxyJsonToApi(
  _request: Request,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const session = await resolveAccessTokenForRoute();
  if (!session.accessToken) {
    const unauthorized = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookies(unauthorized);
    return unauthorized;
  }

  let response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      authorization: `Bearer ${session.accessToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let rotatedSession = session.refreshedSession;

  if (response.status === 401 && session.refreshToken) {
    const refreshed = await requestRefresh(session.refreshToken);
    if (refreshed.ok && refreshed.payload?.accessToken && refreshed.payload?.refreshToken) {
      rotatedSession = refreshed.payload;
      response = await fetch(`${getApiBaseUrl()}${path}`, {
        method,
        headers: {
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
          authorization: `Bearer ${refreshed.payload.accessToken}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
    }
  }

  const payload = await response.json().catch(() => null);
  const nextResponse = NextResponse.json(payload, { status: response.status });

  if (rotatedSession) {
    applySessionCookies(nextResponse, rotatedSession);
  }

  if (response.status === 401) {
    clearSessionCookies(nextResponse);
  }

  return nextResponse;
}
