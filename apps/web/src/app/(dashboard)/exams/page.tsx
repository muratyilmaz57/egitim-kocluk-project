import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { ExamActions } from "@web/components/exams/exam-actions";
import { ExamCreateForm } from "@web/components/exams/exam-create-form";
import { formatDate, getCurrentUser, getExamResults, getStudents } from "@web/lib/api";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    examType?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [{ q = "", examType = "" }, students, exams] = await Promise.all([
    searchParams,
    currentUser.role === "student" ? Promise.resolve([]) : getStudents(),
    getExamResults(),
  ]);
  const filteredExams = exams.filter((exam) => {
    const queryMatch = q ? matches(`${exam.examName} ${exam.student.fullName}`, q) : true;
    const typeMatch = examType ? exam.examType === examType : true;
    return queryMatch && typeMatch;
  });
  const exportHref = `/api/export/exams?q=${encodeURIComponent(q)}&examType=${encodeURIComponent(
    examType,
  )}`;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Deneme sinavlari"
      title="Deneme analizi"
      actions={
        currentUser.role === "student"
          ? [{ label: "Profilim", href: `/students/${currentUser.studentProfileId}` }]
          : [
              { label: "Deneme ekle", href: "/exams" },
              { label: "Ogrenciler", href: "/students" },
            ]
      }
    >
      <section className="two-column">
        {currentUser.role !== "student" ? (
          <SectionCard
            title="Yeni deneme sonucu"
            subtitle="Koç tarafindan canli veritabanina islenir"
          >
            <ExamCreateForm students={students} />
          </SectionCard>
        ) : null}

        <SectionCard
          title={currentUser.role === "student" ? "Son denemelerim" : "Son denemeler"}
          subtitle={currentUser.role === "student" ? "Kendi performans trendin" : "Ogrenci bazli son performans"}
          action={{ label: "CSV indir", href: exportHref }}
        >
          <form className="filter-form" method="get" style={{ marginBottom: 14 }}>
            <input defaultValue={q} name="q" placeholder="Deneme veya ogrenci ara" />
            <select defaultValue={examType} name="examType">
              <option value="">Tum turler</option>
              <option value="mock">Genel Deneme</option>
              <option value="LGS">LGS</option>
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="school">Okul</option>
            </select>
            <button className="secondary-button" type="submit">
              Filtrele
            </button>
          </form>
          <div className="list">
            {filteredExams.length ? (
              filteredExams.slice(0, 5).map((exam) => (
                <div className="list-item" key={exam.id}>
                  <div className="list-item__meta">
                    <strong>{exam.examName}</strong>
                    <span>
                      {exam.student.fullName} | {formatDate(exam.examDate)} | {exam.examType}
                    </span>
                  </div>
                  <div className="list-item__aside">
                    <span className="badge badge--success">{exam.totalNet} net</span>
                    {currentUser.role !== "student" ? <ExamActions exam={exam} /> : null}
                  </div>
                </div>
              ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Deneme kaydi bulunmuyor</strong>
                <span>Secili filtrelerle eslesen deneme yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
      </section>

      <SectionCard
        title="Deneme tablosu"
        subtitle="Puan, net ve ogrenci dagilimi"
      >
        <div className="list">
          {filteredExams.length ? (
            filteredExams.map((exam) => (
              <div className="list-item" key={`${exam.id}-detail`}>
                <div className="list-item__meta">
                  <strong>
                    {exam.student.fullName} | {exam.examName}
                  </strong>
                  <span>
                    {exam.correctCount}D / {exam.wrongCount}Y / {exam.blankCount}B |{" "}
                    {formatDate(exam.examDate)}
                  </span>
                </div>
                <div className="list-item__aside">
                  <span className="badge badge--warning">
                    {exam.score ? `${exam.score} puan` : `${exam.totalNet} net`}
                  </span>
                  {currentUser.role !== "student" ? <ExamActions exam={exam} /> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Henuz deneme yok</strong>
                <span>Secili filtrelerle eslesen deneme bulunmuyor.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
