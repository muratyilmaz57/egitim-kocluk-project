import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StudentAvatar } from "@web/components/students/student-avatar";
import { formatStudentStatus, getCurrentUser, getStudents } from "@web/lib/api";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    grade?: string;
    status?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role === "student") {
    redirect(currentUser.studentProfileId ? `/students/${currentUser.studentProfileId}` : "/login");
  }

  const [{ q = "", grade = "", status = "" }, students] = await Promise.all([
    searchParams,
    getStudents(),
  ]);
  const filteredStudents = students.filter((student) => {
    const queryMatch = q
      ? matches(`${student.fullName} ${student.gradeLevel} ${student.targetExam ?? ""}`, q)
      : true;
    const gradeMatch = grade ? student.gradeLevel === grade : true;
    const statusMatch = status ? student.status === status : true;
    return queryMatch && gradeMatch && statusMatch;
  });
  const gradeOptions = Array.from(new Set(students.map((student) => student.gradeLevel))).sort();
  const exportHref = `/api/export/students?q=${encodeURIComponent(q)}&grade=${encodeURIComponent(
    grade,
  )}&status=${encodeURIComponent(status)}`;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ogrenci yonetimi"
      title="Ogrenci listesi"
      actions={[
        { label: "Yeni ogrenci", href: "/students/new" },
        { label: "Dashboard", href: "/dashboard" },
      ]}
    >
      <SectionCard
        title="Aktif ogrenciler"
        subtitle="Sinif, hedef ve durum ozeti"
        action={{ label: "CSV indir", href: exportHref }}
      >
        <div className="filter-toolbar">
          <form className="filter-form" method="get">
            <input defaultValue={q} name="q" placeholder="Ogrenci, sinif veya hedef ara" />
            <select defaultValue={grade} name="grade">
              <option value="">Tum siniflar</option>
              {gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select defaultValue={status} name="status">
              <option value="">Tum durumlar</option>
              <option value="active">Aktif</option>
              <option value="paused">Duraklatildi</option>
              <option value="graduated">Mezun</option>
            </select>
            <button className="secondary-button" type="submit">
              Filtrele
            </button>
          </form>
          <Link className="primary-button" href="/students/new">
            Yeni ogrenci
          </Link>
        </div>
        <div className="list">
          {filteredStudents.length ? (
            filteredStudents.map((student) => (
              <div className="list-item" key={student.id}>
                <div className="student-list-person">
                  <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} size="sm" />
                  <div className="list-item__meta">
                    <strong>{student.fullName}</strong>
                    <span>{student.gradeLevel} · {student.targetExam ?? "Hedef yok"} · %{student.overallProgress}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="badge badge--success">
                    {formatStudentStatus(student.status)}
                  </span>
                  <Link className="secondary-button" href={`/students/${student.id}`}>
                    Profili ac
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Kayit bulunamadi</strong>
                <span>Mevcut filtrelerle eslesen ogrenci yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
