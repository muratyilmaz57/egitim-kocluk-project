import { NextResponse } from "next/server";
import { getStudents, formatStudentStatus } from "@web/lib/api";
import { toCsv } from "@web/lib/csv";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const grade = (searchParams.get("grade") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  const students = await getStudents();
  const filtered = students.filter((student) => {
    const queryMatch = q
      ? matches(
          `${student.fullName} ${student.gradeLevel} ${student.targetExam ?? ""}`,
          q,
        )
      : true;
    const gradeMatch = grade ? student.gradeLevel === grade : true;
    const statusMatch = status ? student.status === status : true;
    return queryMatch && gradeMatch && statusMatch;
  });

  const csv = toCsv(
    ["Ad Soyad", "Sinif", "Hedef", "Durum", "Genel Ilerleme", "Son Net"],
    filtered.map((student) => [
      student.fullName,
      student.gradeLevel,
      student.targetExam ?? "",
      formatStudentStatus(student.status),
      student.overallProgress,
      student.latestExamNet ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="ogrenciler.csv"',
    },
  });
}
