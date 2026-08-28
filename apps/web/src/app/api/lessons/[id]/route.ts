import { proxyJsonToApi } from "@web/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyJsonToApi(request, `/lessons/${id}`, "PATCH", await request.json());
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyJsonToApi(request, `/lessons/${id}`, "DELETE");
}
