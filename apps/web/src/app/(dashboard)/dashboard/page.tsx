import { AppShell } from "@web/components/layout/app-shell";
import { ExamTrendChart } from "@web/components/dashboard/exam-trend-chart";
import { FocusTrendChart } from "@web/components/dashboard/focus-trend-chart";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StatCard } from "@web/components/dashboard/stat-card";
import { StatusBreakdown } from "@web/components/dashboard/status-breakdown";
import { AppIcon } from "@web/components/ui/app-icon";
import Link from "next/link";
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
          label: "Toplam öğrenci",
          value: String(summary.totalStudents),
          meta: "Aktif öğrenci profilleri",
          icon: "students" as const,
          tone: "teal" as const,
        },
        {
          label: "Aktif ders",
          value: String(summary.totalLessons),
          meta: "Programdaki dersler",
          icon: "lessons" as const,
          tone: "sky" as const,
        },
        {
          label: "Tamamlanan görev",
          value: String(summary.completedTasksToday),
          meta: "Bugün sonuçlanan çalışmalar",
          icon: "tasks" as const,
          tone: "amber" as const,
        },
        {
          label: "Günlük odak",
          value: formatMinutes(summary.dailyStudyMinutes),
          meta: "Toplam Pomodoro süresi",
          icon: "focus" as const,
          tone: "violet" as const,
        },
        {
          label: "Okunmamış mesaj",
          value: String(summary.unreadMessages),
          meta: `Genel tamamlama %${summary.overallCompletionPercent}`,
          icon: "messages" as const,
          tone: "rose" as const,
        },
      ]
    : [
        { label: "Toplam öğrenci", value: "-", meta: "Veri bağlantısı bekleniyor", icon: "students" as const, tone: "teal" as const },
        { label: "Aktif ders", value: "-", meta: "Veri bağlantısı bekleniyor", icon: "lessons" as const, tone: "sky" as const },
        { label: "Tamamlanan görev", value: "-", meta: "Veri bağlantısı bekleniyor", icon: "tasks" as const, tone: "amber" as const },
        { label: "Günlük odak", value: "-", meta: "Veri bağlantısı bekleniyor", icon: "focus" as const, tone: "violet" as const },
        { label: "Okunmamış mesaj", value: "-", meta: "Veri bağlantısı bekleniyor", icon: "messages" as const, tone: "rose" as const },
      ];

  return (
    <AppShell
      user={currentUser}
      eyebrow="Koç paneli"
      title="Bugünün genel görünümü"
      actions={[
        { label: "Yeni öğrenci", href: "/students/new", icon: "plus" },
        { label: "Haftalık plan", href: "/plans", icon: "plans" },
        { label: "Deneme ekle", href: "/exams", icon: "exams" },
      ]}
    >
      <section className="dashboard-overview">
        <div className="stats-grid stats-grid--overview">
          {dashboardStats.slice(0, 4).map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <article className="dashboard-spotlight__hero">
          <div className="dashboard-avatar-stack" aria-label="Aktif öğrenci örnekleri">
            <span>AY</span>
            <span>MK</span>
            <span>SE</span>
            <span>+{Math.max((summary?.totalStudents ?? 3) - 3, 0)}</span>
          </div>
          <span className="dashboard-spotlight__eyebrow">
            <AppIcon name="spark" />
            Koçluk merkezi
          </span>
          <h2>Her öğrencinin gelişimi tek merkezde.</h2>
          <p>
            {summary
              ? `${summary.totalStudents} öğrencinin plan, görev, odak ve iletişim sürecini aynı çalışma alanından yönetin.`
              : "Plan, görev, odak ve iletişim sürecini aynı çalışma alanından yönetin."}
          </p>
          <div className="dashboard-spotlight__metrics">
            <div className="dashboard-spotlight__metric">
              <span>Genel tamamlama</span>
              <strong>%{summary?.overallCompletionPercent ?? "-"}</strong>
            </div>
            <div className="dashboard-spotlight__metric">
              <span>Bekleyen mesaj</span>
              <strong>{summary?.unreadMessages ?? 0}</strong>
            </div>
            <div className="dashboard-spotlight__metric">
              <span>Yaklaşan görüşme</span>
              <strong>{summary?.upcomingMeetings ?? 0}</strong>
            </div>
          </div>
          <div className="dashboard-spotlight__actions">
            <Link className="primary-button" href="/students">
              Öğrencileri görüntüle
            </Link>
            <Link className="secondary-button" href="/plans">
              Haftalık planı aç
            </Link>
          </div>
        </article>
      </section>

      <section className="two-column">
        <SectionCard
          title="Haftalik calisma egilimi"
          subtitle="Son 7 gunun pomodoro odak dakika trendi"
          icon="focus"
          tone="teal"
          action={data ? { label: "Pomodoro", href: "/pomodoro", icon: "pomodoro" } : "API bekleniyor"}
        >
          <FocusTrendChart data={data?.focusTrend ?? []} />
        </SectionCard>

        <SectionCard
          title="Son mesajlar"
          subtitle="Canli mesaj akisindan son 3 kayit"
          icon="messages"
          tone="rose"
          action={{ label: "Mesajlari ac", href: "/messages", icon: "messages" }}
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
          icon="tasks"
          tone="amber"
          action={{ label: "Operasyon", href: "/tasks", icon: "tasks" }}
        >
          <StatusBreakdown data={data?.taskStatusBreakdown ?? []} />
        </SectionCard>

        <SectionCard
          title="Son deneme trendi"
          subtitle="Son 6 denemenin net trendi"
          icon="exams"
          tone="sky"
          action={{ label: "Sinavlar", href: "/exams", icon: "exams" }}
        >
          <ExamTrendChart data={data?.examTrend ?? []} />
        </SectionCard>
      </section>

      <section className="two-column">
        <SectionCard
          title="Bugunku gorev akisi"
          subtitle="Operasyonel takip icin aktif odevler"
          icon="target"
          tone="violet"
          action={{ label: "Tum gorevler", href: "/tasks", icon: "tasks" }}
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
          icon="shield"
          tone="rose"
          action={{ label: "Tum liste", href: "/students", icon: "students" }}
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
