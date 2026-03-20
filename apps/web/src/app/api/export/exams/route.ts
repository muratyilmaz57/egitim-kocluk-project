import { NextResponse } from "next/server";
import { getExamResults } from "@web/lib/api";
import { toCsv } from "@web/lib/csv";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const examType = (searchParams.get("examType") ?? "").trim();

  const exams = await getExamResults();
  const filtered = exams.filter((exam) => {
    const queryMatch = q
      ? matches(`${exam.examName} ${exam.student.fullName}`, q)
      : true;
    const typeMatch = examType ? exam.examType === examType : true;
    return queryMatch && typeMatch;
  });

  const csv = toCsv(
    ["Deneme", "Ogrenci", "Tur", "Tarih", "Net", "Puan", "Dogru", "Yanlis", "Bos"],
    filtered.map((exam) => [
      exam.examName,
      exam.student.fullName,
      exam.examType,
      exam.examDate,
      exam.totalNet,
      exam.score ?? "",
      exam.correctCount,
      exam.wrongCount,
      exam.blankCount,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="denemeler.csv"',
    },
  });
}
