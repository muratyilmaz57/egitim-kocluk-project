import { redirect } from "next/navigation";
import Link from "next/link";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { ResourceActions } from "@web/components/resources/resource-actions";
import { ResourceCreateForm } from "@web/components/resources/resource-create-form";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { getCurrentUser, getLessons, getResources } from "@web/lib/api";
import { GRADE_LEVELS, gradeLevelLabel, isGradeLevel } from "@web/lib/grade-levels";

type LibraryPageProps = {
  searchParams?: Promise<{
    create?: string;
    grade?: string;
  }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createOpen = resolvedSearchParams?.create === "1";
  const gradeLevel = isGradeLevel(resolvedSearchParams?.grade) ? resolvedSearchParams.grade : GRADE_LEVELS[0];

  const [resources, lessons] = await Promise.all([
    getResources(),
    currentUser.role === "student" ? Promise.resolve([]) : getLessons(),
  ]);
  const filteredResources = resources.filter((resource) => resource.targetGradeLevel === gradeLevel);
  const baseQuery = `grade=${encodeURIComponent(gradeLevel)}`;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Kaynak yonetimi"
      title="Kutuphane"
      actions={
        currentUser.role === "student"
          ? [{ label: "Profilim", href: `/students/${currentUser.studentProfileId}` }]
          : [
              { label: "Kaynak ekle", href: `/library?${baseQuery}&create=1`, icon: "plus" },
              { label: "Dersler", href: "/lessons" },
            ]
      }
    >
      <SectionCard
        title={currentUser.role === "student" ? "Bana uygun kaynaklar" : "Kaynak listesi"}
        subtitle="PDF, video ve not kaynaklari"
        action={
          currentUser.role !== "student"
            ? { label: "Kaynak ekle", href: `/library?${baseQuery}&create=1`, icon: "plus" }
            : undefined
        }
      >
        <div className="filter-chips" aria-label="Sınıf seçimi">
          {GRADE_LEVELS.map((grade) => <Link key={grade} className={`filter-chip${grade === gradeLevel ? " filter-chip--active" : ""}`} href={`/library?grade=${encodeURIComponent(grade)}`}>{gradeLevelLabel(grade)}</Link>)}
        </div>
        <div className="list">
          {filteredResources.length ? (
            filteredResources.map((resource) => (
              <div className="list-item" key={resource.id}>
                <div className="list-item__meta">
                  <strong>{resource.title}</strong>
                  <span>
                    {resource.lessonName ?? "Genel"} | {resource.topicName ?? "Konu yok"} |{" "}
                    {resource.targetGradeLevel ?? "Seviye yok"}
                  </span>
                  <span>{resource.description ?? resource.url ?? "Aciklama yok"}</span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--success">{resource.resourceType}</span>
                  {resource.filePath || resource.url ? (
                    <Link
                      className="secondary-button inline-button"
                      href={resource.filePath ?? resource.url ?? "#"}
                      target="_blank"
                    >
                      Ac
                    </Link>
                  ) : null}
                  {currentUser.role !== "student" ? (
                    <ResourceActions resource={resource} />
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Kaynak yok</strong>
                <span>Kaynaklar eklendiginde burada listelenecek.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {currentUser.role !== "student" && createOpen ? (
        <ModalFrame
          closeHref={`/library?${baseQuery}`}
          title="Yeni kaynak ekle"
          subtitle="PDF, video veya link kaydini kutuphaneye ekle"
        >
          <ResourceCreateForm lessons={lessons} defaultGradeLevel={gradeLevel} onSuccessRedirectTo={`/library?${baseQuery}`} />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
