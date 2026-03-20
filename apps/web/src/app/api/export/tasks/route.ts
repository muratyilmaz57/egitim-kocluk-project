import { NextResponse } from "next/server";
import { formatTaskStatus, getTasks } from "@web/lib/api";
import { toCsv } from "@web/lib/csv";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();

  const tasks = await getTasks();
  const filtered = tasks.filter((task) => {
    const queryMatch = q
      ? matches(
          `${task.title} ${task.student.fullName} ${task.lessonName ?? ""} ${task.topicName ?? ""}`,
          q,
        )
      : true;
    const statusMatch = status ? task.status === status : true;
    return queryMatch && statusMatch;
  });

  const csv = toCsv(
    ["Gorev", "Ogrenci", "Ders", "Konu", "Durum", "Ilerleme", "Son Tarih"],
    filtered.map((task) => [
      task.title,
      task.student.fullName,
      task.lessonName ?? "",
      task.topicName ?? "",
      formatTaskStatus(task.status),
      task.progressPercent,
      task.dueAt ?? "",
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="gorevler.csv"',
    },
  });
}
