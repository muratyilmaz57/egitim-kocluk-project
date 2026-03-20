import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { formatDate, formatMinutes, getPomodoroSessions } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentPomodoroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ currentUser, student }, sessions] = await Promise.all([
    getAuthorizedStudentPage(id),
    getPomodoroSessions(id),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} pomodoro`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        { label: "Gorevler", href: `/students/${student.id}/tasks` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="pomodoro" />

      <SectionCard title="Odak gecmisi" subtitle="Sure, bagli gorev ve notlar">
        <div className="list">
          {sessions.length ? (
            sessions.map((session) => (
              <div className="list-item" key={session.id}>
                <div className="list-item__meta">
                  <strong>{session.taskTitle ?? "Bagli gorev yok"}</strong>
                  <span>
                    {formatDate(session.startedAt)} | {session.notes ?? "Not yok"} | mola {session.breakMinutes} dk
                  </span>
                </div>
                <span className="badge badge--success">{formatMinutes(session.durationMinutes)}</span>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Pomodoro kaydi yok</strong>
                <span>Bu ogrenci icin henuz pomodoro oturumu yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
