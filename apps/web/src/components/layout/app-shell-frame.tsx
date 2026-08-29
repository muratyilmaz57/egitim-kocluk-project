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
  hidePageHeading?: boolean;
  notifications: NotificationPayload | null;
  children: React.ReactNode;
};

const STORAGE_KEY = "kocluk_sidebar_collapsed";

export function AppShellFrame({
  title,
  eyebrow,
  user,
  actions = [],
  hidePageHeading = false,
  notifications,
  children,
}: AppShellFrameProps) {
  const initials = user.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      <a className="skip-link" href="#main-content">Ana içeriğe geç</a>
      <Sidebar
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggle={toggleSidebar}
      />
      {mobileOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <main className="main-panel" id="main-content">
        <header className="topbar" aria-label="Üst menü">
          <button
            className="topbar__menu-toggle topbar__menu-toggle--mobile"
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="primary-navigation"
            onClick={() => setMobileOpen((current) => !current)}
          >
            <AppIcon className="button-icon" name="menu" />
            <span>Menü</span>
          </button>
          <nav className="topbar__primary-nav" aria-label="Hızlı erişim">
            <Link href={user.role === "student" ? "/tasks" : "/dashboard"}>Ana Sayfa</Link>
            <Link href={user.role === "student" ? "/tasks" : "/students"}>
              {user.role === "student" ? "Görevlerim" : "Öğrenciler"}
            </Link>
            <Link href="/plans">Planlama</Link>
            <Link href="/messages">Mesajlar</Link>
          </nav>
          <div className="topbar__utility">
            <Link className="topbar__icon-button" href="/activity" aria-label="Aktivite akışını aç">
              <AppIcon name="activity" />
            </Link>
            <NotificationMenu notifications={notifications} />
            <div className="topbar__profile">
              <span className="topbar__avatar">{initials || "FT"}</span>
              <div className="topbar__profile-meta">
                <strong>{user.fullName}</strong>
                <span>{user.role === "student" ? "Öğrenci" : user.role === "admin" ? "Yönetici" : "Koç"}</span>
              </div>
            </div>
            <form action="/api/session/logout" method="post">
              <button className="topbar__icon-button" type="submit" aria-label="Çıkış yap">
                <AppIcon name="logout" />
              </button>
            </form>
          </div>
        </header>

        {!hidePageHeading ? <section className="page-heading">
          <div className="topbar__title">
            <span className="topbar__eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p className="topbar__summary">
              {user.role === "student"
                ? "Bugünkü hedeflerini, mesajlarını ve gelişimini tek bakışta takip et."
                : "Öğrenci gelişimini, günlük akışı ve önemli sinyalleri tek yerden yönet."}
            </p>
          </div>
          <div className="topbar__actions">
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
          </div>
        </section> : null}
        <div className="content-grid">{children}</div>
      </main>
    </div>
  );
}
