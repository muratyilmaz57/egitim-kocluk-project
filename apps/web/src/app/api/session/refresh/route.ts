import { NextResponse } from "next/server";
import { getRefreshToken, getApiBaseUrl } from "@web/lib/auth";
import { applySessionCookies, clearSessionCookies } from "@web/lib/session";

export async function GET(request: Request) {
  const refreshToken = await getRefreshToken();
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/dashboard";

  if (!refreshToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearSessionCookies(response);
    return response;
  }

  const refreshed = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  const payload = await refreshed.json().catch(() => null);
  if (!refreshed.ok || !payload?.accessToken || !payload?.refreshToken) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url));
  applySessionCookies(response, payload);
  return response;
}
