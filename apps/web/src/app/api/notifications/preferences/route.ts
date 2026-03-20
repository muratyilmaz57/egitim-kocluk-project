import { proxyJsonToApi } from "@web/lib/session";

export async function GET(request: Request) {
  return proxyJsonToApi(request, "/notifications/preferences", "GET");
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  return proxyJsonToApi(request, "/notifications/preferences", "PATCH", body);
}
