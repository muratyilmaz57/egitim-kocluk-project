import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@web/lib/auth";
import { applySessionCookies, resolveAccessTokenForRoute } from "@web/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const session = await resolveAccessTokenForRoute();
  if (!session.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  const nextResponse = NextResponse.json(payload, { status: response.status });

  if (response.ok && payload?.accessToken && payload?.refreshToken) {
    applySessionCookies(nextResponse, payload);
  }

  return nextResponse;
}
