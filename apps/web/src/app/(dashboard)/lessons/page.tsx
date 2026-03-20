import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { LessonCreateForm } from "@web/components/lessons/lesson-create-form";
import { LessonImportForm } from "@web/components/lessons/lesson-import-form";
import { TopicCreateForm } from "@web/components/lessons/topic-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { getCurrentUser, getLessons } from "@web/lib/api";

type LessonsPageProps = {
  searchParams?: Promise<{
    create?: string;
    lessonId?: string;
  }>;
};

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createMode = resolvedSearchParams?.create ?? "";
  const selectedLessonId = resolvedSearchParams?.lessonId ?? null;
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
              { label: "Yeni ders", href: "/lessons?create=lesson", icon: "plus" },
              { label: "Konu ekle", href: "/lessons?create=topic", icon: "plus" },
              { label: "Excel aktar", href: "/lessons?create=import", icon: "plus" },
              { label: "Kaynaklar", href: "/library" },
            ]
      }
    >
      <SectionCard
        title={currentUser.role === "student" ? "Calisilan dersler" : "Ders kartlari"}
        subtitle="Canli ders ve konu listesi"
        action={
          currentUser.role !== "student"
            ? { label: "Yeni ders", href: "/lessons?create=lesson", icon: "plus" }
            : undefined
        }
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
          action={
            currentUser.role !== "student"
              ? {
                  label: "Konu ekle",
                  href: `/lessons?create=topic&lessonId=${lesson.id}`,
                  icon: "plus",
                }
              : undefined
          }
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

      {currentUser.role !== "student" && createMode === "lesson" ? (
        <ModalFrame
          closeHref="/lessons"
          title="Yeni ders ekle"
          subtitle="Form ile tek tek yeni ders tanimla"
        >
          <LessonCreateForm onSuccessRedirectTo="/lessons" />
        </ModalFrame>
      ) : null}

      {currentUser.role !== "student" && createMode === "topic" ? (
        <ModalFrame
          closeHref="/lessons"
          title="Yeni konu ekle"
          subtitle="Ders secip konu, sure ve zorluk bilgilerini ekle"
        >
          <TopicCreateForm
            lessons={lessons}
            defaultLessonId={selectedLessonId}
            onSuccessRedirectTo="/lessons"
          />
        </ModalFrame>
      ) : null}

      {currentUser.role !== "student" && createMode === "import" ? (
        <ModalFrame
          closeHref="/lessons"
          title="Excel ile aktar"
          subtitle="Ders ve konu listesini toplu olarak sisteme al"
        >
          <LessonImportForm onSuccessRedirectTo="/lessons" />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
