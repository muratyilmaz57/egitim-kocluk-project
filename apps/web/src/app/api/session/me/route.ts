import { proxyJsonToApi } from "@web/lib/session";

export async function GET(request: Request) {
  return proxyJsonToApi(request, "/auth/me", "GET");
}
