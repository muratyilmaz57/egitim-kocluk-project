import Link from "next/link";
import { NotificationMenu } from "@web/components/notifications/notification-menu";
import { getNotifications } from "@web/lib/api";
import { Sidebar } from "../navigation/sidebar";
import type { SessionUser } from "@web/lib/api";

export type AppShellAction =
  | string
  | {
      label: string;
      href: string;
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

  return (
    <div className="dashboard-shell">
      <Sidebar user={user} />
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar__title">
            <span className="topbar__eyebrow">{eyebrow}</span>
            <h1 style={{ margin: 0 }}>{title}</h1>
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
                  {action.label}
                </Link>
              )
            ))}
            <form action="/api/session/logout" method="post">
              <button className="chip-button" type="submit">
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
