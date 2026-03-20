import { NextResponse } from "next/server";
import { getRefreshToken, getApiBaseUrl } from "@web/lib/auth";
import { clearSessionCookies } from "@web/lib/session";

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

  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookies(response);
  return response;
}
