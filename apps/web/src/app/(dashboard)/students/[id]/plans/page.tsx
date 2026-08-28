import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { StudyPlanCreateForm } from "@web/components/study-plans/study-plan-create-form";
import { StudyPlanActions } from "@web/components/study-plans/study-plan-actions";
import { ModalFrame } from "@web/components/ui/modal-frame";
import { formatDate, formatMinutes, getStudyPlansForStudent } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentPlansPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ create?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createOpen = resolvedSearchParams?.create === "1";

  const [{ currentUser, student }, plans] = await Promise.all([
    getAuthorizedStudentPage(id),
    getStudyPlansForStudent(id),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} planlari`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        ...(currentUser.role !== "student"
          ? [{ label: "Plan ekle", href: `/students/${student.id}/plans?create=1`, icon: "plus" as const }]
          : []),
        { label: "Gorevler", href: `/students/${student.id}/tasks` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="plans" />

      <SectionCard
        title="Plan akisi"
        subtitle="Bu ogrenciye bagli tum calisma planlari"
        action={
          currentUser.role !== "student"
            ? { label: "Plan ekle", href: `/students/${student.id}/plans?create=1`, icon: "plus" }
            : undefined
        }
      >
        <div className="list">
          {plans.length ? (
            plans.map((plan) => (
              <div className="list-item" key={plan.id}>
                <div className="list-item__meta">
                  <strong>{plan.title}</strong>
                  <span>
                    {formatDate(plan.startDate)} - {formatDate(plan.endDate)} | {plan.planType}
                  </span>
                  {plan.notes ? <span>{plan.notes}</span> : null}
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--success">{plan.status}</span>
                  <span className="badge badge--warning">
                    {plan.taskCount} gorev | {formatMinutes(plan.totalTargetMinutes)}
                  </span>
                  {currentUser.role !== "student" ? (
                    <StudyPlanActions plan={plan} students={[student]} />
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Plan yok</strong>
                <span>Bu ogrenciye atanmis bir plan bulunmuyor.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {currentUser.role !== "student" && createOpen ? (
        <ModalFrame
          closeHref={`/students/${student.id}/plans`}
          title="Yeni plan"
          subtitle={`${student.fullName} icin calisma plani olustur`}
        >
          <StudyPlanCreateForm
            students={[student]}
            defaultStudentId={student.id}
            onSuccessRedirectTo={`/students/${student.id}/plans`}
          />
        </ModalFrame>
      ) : null}
    </AppShell>
  );
}
