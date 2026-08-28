import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { TaskCreateForm } from "@web/components/tasks/task-create-form";
import { WeeklyProgramBoard } from "@web/components/study-plans/weekly-program-board";
import { StudyPlanCreateForm } from "@web/components/study-plans/study-plan-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import {
  getCurrentUser,
  getLessons,
  getStudents,
  getStudyPlansForStudent,
  getTasks,
} from "@web/lib/api";

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
    createTask?: string;
    createPlan?: string;
    dueDate?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const {
    studentId: rawStudentId,
    weekOffset: rawWeekOffset,
    createTask,
    createPlan,
    dueDate,
  } = await searchParams;
  const students = currentUser.role === "student" ? [] : await getStudents();
  const selectedStudentId =
    currentUser.role === "student"
      ? currentUser.studentProfileId ?? undefined
      : rawStudentId;
  const weekOffset = rawWeekOffset ? Number.parseInt(rawWeekOffset, 10) || 0 : 0;

  const [plans, tasks, lessons] = await Promise.all([
    selectedStudentId ? getStudyPlansForStudent(selectedStudentId) : Promise.resolve([]),
    selectedStudentId ? getTasks(selectedStudentId) : Promise.resolve([]),
    currentUser.role === "student" ? Promise.resolve([]) : getLessons(),
  ]);

  const weekStartDate = startOfWeek(addDays(new Date(), weekOffset * 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => formatIsoDate(addDays(weekStartDate, index)));
  const weekEndDate = addDays(weekStartDate, 6);
  const weekStart = formatIsoDate(weekStartDate);
  const weekEnd = formatIsoDate(weekEndDate);
  const weekLabel = formatWeekLabel(weekStartDate, weekEndDate);
  const closeParams = new URLSearchParams();
  if (selectedStudentId) {
    closeParams.set("studentId", selectedStudentId);
  }
  if (weekOffset !== 0) {
    closeParams.set("weekOffset", String(weekOffset));
  }
  const closeHref = closeParams.toString() ? `/plans?${closeParams.toString()}` : "/plans";

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
        lessons={lessons}
        selectedStudentId={selectedStudentId}
        plans={plans}
        tasks={tasks}
        weekOffset={weekOffset}
        weekDays={weekDays}
        weekLabel={weekLabel}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      {currentUser.role !== "student" && createTask === "1" ? (
        <ModalFrame
          closeHref={closeHref}
          title="Yeni gorev"
          subtitle="Secili hafta ve ogrenci icin gorev ata"
        >
          <TaskCreateForm
            students={students}
            lessons={lessons}
            defaultStudentId={selectedStudentId ?? null}
            defaultDueAt={`${(dueDate ?? weekStart)}T17:00:00.000Z`}
            onSuccessRedirectTo={closeHref}
          />
        </ModalFrame>
      ) : null}

      {currentUser.role !== "student" && createPlan === "1" ? (
        <ModalFrame
          closeHref={closeHref}
          title="Yeni plan"
          subtitle="Secili hafta icin hizli plan olustur"
        >
          <StudyPlanCreateForm
            students={students}
            defaultStudentId={selectedStudentId ?? null}
            defaultStartDate={weekStart}
            defaultEndDate={weekEnd}
            onSuccessRedirectTo={closeHref}
          />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
