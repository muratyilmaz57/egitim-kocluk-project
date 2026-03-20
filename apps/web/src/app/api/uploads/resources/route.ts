import { getSessionToken } from "@web/lib/auth";
import { storeResourceFile } from "@web/lib/storage";

export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ message: "File is required." }, { status: 400 });
  }

  try {
    const storedFile = await storeResourceFile(file);

    return Response.json(storedFile);
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error ? error.message : "File upload failed.",
      },
      { status: 400 },
    );
  }
}
