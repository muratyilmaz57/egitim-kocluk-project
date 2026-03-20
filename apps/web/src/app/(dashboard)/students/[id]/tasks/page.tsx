import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { TaskActions } from "@web/components/tasks/task-actions";
import { formatDate, formatTaskStatus, getTasks } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ currentUser, student }, tasks] = await Promise.all([
    getAuthorizedStudentPage(id),
    getTasks(id),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} gorevleri`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        { label: "Pomodoro", href: `/students/${student.id}/pomodoro` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="tasks" />

      <SectionCard title="Tum gorevler" subtitle="Durum, konu ve teslim tarihi">
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
                  {currentUser.role !== "student" ? <TaskActions task={task} /> : null}
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
    </AppShell>
  );
}
