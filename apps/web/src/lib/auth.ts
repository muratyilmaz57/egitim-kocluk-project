import "server-only";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./constants";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:4000/api/v1";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function getSessionTokens() {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null,
  };
}

export function getApiBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_BASE_URL
  );
}

export function isSecureCookie() {
  return process.env.NODE_ENV === "production";
}
