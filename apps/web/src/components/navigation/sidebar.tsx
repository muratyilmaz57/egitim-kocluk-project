"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import type { SessionUser } from "@web/lib/api";
import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";

type SidebarProps = {
  user: SessionUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: AppIconName;
  description: string;
  group: string;
};

export function Sidebar({ user, collapsed, mobileOpen, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const coachItems: NavItem[] = [
    { href: "/dashboard", label: "Genel Bakış", icon: "dashboard", description: "Günün özeti", group: "PANEL" },
    { href: "/notifications", label: "Bildirimler", icon: "notifications", description: "Önemli uyarılar", group: "PANEL" },
    { href: "/activity", label: "Aktivite", icon: "activity", description: "Tüm hareketler", group: "PANEL" },
    { href: "/students", label: "Öğrenciler", icon: "students", description: "Profil ve veli takibi", group: "KOÇLUK" },
    { href: "/lessons", label: "Dersler", icon: "lessons", description: "Ders ve konu yapısı", group: "KOÇLUK" },
    { href: "/plans", label: "Planlar", icon: "plans", description: "Haftalık program", group: "KOÇLUK" },
    { href: "/tasks", label: "Görevler", icon: "tasks", description: "Günlük çalışmalar", group: "KOÇLUK" },
    { href: "/exams", label: "Denemeler", icon: "exams", description: "Net ve sınav analizi", group: "KOÇLUK" },
    { href: "/pomodoro", label: "Pomodoro", icon: "pomodoro", description: "Odak süresi", group: "ARAÇLAR" },
    { href: "/messages", label: "Mesajlar", icon: "messages", description: "Canlı iletişim", group: "ARAÇLAR" },
    { href: "/agenda", label: "Ajanda", icon: "agenda", description: "Notlar ve görüşmeler", group: "ARAÇLAR" },
    { href: "/library", label: "Kütüphane", icon: "library", description: "Kaynak merkezi", group: "ARAÇLAR" },
    { href: "/settings/security", label: "Ayarlar", icon: "settings", description: "Güvenlik ve tercihler", group: "SİSTEM" },
  ];
  const studentItems: NavItem[] = [
    {
      href: user.studentProfileId ? `/students/${user.studentProfileId}` : "/students",
      label: "Profilim",
      icon: "profile",
      description: "Gelişim özeti ve hedefler",
      group: "HESABIM",
    },
    { href: "/notifications", label: "Bildirimler", icon: "notifications", description: "Son uyarılar ve hatırlatmalar", group: "HESABIM" },
    { href: "/activity", label: "Aktivite", icon: "activity", description: "Bugünkü ilerleme akışı", group: "HESABIM" },
    { href: "/tasks", label: "Görevlerim", icon: "tasks", description: "Tamamlanacak çalışmalar", group: "ÇALIŞMA" },
    { href: "/exams", label: "Denemelerim", icon: "exams", description: "Net, puan ve analiz", group: "ÇALIŞMA" },
    { href: "/pomodoro", label: "Pomodoro", icon: "pomodoro", description: "Odak süresi takibi", group: "ÇALIŞMA" },
    { href: "/messages", label: "Mesajlar", icon: "messages", description: "Koç ile anlık iletişim", group: "İLETİŞİM" },
    { href: "/agenda", label: "Notlarım", icon: "agenda", description: "Koç notları ve hatırlatma", group: "İLETİŞİM" },
    { href: "/library", label: "Kaynaklar", icon: "library", description: "Video, PDF ve notlar", group: "İLETİŞİM" },
    { href: "/settings/security", label: "Ayarlar", icon: "settings", description: "Güvenlik ve hesap ayarları", group: "SİSTEM" },
  ];
  const items = user.role === "student" ? studentItems : coachItems;

  return (
    <aside
      className={`sidebar${collapsed ? " sidebar--collapsed" : ""}${mobileOpen ? " sidebar--mobile-open" : ""}`}
      aria-label="Ana menü"
    >
      <div className="sidebar__brand">
        <div className="sidebar__brand-top">
          <div className="sidebar__identity">
            <div className="sidebar__brand-mark">
              <AppIcon name="spark" />
            </div>
            <div className="sidebar__brand-copy">
              <strong>FTY Koçluk</strong>
              <span>Eğitim Yönetimi</span>
            </div>
          </div>
          <button
            className="sidebar__toggle"
            type="button"
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            aria-expanded={!collapsed}
            onClick={onToggle}
          >
            <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
          </button>
          <button className="sidebar__mobile-close" type="button" aria-label="Menüyü kapat" onClick={onClose}>
            <AppIcon name="close" />
          </button>
        </div>
        <span className="sidebar__status">
          <AppIcon name={user.role === "student" ? "target" : "shield"} />
          {user.role === "student" ? "Öğrenci alanı" : "Koç çalışma alanı"}
        </span>
      </div>
      <nav className="sidebar__nav" id="primary-navigation">
        {items.map((item, index) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/students" && pathname.startsWith(`${item.href}/`)) ||
            (item.label === "Profilim" && pathname.startsWith("/students/"));

          return (
            <Fragment key={item.href}>
              {index === 0 || items[index - 1]?.group !== item.group ? (
                <span className="sidebar__section-label">{item.group}</span>
              ) : null}
              <Link
                href={item.href}
                className={`sidebar__link${active ? " sidebar__link--active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
              >
                <span className="sidebar__link-icon">
                  <AppIcon name={item.icon} />
                </span>
                <span className="sidebar__link-copy">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
              </Link>
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
