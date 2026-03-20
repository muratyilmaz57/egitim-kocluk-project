import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { getCurrentUser, getLessons } from "@web/lib/api";

export default async function LessonsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const lessons = await getLessons();

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ders ve konu yonetimi"
      title={currentUser.role === "student" ? "Ders ve konu haritam" : "Dersler"}
      actions={
        currentUser.role === "student"
          ? [{ label: "Profilim", href: `/students/${currentUser.studentProfileId}` }]
          : [
              { label: "Yeni ders", href: "/lessons" },
              { label: "Kaynaklar", href: "/library" },
            ]
      }
    >
      <SectionCard
        title={currentUser.role === "student" ? "Calisilan dersler" : "Ders kartlari"}
        subtitle="Canli ders ve konu listesi"
      >
        <div className="list">
          {lessons.map((lesson) => (
            <div className="list-item" key={lesson.id}>
              <div className="list-item__meta">
                <strong>{lesson.name}</strong>
                <span>{lesson.topicCount} aktif konu</span>
              </div>
              <span className="badge badge--success">{lesson.code}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {lessons.map((lesson) => (
        <SectionCard
          key={`${lesson.id}-topics`}
          title={`${lesson.name} konulari`}
          subtitle="Konu agaci ve tahmini sure"
        >
          <div className="list">
            {lesson.topics.map((topic) => (
              <div className="list-item" key={topic.id}>
                <div className="list-item__meta">
                  <strong>{topic.name}</strong>
                  <span>
                    {topic.gradeLevel ?? "Seviye yok"} | {topic.estimatedMinutes ?? 0} dk
                  </span>
                </div>
                <span className="badge badge--warning">
                  Zorluk {topic.difficultyLevel ?? "-"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </AppShell>
  );
}
