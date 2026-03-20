import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@web/lib/auth";
import {
  applySessionCookies,
  clearSessionCookies,
  resolveAccessTokenForRoute,
} from "@web/lib/session";

function getSocketUrl() {
  return getApiBaseUrl().replace(/\/api\/v1$/, "");
}

export async function GET() {
  const session = await resolveAccessTokenForRoute();

  if (!session.accessToken) {
    const unauthorized = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    clearSessionCookies(unauthorized);
    return unauthorized;
  }

  const response = NextResponse.json({
    accessToken: session.accessToken,
    socketUrl: getSocketUrl(),
  });

  if (session.refreshedSession) {
    applySessionCookies(response, session.refreshedSession);
  }

  return response;
}
