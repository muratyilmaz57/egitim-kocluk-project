import { proxyJsonToApi } from "@web/lib/session";
export async function GET(request: Request) { return proxyJsonToApi(request, "/auth/profile", "GET"); }
export async function PATCH(request: Request) { return proxyJsonToApi(request, "/auth/profile", "PATCH"); }
