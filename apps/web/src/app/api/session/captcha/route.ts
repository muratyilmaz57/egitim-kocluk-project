import { getApiBaseUrl } from "@web/lib/auth";

export async function GET() {
  const response = await fetch(`${getApiBaseUrl()}/auth/captcha`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return Response.json(payload, { status: response.status });
}
