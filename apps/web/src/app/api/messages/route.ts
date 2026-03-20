import { proxyJsonToApi } from "@web/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyJsonToApi(request, "/messages", "POST", body);
}
