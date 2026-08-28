import { getSessionToken } from "@web/lib/auth";
import { storeStudentAvatar } from "@web/lib/storage";

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "Bir görsel seçmelisiniz." }, { status: 400 });
  }

  try {
    return Response.json(await storeStudentAvatar(file));
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Profil görseli yüklenemedi." },
      { status: 400 },
    );
  }
}
