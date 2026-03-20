import Link from "next/link";
import { NotificationMenu } from "@web/components/notifications/notification-menu";
import { getNotifications } from "@web/lib/api";
import { Sidebar } from "../navigation/sidebar";
import type { SessionUser } from "@web/lib/api";
import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";

export type AppShellAction =
  | string
  | {
      label: string;
      href: string;
      icon?: AppIconName;
    };

type AppShellProps = {
  title: string;
  eyebrow: string;
  user: SessionUser;
  actions?: AppShellAction[];
  children: React.ReactNode;
};

export async function AppShell({ title, eyebrow, user, actions = [], children }: AppShellProps) {
  const notifications = await getNotifications(false, 6);
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="dashboard-shell">
      <Sidebar user={user} />
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar__title">
            <span className="topbar__eyebrow">{eyebrow}</span>
            <h1 style={{ margin: 0 }}>{title}</h1>
            <p className="topbar__summary">
              {user.role === "student"
                ? "Bugunku hedeflerini, mesajlarini ve ilerleme ritmini tek alanda takip et."
                : "Ogrenci operasyonunu daha canli, daha dikkat cekici ve net bir panelde yonet."}
            </p>
          </div>
          <div className="topbar__actions">
            <NotificationMenu notifications={notifications} />
            {actions.map((action) => (
              typeof action === "string" ? (
                <button key={action} className="chip-button" type="button">
                  {action}
                </button>
              ) : (
                <Link key={action.href} className="chip-button" href={action.href}>
                  {action.icon ? <AppIcon className="button-icon" name={action.icon} /> : null}
                  {action.label}
                </Link>
              )
            ))}
            <div className="topbar__profile">
              <span className="topbar__avatar">{initials || "KP"}</span>
              <div className="topbar__profile-meta">
                <strong>{user.fullName}</strong>
                <span>
                  {user.role === "student"
                    ? "Ogrenci paneli"
                    : user.role === "admin"
                      ? "Yonetici erisimi"
                      : "Koç paneli"}
                </span>
              </div>
            </div>
            <form action="/api/session/logout" method="post">
              <button className="chip-button" type="submit">
                <AppIcon className="button-icon" name="logout" />
                Cikis
              </button>
            </form>
          </div>
        </header>
        <div className="content-grid">{children}</div>
      </main>
    </div>
  );
}
