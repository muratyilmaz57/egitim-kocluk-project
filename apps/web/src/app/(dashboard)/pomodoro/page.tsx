import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { PomodoroActions } from "@web/components/pomodoro/pomodoro-actions";
import { PomodoroCreateForm } from "@web/components/pomodoro/pomodoro-create-form";
import {
  formatDate,
  formatMinutes,
  getCurrentUser,
  getPomodoroSessions,
  getStudents,
  getTasks,
} from "@web/lib/api";

export default async function PomodoroPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [sessions, students, tasks] = await Promise.all([
    getPomodoroSessions(currentUser.studentProfileId ?? undefined),
    currentUser.role === "student" ? Promise.resolve([]) : getStudents(),
    getTasks(currentUser.studentProfileId ?? undefined),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Odak takibi"
      title={currentUser.role === "student" ? "Pomodoro gecmisim" : "Pomodoro oturumlari"}
      actions={
        currentUser.role === "student"
          ? [{ label: "Gorevlerim", href: "/tasks" }]
          : [
              { label: "Yeni oturum", href: "/pomodoro" },
              { label: "Planlar", href: "/plans" },
            ]
      }
    >
      <SectionCard
        title={currentUser.role === "student" ? "Yeni odak oturumu" : "Yeni pomodoro oturumu"}
        subtitle="Oturum suresi ve notlariyla kayit olustur"
      >
        <PomodoroCreateForm currentUser={currentUser} students={students} tasks={tasks} />
      </SectionCard>

      <SectionCard
        title={currentUser.role === "student" ? "Son odak oturumlarim" : "Son oturumlar"}
        subtitle="Canli pomodoro gecmisi"
      >
        <div className="list">
          {sessions.length ? (
            sessions.map((session) => (
              <div className="list-item" key={session.id}>
                <div className="list-item__meta">
                  <strong>{session.student.fullName}</strong>
                  <span>
                    {session.taskTitle ?? "Bagli gorev yok"} | {formatDate(session.startedAt)} |{" "}
                    {session.notes ?? "Not yok"}
                  </span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--warning">
                    {formatMinutes(session.durationMinutes)}
                  </span>
                  <PomodoroActions session={session} />
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Pomodoro kaydi yok</strong>
                <span>Oturumlar tamamlandikca burada listelenecek.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
