import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@web/lib/auth";
import { applySessionCookies } from "@web/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.accessToken) {
    if (response.ok && payload?.requiresMfa) {
      return NextResponse.json(payload, { status: 200 });
    }
    return NextResponse.json(
      payload ?? { message: "Login failed." },
      { status: response.status || 500 },
    );
  }

  const nextResponse = NextResponse.json({
    user: payload.user,
  });
  applySessionCookies(nextResponse, payload);

  return nextResponse;
}
