"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { NotificationPayload, SessionUser } from "@web/lib/api";
import { NotificationMenu } from "@web/components/notifications/notification-menu";
import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";
import { Sidebar } from "../navigation/sidebar";

export type AppShellAction =
  | string
  | {
      label: string;
      href: string;
      icon?: AppIconName;
    };

type AppShellFrameProps = {
  title: string;
  eyebrow: string;
  user: SessionUser;
  actions?: AppShellAction[];
  notifications: NotificationPayload | null;
  children: React.ReactNode;
};

const STORAGE_KEY = "kocluk_sidebar_collapsed";

export function AppShellFrame({
  title,
  eyebrow,
  user,
  actions = [],
  notifications,
  children,
}: AppShellFrameProps) {
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const value = window.localStorage.getItem(STORAGE_KEY);
    setCollapsed(value === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`dashboard-shell${collapsed ? " dashboard-shell--collapsed" : ""}`}>
      <Sidebar user={user} collapsed={collapsed} onToggle={toggleSidebar} />
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar__title">
            <div className="topbar__eyebrow-row">
              <button className="topbar__menu-toggle" type="button" onClick={toggleSidebar}>
                <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
                <span>{collapsed ? "Menuyu ac" : "Menuyu daralt"}</span>
              </button>
              <span className="topbar__eyebrow">{eyebrow}</span>
            </div>
            <h1 style={{ margin: 0 }}>{title}</h1>
            <p className="topbar__summary">
              {user.role === "student"
                ? "Bugunku hedeflerini, mesajlarini ve ilerleme ritmini tek alanda takip et."
                : "Ogrenci operasyonunu daha canli, daha dikkat cekici ve net bir panelde yonet."}
            </p>
          </div>
          <div className="topbar__actions">
            <NotificationMenu notifications={notifications} />
            {actions.map((action) =>
              typeof action === "string" ? (
                <button key={action} className="chip-button" type="button">
                  {action}
                </button>
              ) : (
                <Link key={action.href} className="chip-button" href={action.href}>
                  {action.icon ? <AppIcon className="button-icon" name={action.icon} /> : null}
                  {action.label}
                </Link>
              ),
            )}
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
