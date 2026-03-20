import { AppShell } from "@web/components/layout/app-shell";
import { ExamTrendChart } from "@web/components/dashboard/exam-trend-chart";
import { FocusTrendChart } from "@web/components/dashboard/focus-trend-chart";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StatCard } from "@web/components/dashboard/stat-card";
import { StatusBreakdown } from "@web/components/dashboard/status-breakdown";
import { redirect } from "next/navigation";
import {
  formatDate,
  formatMinutes,
  formatTaskStatus,
  getCurrentUser,
  getDashboardData,
} from "@web/lib/api";

function toneClass(tone: string) {
  switch (tone) {
    case "success":
      return "badge badge--success";
    case "warning":
      return "badge badge--warning";
    default:
      return "badge badge--danger";
  }
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role === "student") {
    redirect(currentUser.studentProfileId ? `/students/${currentUser.studentProfileId}` : "/login");
  }

  const data = await getDashboardData();
  const summary = data?.summary;
  const dashboardStats = summary
    ? [
        {
          label: "Toplam ogrenci",
          value: String(summary.totalStudents),
          meta: "Canli veritabani ozeti",
        },
        {
          label: "Aktif ders",
          value: String(summary.totalLessons),
          meta: "Programdaki aktif dersler",
        },
        {
          label: "Bugun tamamlanan gorev",
          value: String(summary.completedTasksToday),
          meta: "Gun icindeki kapanan gorevler",
        },
        {
          label: "Gunluk toplam calisma",
          value: formatMinutes(summary.dailyStudyMinutes),
          meta: "Pomodoro odak suresi",
        },
        {
          label: "Okunmamis mesaj",
          value: String(summary.unreadMessages),
          meta: `Genel tamamlama %${summary.overallCompletionPercent}`,
        },
      ]
    : [
        { label: "Toplam ogrenci", value: "-", meta: "API baglantisi bekleniyor" },
        { label: "Aktif ders", value: "-", meta: "API baglantisi bekleniyor" },
        { label: "Bugun tamamlanan gorev", value: "-", meta: "API baglantisi bekleniyor" },
        { label: "Gunluk toplam calisma", value: "-", meta: "API baglantisi bekleniyor" },
        { label: "Okunmamis mesaj", value: "-", meta: "API baglantisi bekleniyor" },
      ];

  return (
    <AppShell
      user={currentUser}
      eyebrow="Koç paneli"
      title="Bugunku operasyon gorunumu"
      actions={[
        { label: "Yeni ogrenci", href: "/students/new" },
        { label: "Haftalik plan", href: "/plans" },
        { label: "Deneme ekle", href: "/exams" },
      ]}
    >
      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="two-column">
        <SectionCard
          title="Haftalik calisma egilimi"
          subtitle="Son 7 gunun pomodoro odak dakika trendi"
          action={data ? { label: "Pomodoro", href: "/pomodoro" } : "API bekleniyor"}
        >
          <FocusTrendChart data={data?.focusTrend ?? []} />
        </SectionCard>

        <SectionCard
          title="Son mesajlar"
          subtitle="Canli mesaj akisindan son 3 kayit"
          action={{ label: "Mesajlari ac", href: "/messages" }}
        >
          <div className="list">
            {data?.recentMessages.length ? (
              data.recentMessages.map((message) => (
                <div className="list-item" key={message.id}>
                  <div className="list-item__meta">
                    <strong>{message.studentName}</strong>
                    <span>{message.content}</span>
                  </div>
                  <span className={toneClass(message.isRead ? "success" : "warning")}>
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Mesaj verisi yok</strong>
                  <span>API baglantisi kuruldugunda son mesajlar burada gorunecek.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="two-column">
        <SectionCard
          title="Gorev durum dagilimi"
          subtitle="Aktif ve kapanan gorevlerin rol bazli dagilimi"
          action={{ label: "Operasyon", href: "/tasks" }}
        >
          <StatusBreakdown data={data?.taskStatusBreakdown ?? []} />
        </SectionCard>

        <SectionCard
          title="Son deneme trendi"
          subtitle="Son 6 denemenin net trendi"
          action={{ label: "Sinavlar", href: "/exams" }}
        >
          <ExamTrendChart data={data?.examTrend ?? []} />
        </SectionCard>
      </section>

      <section className="two-column">
        <SectionCard
          title="Bugunku gorev akisi"
          subtitle="Operasyonel takip icin aktif odevler"
          action={{ label: "Tum gorevler", href: "/tasks" }}
        >
          <div className="list">
            {data?.todayTasks.length ? (
              data.todayTasks.map((task) => (
                <div className="list-item" key={task.id}>
                  <div className="list-item__meta">
                    <strong>{task.title}</strong>
                    <span>{task.meta}</span>
                  </div>
                  <span
                    className={toneClass(
                      task.status === "completed"
                        ? "success"
                        : task.status === "in_progress"
                          ? "warning"
                          : "danger",
                    )}
                  >
                    {formatTaskStatus(task.status)}
                  </span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Bugune ait gorev bulunmadi</strong>
                  <span>Gorev eklendikce canli akisa duser.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Riskli ogrenciler"
          subtitle="Mudahale gerektiren ogrenciler"
          action={{ label: "Tum liste", href: "/students" }}
        >
          <div className="list">
            {data?.riskStudents.length ? (
              data.riskStudents.map((student) => (
                <div className="list-item" key={student.id}>
                  <div className="list-item__meta">
                    <strong>{student.fullName}</strong>
                    <span>
                      {student.gradeLevel} | {student.openTasks} acik gorev | ort. ilerleme %
                      {student.avgProgress}
                    </span>
                  </div>
                  <span className="badge badge--danger">Takip</span>
                </div>
              ))
            ) : (
              <div className="list-item">
                <div className="list-item__meta">
                  <strong>Riskli ogrenci listesi bos</strong>
                  <span>Acik gorev verileri olustukca burada siralanir.</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
