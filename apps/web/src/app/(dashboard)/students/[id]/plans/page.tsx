import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { formatDate, formatMinutes, getStudyPlansForStudent } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentPlansPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        { label: "Gorevler", href: `/students/${student.id}/tasks` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="plans" />

      <SectionCard title="Plan akisi" subtitle="Bu ogrenciye bagli tum calisma planlari">
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
    </AppShell>
  );
}
