import { NextResponse } from "next/server";
import { getRefreshToken, getApiBaseUrl } from "@web/lib/auth";
import { clearSessionCookies } from "@web/lib/session";

function getRedirectBase(request: Request) {
  if (process.env.WEB_BASE_URL) {
    return process.env.WEB_BASE_URL;
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto =
    request.headers.get("x-forwarded-proto") ??
    request.headers.get("x-forwarded-protocol");

  if (forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  return request.headers.get("origin") ?? request.url;
}

export async function POST(request: Request) {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await fetch(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    }).catch(() => null);
  }

  const response = NextResponse.redirect(new URL("/login", getRedirectBase(request)));
  clearSessionCookies(response);
  return response;
}
