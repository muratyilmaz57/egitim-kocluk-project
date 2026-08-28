import { redirect } from "next/navigation";
import Link from "next/link";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { LessonCreateForm } from "@web/components/lessons/lesson-create-form";
import { LessonImportForm } from "@web/components/lessons/lesson-import-form";
import { TopicCreateForm } from "@web/components/lessons/topic-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { getCurrentUser, getLessons } from "@web/lib/api";
import { GRADE_LEVELS, gradeLevelLabel, isGradeLevel, lessonMatchesGrade } from "@web/lib/grade-levels";

type LessonsPageProps = {
  searchParams?: Promise<{
    create?: string;
    lessonId?: string;
    grade?: string;
  }>;
};

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createMode = resolvedSearchParams?.create ?? "";
  const gradeLevel = isGradeLevel(resolvedSearchParams?.grade) ? resolvedSearchParams.grade : GRADE_LEVELS[0];
  const lessons = await getLessons();
  const filteredLessons = lessons.filter((lesson) => lessonMatchesGrade(lesson, gradeLevel));
  const selectedLessonId = filteredLessons.some((lesson) => lesson.id === resolvedSearchParams?.lessonId)
    ? resolvedSearchParams?.lessonId ?? null
    : null;
  const selectedLesson = filteredLessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const selectedTopics = selectedLesson?.topics.filter((topic) => topic.gradeLevel === gradeLevel) ?? [];
  const baseQuery = `grade=${encodeURIComponent(gradeLevel)}`;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ders ve konu yonetimi"
      title={currentUser.role === "student" ? "Ders ve konu haritam" : "Dersler"}
      actions={
        currentUser.role === "student"
          ? [{ label: "Profilim", href: `/students/${currentUser.studentProfileId}` }]
          : [
              { label: "Yeni ders", href: `/lessons?${baseQuery}&create=lesson`, icon: "plus" },
              { label: "Konu ekle", href: `/lessons?${baseQuery}&create=topic`, icon: "plus" },
              { label: "Excel aktar", href: "/lessons?create=import", icon: "plus" },
              { label: "Sablon indir", href: "/api/lessons/template" },
              { label: "Kaynaklar", href: "/library" },
            ]
      }
    >
      <SectionCard
        title={currentUser.role === "student" ? "Calisilan dersler" : "Ders kartlari"}
        subtitle="Canli ders ve konu listesi"
        action={
          currentUser.role !== "student"
            ? { label: "Yeni ders", href: `/lessons?${baseQuery}&create=lesson`, icon: "plus" }
            : undefined
        }
      >
        <div className="filter-chips" aria-label="Sınıf seçimi">
          {GRADE_LEVELS.map((grade) => (
            <Link key={grade} className={`filter-chip${grade === gradeLevel ? " filter-chip--active" : ""}`} href={`/lessons?grade=${encodeURIComponent(grade)}`}>
              {gradeLevelLabel(grade)}
            </Link>
          ))}
        </div>
        <div className="list">
          {filteredLessons.map((lesson) => (
            <Link className="list-item" href={`/lessons?${baseQuery}&lessonId=${lesson.id}`} key={lesson.id}>
              <div className="list-item__meta">
                <strong>{lesson.name}</strong>
                <span>{lesson.topics.filter((topic) => topic.gradeLevel === gradeLevel).length} aktif konu</span>
              </div>
              <span className="badge badge--success">{lesson.code}</span>
            </Link>
          ))}
          {!filteredLessons.length ? <div className="list-item"><div className="list-item__meta"><strong>Bu sınıfa ders eklenmemiş</strong><span>Yeni ders ekleyerek başlayabilirsiniz.</span></div></div> : null}
        </div>
      </SectionCard>

      {selectedLesson ? (
        <SectionCard
          title={`${selectedLesson.name} konuları`}
          subtitle="Konu agaci ve tahmini sure"
          action={
            currentUser.role !== "student"
              ? {
                  label: "Konu ekle",
                  href: `/lessons?${baseQuery}&create=topic&lessonId=${selectedLesson.id}`,
                  icon: "plus",
                }
              : undefined
          }
        >
          <div className="list">
            {selectedTopics.map((topic) => (
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
            {!selectedTopics.length ? <div className="list-item"><div className="list-item__meta"><strong>Konu bulunamadı</strong><span>Bu ders ve sınıf için ilk konuyu ekleyebilirsiniz.</span></div></div> : null}
        </SectionCard>
      ) : null}

      {currentUser.role !== "student" && createMode === "lesson" ? (
        <ModalFrame
          closeHref={`/lessons?${baseQuery}`}
          title="Yeni ders ekle"
          subtitle="Form ile tek tek yeni ders tanimla"
        >
          <LessonCreateForm defaultGradeLevel={gradeLevel} onSuccessRedirectTo={`/lessons?${baseQuery}`} />
        </ModalFrame>
      ) : null}

      {currentUser.role !== "student" && createMode === "topic" ? (
        <ModalFrame
          closeHref={`/lessons?${baseQuery}`}
          title="Yeni konu ekle"
          subtitle="Ders secip konu, sure ve zorluk bilgilerini ekle"
        >
          <TopicCreateForm
            lessons={lessons}
            defaultLessonId={selectedLessonId}
            defaultGradeLevel={gradeLevel}
            onSuccessRedirectTo={`/lessons?${baseQuery}${selectedLessonId ? `&lessonId=${selectedLessonId}` : ""}`}
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
