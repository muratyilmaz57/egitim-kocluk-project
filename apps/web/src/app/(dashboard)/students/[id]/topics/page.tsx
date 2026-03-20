import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { getLessons } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentTopicsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ currentUser, student }, lessons] = await Promise.all([
    getAuthorizedStudentPage(id),
    getLessons(),
  ]);
  const weakTopicNames = new Set(student.weakTopics.map((topic) => topic.topicName));
  const activeTopicNames = new Set(student.tasks.map((task) => task.topicName).filter(Boolean));

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} konulari`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        { label: "Denemeler", href: `/students/${student.id}/exams` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="topics" />

      <section className="two-column">
        <SectionCard title="Oncelikli konular" subtitle="Deneme ve gorevlerden cikan odak alanlari">
          <div className="list">
            {student.weakTopics.length ? (
              student.weakTopics.map((topic) => (
                <div className="list-item" key={topic.id}>
                  <div className="list-item__meta">
                    <strong>{topic.topicName}</strong>
                    <span>Oncelik {topic.priority}</span>
                  </div>
                  <span className={topic.priority === 1 ? "badge badge--danger" : "badge badge--warning"}>
                    Tekrar
                  </span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Kritik konu yok</strong>
                  <span>Su an icin belirgin bir eksik konu tespit edilmedi.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Aktif calisilan konular" subtitle="Gorevlerle iliskili konu akisi">
          <div className="list">
            {Array.from(activeTopicNames).length ? (
              Array.from(activeTopicNames).map((topicName) => (
                <div className="list-item" key={topicName}>
                  <div className="list-item__meta">
                    <strong>{topicName}</strong>
                    <span>Gorevler uzerinden takip ediliyor</span>
                  </div>
                  <span className="badge badge--success">Aktif</span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Takipli konu yok</strong>
                  <span>Bu ogrenciye konu bagli gorev atanmamis.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      {lessons.map((lesson) => (
        <SectionCard
          key={lesson.id}
          title={lesson.name}
          subtitle={`${lesson.topicCount} aktif konu`}
        >
          <div className="list">
            {lesson.topics.map((topic) => {
              const isWeak = weakTopicNames.has(topic.name);
              const isActive = activeTopicNames.has(topic.name);

              return (
                <div className="list-item" key={topic.id}>
                  <div className="list-item__meta">
                    <strong>{topic.name}</strong>
                    <span>
                      {topic.gradeLevel ?? "Seviye yok"} | {topic.estimatedMinutes ?? 0} dk
                    </span>
                  </div>
                  <div className="list-item__aside">
                    {isActive ? <span className="badge badge--success">Aktif</span> : null}
                    {isWeak ? <span className="badge badge--danger">Eksik</span> : null}
                    {!isWeak && !isActive ? (
                      <span className="badge badge--warning">Takip disi</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}
    </AppShell>
  );
}
