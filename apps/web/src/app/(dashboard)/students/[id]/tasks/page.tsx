import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { TaskActions } from "@web/components/tasks/task-actions";
import { TaskCreateForm } from "@web/components/tasks/task-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { formatDate, formatTaskStatus, getLessons, getTasks } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ create?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createOpen = resolvedSearchParams?.create === "1";

  const [{ currentUser, student }, tasks, lessons] = await Promise.all([
    getAuthorizedStudentPage(id),
    getTasks(id),
    getLessons(),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} gorevleri`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        ...(currentUser.role !== "student"
          ? [{ label: "Gorev ekle", href: `/students/${student.id}/tasks?create=1`, icon: "plus" as const }]
          : []),
        { label: "Pomodoro", href: `/students/${student.id}/pomodoro` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="tasks" />

      <SectionCard
        title="Tum gorevler"
        subtitle="Durum, konu ve teslim tarihi"
        action={
          currentUser.role !== "student"
            ? { label: "Gorev ekle", href: `/students/${student.id}/tasks?create=1`, icon: "plus" }
            : undefined
        }
      >
        <div className="list">
          {tasks.length ? (
            tasks.map((task) => (
              <div className="list-item" key={task.id}>
                <div className="list-item__meta">
                  <strong>{task.title}</strong>
                  <span>
                    {task.lessonName ?? "Ders yok"} | {task.topicName ?? "Konu yok"} |{" "}
                    {task.dueAt ? formatDate(task.dueAt) : "Son tarih yok"}
                  </span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--warning">{formatTaskStatus(task.status)}</span>
                  <span className="badge badge--success">%{task.progressPercent}</span>
                  {currentUser.role !== "student" ? <TaskActions task={task} lessons={lessons} /> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Gorev yok</strong>
                <span>Bu ogrenciye atanmis gorev bulunmuyor.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {currentUser.role !== "student" && createOpen ? (
        <ModalFrame
          closeHref={`/students/${student.id}/tasks`}
          title="Yeni gorev"
          subtitle={`${student.fullName} icin gorev ata`}
        >
          <TaskCreateForm
            students={[student]}
            lessons={lessons}
            defaultStudentId={student.id}
            onSuccessRedirectTo={`/students/${student.id}/tasks`}
          />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
