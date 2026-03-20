import { proxyJsonToApi } from "@web/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return proxyJsonToApi(request, "/messages/read-all", "POST", body);
}
