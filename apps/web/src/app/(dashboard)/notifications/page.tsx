import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { NotificationActions } from "@web/components/notifications/notification-actions";
import { SectionCard } from "@web/components/dashboard/section-card";
import { StatCard } from "@web/components/dashboard/stat-card";
import { formatDate, getCurrentUser, getNotifications } from "@web/lib/api";

function formatTypeLabel(type: string) {
  switch (type) {
    case "task":
      return "Gorev";
    case "exam":
      return "Deneme";
    case "message":
      return "Mesaj";
    case "note":
      return "Not";
    case "plan":
      return "Plan";
    case "pomodoro":
      return "Pomodoro";
    case "resource":
      return "Kaynak";
    default:
      return type;
  }
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    unread?: string;
  }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const { unread = "" } = await searchParams;
  const notifications = await getNotifications(unread === "true", 80);
  const items = notifications?.items ?? [];
  const unreadCount = notifications?.unreadCount ?? 0;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Uyari merkezi"
      title="Bildirimler"
      actions={[
        { label: "Aktivite", href: "/activity" },
        { label: "Tercihler", href: "/settings/notifications" },
        { label: unread === "true" ? "Tum bildirimler" : "Sadece okunmamis", href: unread === "true" ? "/notifications" : "/notifications?unread=true" },
      ]}
    >
      <section className="stats-grid">
        <StatCard
          label="Toplam bildirim"
          value={String(items.length)}
          meta="Listelenen operasyon uyarilari"
        />
        <StatCard
          label="Okunmamis"
          value={String(unreadCount)}
          meta="Henuz goruntulenmemis bildirim"
        />
        <StatCard
          label="Filtre"
          value={unread === "true" ? "Acik" : "Tum"}
          meta="Okunmamis filtre durumu"
        />
        <StatCard
          label="Rol"
          value={currentUser.role === "student" ? "Ogrenci" : "Koç"}
          meta="Bildirim kapsam tipi"
        />
      </section>

      <SectionCard title="Filtre" subtitle="Okunmamis bildirimleri daralt">
        <form className="filter-form" method="get">
          <select defaultValue={unread} name="unread">
            <option value="">Tum bildirimler</option>
            <option value="true">Sadece okunmamis</option>
          </select>
          <button className="secondary-button" type="submit">
            Filtrele
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Bildirim listesi" subtitle="Son operasyon uyarilari">
        <div className="list">
          {items.length ? (
            items.map((notification) => (
              <div className="list-item" key={notification.id}>
                <div className="list-item__meta">
                  <strong>{notification.title}</strong>
                  <span>
                    {formatTypeLabel(notification.type)} | {notification.studentName ?? notification.actorName ?? "Sistem"} | {formatDate(notification.createdAt)}
                  </span>
                  {notification.body ? <span>{notification.body}</span> : null}
                </div>
                <NotificationActions notification={notification} />
              </div>
            ))
          ) : (
            <div className="list-item">
              <div className="list-item__meta">
                <strong>Bildirim bulunamadi</strong>
                <span>Secili filtreye uygun bildirim yok.</span>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
