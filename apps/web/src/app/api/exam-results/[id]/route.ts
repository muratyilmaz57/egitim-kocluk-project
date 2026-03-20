import { proxyJsonToApi } from "@web/lib/session";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.json();
  return proxyJsonToApi(request, `/exam-results/${id}`, "PATCH", body);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyJsonToApi(request, `/exam-results/${id}`, "DELETE");
}
