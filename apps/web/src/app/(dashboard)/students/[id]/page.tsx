import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentActions } from "@web/components/students/student-actions";
import { StudentAvatarEditor } from "@web/components/students/student-avatar-editor";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { formatDate, formatMinutes, formatTaskStatus } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { currentUser, student } = await getAuthorizedStudentPage(id);
  const studentMetrics = [
    {
      label: "Haftalik hedef tamamlama",
      value: `%${student.stats.completionPercent}`,
      detail: "Canli gorev ilerleme orani",
    },
    {
      label: "Toplam odak suresi",
      value: formatMinutes(student.stats.totalFocusMinutes),
      detail: "Pomodoro oturumlarindan geldi",
    },
    {
      label: "Son deneme neti",
      value: `${student.stats.latestExamNet}`,
      detail: "En son sinav sonucu",
    },
    {
      label: "Eksik konu",
      value: `${student.stats.missingTopicCount}`,
      detail: `Okunmamis mesaj ${student.stats.unreadMessageCount}`,
    },
  ];

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={student.fullName}
      actions={
        currentUser.role === "student"
          ? [
              { label: "Mesajlar", href: `/students/${student.id}/messages` },
              { label: "Kutuphane", href: "/library" },
              { label: "Pomodoro", href: `/students/${student.id}/pomodoro` },
            ]
          : [
              { label: "Gorevler", href: `/students/${student.id}/tasks` },
              { label: "Denemeler", href: `/students/${student.id}/exams` },
              { label: "Ajanda", href: "/agenda" },
            ]
      }
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="general" />

      <SectionCard title="Profil görseli" subtitle="Kendi fotoğrafını yükle veya varsayılan avatar seç">
        <StudentAvatarEditor student={student} />
      </SectionCard>

      {currentUser.role !== "student" ? (
        <SectionCard title="Ogrenci ayarlari" subtitle="Profil bilgilerini guncelle veya arsivden kaldir">
          <StudentActions student={student} />
        </SectionCard>
      ) : null}

      <section className="metric-grid">
        {studentMetrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <span className="stat-card__label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <span className="stat-card__meta">{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <SectionCard
          title="Aktif gorevler"
          subtitle="Bu haftanin kritik akisi"
          action={{ label: "Tum gorevler", href: `/students/${student.id}/tasks` }}
        >
          <div className="list">
            {student.tasks.length ? (
              student.tasks.map((task) => (
                <div className="list-item" key={task.id}>
                  <div className="list-item__meta" style={{ width: "100%" }}>
                    <strong>{task.title}</strong>
                    <span>
                      {[task.lessonName, task.topicName, formatTaskStatus(task.status)]
                        .filter(Boolean)
                        .join(" | ")}
                    </span>
                    <div className="progress-bar">
                      <span style={{ width: `${task.progressPercent}%` }} />
                    </div>
                  </div>
                  <span className="badge badge--warning">%{task.progressPercent}</span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Aktif gorev yok</strong>
                  <span>Bu ogrenci icin henuz gorev verisi bulunmuyor.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={currentUser.role === "student" ? "Bana acik notlar" : "Koç notlari"}
          subtitle="Son geri bildirimler"
          action={{ label: "Ajandaya git", href: "/agenda" }}
        >
          <div className="list">
            {student.notes.length ? (
              student.notes.map((note) => (
                <div className="list-item" key={note.id}>
                  <div className="list-item__meta">
                    <strong>{note.title}</strong>
                    <span>{note.content}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Not yok</strong>
                  <span>Koç notlari eklendiginde bu alanda listelenecek.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="two-column">
        <SectionCard
          title="Deneme trendi"
          subtitle="Son 6 deneme performansi"
          action={{ label: "Tum denemeler", href: `/students/${student.id}/exams` }}
        >
          {student.examTrend.length ? (
            <div className="list">
              {student.examTrend.map((exam) => (
                <div className="list-item" key={exam.id}>
                  <div className="list-item__meta">
                    <strong>{exam.examName}</strong>
                    <span>{formatDate(exam.examDate)}</span>
                  </div>
                  <span className="badge badge--success">{exam.totalNet} net</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="chart-placeholder" />
          )}
        </SectionCard>

        <SectionCard
          title="Eksik konu haritasi"
          subtitle="Mudahale sirasi"
          action={{ label: "Konu sekmesi", href: `/students/${student.id}/topics` }}
        >
          <div className="list">
            {student.weakTopics.length ? (
              student.weakTopics.map((topic) => (
                <div className="list-item" key={topic.id}>
                  <div className="list-item__meta">
                    <strong>{topic.topicName}</strong>
                    <span>Son deneme sonucundan otomatik uretildi.</span>
                  </div>
                  <span className={topic.priority === 1 ? "badge badge--danger" : "badge badge--warning"}>
                    Oncelik {topic.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Eksik konu verisi yok</strong>
                  <span>Deneme analizi geldikce burada listelenecek.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
