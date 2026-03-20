import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StatCard } from "@web/components/dashboard/stat-card";
import { formatDate, getActivityFeed, getCurrentUser } from "@web/lib/api";

function matches(value: string, query: string) {
  return value.toLocaleLowerCase("tr-TR").includes(query.toLocaleLowerCase("tr-TR"));
}

function toneClass(tone: string) {
  switch (tone) {
    case "success":
      return "badge badge--success";
    case "warning":
      return "badge badge--warning";
    default:
      return "badge";
  }
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const [{ q = "", type = "" }, activity] = await Promise.all([
    searchParams,
    getActivityFeed(),
  ]);
  const items = activity?.items ?? [];
  const filteredItems = items.filter((item) => {
    const queryMatch = q
      ? matches(`${item.title} ${item.description} ${item.studentName}`, q)
      : true;
    const typeMatch = type ? item.type === type : true;
    return queryMatch && typeMatch;
  });

  const stats = [
    {
      label: "Toplam kayit",
      value: String(activity?.summary.totalItems ?? 0),
      meta: "Son operasyon akisindan toplandi",
    },
    {
      label: "Takipli ogrenci",
      value: String(activity?.summary.trackedStudents ?? 0),
      meta: "Role gore kapsamdaki ogrenci sayisi",
    },
    {
      label: "Mesaj olayi",
      value: String(activity?.summary.unreadMessages ?? 0),
      meta: "Akista mesaj kaynakli hareketler",
    },
    {
      label: "Gorev olayi",
      value: String(activity?.summary.completedTasks ?? 0),
      meta: "Tamamlanan veya guncellenen gorevler",
    },
  ];

  return (
    <AppShell
      user={currentUser}
      eyebrow="Operasyon merkezi"
      title="Aktivite akisi"
      actions={
        currentUser.role === "student"
          ? [{ label: "Profilim", href: `/students/${currentUser.studentProfileId}` }]
          : [
              { label: "Dashboard", href: "/dashboard" },
              { label: "Mesajlar", href: "/messages" },
            ]
      }
    >
      <section className="stats-grid">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            {...stat}
            icon={
              stat.label === "Toplam kayit"
                ? "activity"
                : stat.label === "Takipli ogrenci"
                  ? "students"
                  : stat.label === "Mesaj olayi"
                    ? "messages"
                    : "tasks"
            }
            tone={
              stat.label === "Toplam kayit"
                ? "teal"
                : stat.label === "Takipli ogrenci"
                  ? "sky"
                  : stat.label === "Mesaj olayi"
                    ? "rose"
                    : "amber"
            }
          />
        ))}
      </section>

      <SectionCard title="Filtreler" subtitle="Tip veya ogrenci bazli akis ara" icon="target" tone="sky">
        <form className="filter-form" method="get">
          <input defaultValue={q} name="q" placeholder="Olay, ogrenci veya aciklama ara" />
          <select defaultValue={type} name="type">
            <option value="">Tum tipler</option>
            <option value="task">Gorev</option>
            <option value="exam">Deneme</option>
            <option value="message">Mesaj</option>
            <option value="note">Not</option>
            <option value="plan">Plan</option>
            <option value="pomodoro">Pomodoro</option>
          </select>
          <button className="secondary-button" type="submit">
            Filtrele
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Canli operasyon akisi"
        subtitle="Gorev, mesaj, plan, not ve deneme hareketleri"
        icon="activity"
        tone="teal"
      >
        <div className="list">
          {filteredItems.length ? (
            filteredItems.map((item) => (
              <div className="list-item" key={item.id}>
                <div className="list-item__meta">
                  <strong>{item.title}</strong>
                  <span>
                    {item.studentName} | {formatDate(item.occurredAt)}
                  </span>
                  <span>{item.description}</span>
                </div>
                <div className="list-item__aside">
                  <span className={toneClass(item.tone)}>{item.type}</span>
                  <Link className="secondary-button inline-button" href={item.href}>
                    Ac
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Aktivite bulunamadi</strong>
                <span>Secili filtrelerle eslesen operasyon kaydi yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
