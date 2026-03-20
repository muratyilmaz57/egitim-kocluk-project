import { proxyJsonToApi } from "@web/lib/session";

export async function POST(request: Request) {
  return proxyJsonToApi(request, "/notifications/read-all", "POST");
}
