import { proxyJsonToApi } from "@web/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyJsonToApi(request, `/notifications/${id}/read`, "PATCH");
}
