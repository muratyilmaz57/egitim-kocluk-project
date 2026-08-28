import Link from "next/link";
import type { SessionUser, StudentDetail } from "@web/lib/api";
import { formatDate, formatStudentStatus } from "@web/lib/api";
import { StudentAvatar } from "./student-avatar";

type StudentProfileHeaderProps = {
  currentUser: SessionUser;
  student: StudentDetail;
  activeTab: "general" | "tasks" | "plans" | "topics" | "exams" | "pomodoro" | "messages";
};

export function StudentProfileHeader({
  currentUser,
  student,
  activeTab,
}: StudentProfileHeaderProps) {
  const basePath = `/students/${student.id}`;
  const tabs = [
    { key: "general", label: "Genel", href: basePath },
    { key: "tasks", label: "Gorevler", href: `${basePath}/tasks` },
    { key: "plans", label: "Planlar", href: `${basePath}/plans` },
    { key: "topics", label: "Konular", href: `${basePath}/topics` },
    { key: "exams", label: "Denemeler", href: `${basePath}/exams` },
    { key: "pomodoro", label: "Pomodoro", href: `${basePath}/pomodoro` },
    { key: "messages", label: "Mesajlar", href: `${basePath}/messages` },
  ] as const;

  return (
    <>
      <section className="section-card">
        <div className="student-hero">
          <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} size="lg" />
          <div className="hero-meta">
            <h2 style={{ margin: 0 }}>
              {student.gradeLevel} | {student.targetExam ?? "Hedef tanimsiz"}
            </h2>
            <div className="hero-subline">
              <span>Veli: {student.parentName ?? "-"}</span>
              <span>Telefon: {student.parentPhone ?? "-"}</span>
              <span>Baslangic: {formatDate(student.enrollmentDate)}</span>
            </div>
            <div className="hero-subline">
              <span className="badge badge--success">
                {formatStudentStatus(student.status)}
              </span>
              <span className="badge badge--warning">
                Okul: {student.schoolName ?? "Tanimsiz"}
              </span>
            </div>
          </div>
          <div className="hero-actions">
            {currentUser.role === "student" ? (
              <>
                <Link className="primary-button" href={`${basePath}/messages`}>
                  Mesajlar
                </Link>
                <Link className="secondary-button" href="/library">
                  Kutuphane
                </Link>
              </>
            ) : (
              <>
                <Link className="primary-button" href={`${basePath}/tasks`}>
                  Gorevler
                </Link>
                <Link className="secondary-button" href={`${basePath}/exams`}>
                  Denemeler
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`tab${tab.key === activeTab ? " tab--active" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
      </section>
    </>
  );
}
