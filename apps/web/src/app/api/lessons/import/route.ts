import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { proxyJsonToApi } from "@web/lib/session";

function pickValue(record: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const found = Object.entries(record).find(
      ([key]) => key.trim().toLocaleLowerCase("tr-TR") === alias,
    );
    if (found && found[1] !== undefined && found[1] !== null && found[1] !== "") {
      return found[1];
    }
  }

  return undefined;
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ message: "Excel veya CSV dosyasi sec." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];

  if (!firstSheet) {
    return NextResponse.json({ message: "Dosyada sayfa bulunamadi." }, { status: 400 });
  }

  const sheet = workbook.Sheets[firstSheet];
  if (!sheet) {
    return NextResponse.json({ message: "Ilk sayfa okunamadi." }, { status: 400 });
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows = rawRows
    .map((row) => ({
      lessonName: String(
        pickValue(row, ["ders", "lesson", "lesson name", "ders adi", "ders adı"]) ?? "",
      ).trim(),
      lessonCode: String(
        pickValue(row, ["kod", "code", "lesson code", "ders kodu"]) ?? "",
      ).trim() || undefined,
      lessonColor: String(
        pickValue(row, ["renk", "color", "lesson color", "ders rengi"]) ?? "",
      ).trim() || undefined,
      topicName: String(
        pickValue(row, ["konu", "topic", "topic name", "konu adi", "konu adı"]) ?? "",
      ).trim() || undefined,
      description: String(
        pickValue(row, ["aciklama", "açıklama", "description"]) ?? "",
      ).trim() || undefined,
      gradeLevel: String(
        pickValue(row, ["seviye", "sinif", "sınıf", "grade", "grade level"]) ?? "",
      ).trim() || undefined,
      difficultyLevel: toNumber(
        pickValue(row, ["zorluk", "difficulty", "difficulty level"]),
      ),
      estimatedMinutes: toNumber(
        pickValue(row, ["sure", "süre", "dakika", "minute", "estimated minutes"]),
      ),
    }))
    .filter((row) => row.lessonName);

  return proxyJsonToApi(request, "/lessons/import", "POST", { rows });
}
