import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { ExamActions } from "@web/components/exams/exam-actions";
import { StudentProfileHeader } from "@web/components/students/student-profile-header";
import { formatDate, getExamResults } from "@web/lib/api";
import { getAuthorizedStudentPage } from "@web/lib/student-page";

export default async function StudentExamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ currentUser, student }, exams] = await Promise.all([
    getAuthorizedStudentPage(id),
    getExamResults(id),
  ]);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci profili"
      title={`${student.fullName} denemeleri`}
      actions={[
        { label: "Genel bakis", href: `/students/${student.id}` },
        { label: "Konular", href: `/students/${student.id}/topics` },
      ]}
    >
      <StudentProfileHeader currentUser={currentUser} student={student} activeTab="exams" />

      <SectionCard title="Deneme gecmisi" subtitle="Net, puan ve soru dagilimi">
        <div className="list">
          {exams.length ? (
            exams.map((exam) => (
              <div className="list-item" key={exam.id}>
                <div className="list-item__meta">
                  <strong>{exam.examName}</strong>
                  <span>
                    {formatDate(exam.examDate)} | {exam.correctCount}D / {exam.wrongCount}Y / {exam.blankCount}B
                  </span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--success">{exam.totalNet} net</span>
                  <span className="badge badge--warning">{exam.score ? `${exam.score} puan` : exam.examType}</span>
                  {currentUser.role !== "student" ? <ExamActions exam={exam} /> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Deneme kaydi yok</strong>
                <span>Bu ogrenci icin henuz deneme sonucu bulunmuyor.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
