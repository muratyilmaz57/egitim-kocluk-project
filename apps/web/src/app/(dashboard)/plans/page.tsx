import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { WeeklyProgramBoard } from "@web/components/study-plans/weekly-program-board";
import { getCurrentUser, getStudents, getStudyPlansForStudent, getTasks } from "@web/lib/api";

function startOfWeek(baseDate: Date) {
  const date = new Date(baseDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(baseDate: Date, amount: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + amount);
  return date;
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatWeekLabel(startDate: Date, endDate: Date) {
  const startDay = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
  }).format(startDate);
  const endLabel = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(endDate);

  return `${startDay}-${endLabel}`;
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string;
    weekOffset?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const { studentId: rawStudentId, weekOffset: rawWeekOffset } = await searchParams;
  const students = currentUser.role === "student" ? [] : await getStudents();
  const selectedStudentId =
    currentUser.role === "student"
      ? currentUser.studentProfileId ?? undefined
      : rawStudentId ?? students[0]?.id;
  const weekOffset = rawWeekOffset ? Number.parseInt(rawWeekOffset, 10) || 0 : 0;

  const [plans, tasks] = await Promise.all([
    getStudyPlansForStudent(selectedStudentId),
    getTasks(selectedStudentId),
  ]);

  const weekStartDate = startOfWeek(addDays(new Date(), weekOffset * 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => formatIsoDate(addDays(weekStartDate, index)));
  const weekEndDate = addDays(weekStartDate, 6);
  const weekStart = formatIsoDate(weekStartDate);
  const weekEnd = formatIsoDate(weekEndDate);
  const weekLabel = formatWeekLabel(weekStartDate, weekEndDate);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Calisma Programi"
      title={currentUser.role === "student" ? "Haftalik programim" : "Koçluk calisma programi"}
      actions={
        currentUser.role === "student"
          ? [{ label: "Gorevlerim", href: "/tasks" }]
          : [
              { label: "Gorevler", href: "/tasks" },
              { label: "Denemeler", href: "/exams" },
            ]
      }
    >
      <WeeklyProgramBoard
        user={currentUser}
        students={students}
        selectedStudentId={selectedStudentId}
        plans={plans}
        tasks={tasks}
        weekOffset={weekOffset}
        weekDays={weekDays}
        weekLabel={weekLabel}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    </AppShell>
  );
}
