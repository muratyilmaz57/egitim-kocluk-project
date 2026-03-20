"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@web/lib/api";

type SidebarProps = {
  user: SessionUser;
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const coachItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/notifications", label: "Bildirimler" },
    { href: "/activity", label: "Aktivite" },
    { href: "/students", label: "Ogrenciler" },
    { href: "/lessons", label: "Dersler" },
    { href: "/plans", label: "Planlar" },
    { href: "/tasks", label: "Gorevler" },
    { href: "/exams", label: "Denemeler" },
    { href: "/pomodoro", label: "Pomodoro" },
    { href: "/messages", label: "Mesajlar" },
    { href: "/agenda", label: "Ajanda" },
    { href: "/library", label: "Kutuphane" },
    { href: "/settings/security", label: "Ayarlar" },
  ];
  const studentItems = [
    { href: user.studentProfileId ? `/students/${user.studentProfileId}` : "/students", label: "Profilim" },
    { href: "/notifications", label: "Bildirimler" },
    { href: "/activity", label: "Aktivite" },
    { href: "/tasks", label: "Gorevlerim" },
    { href: "/exams", label: "Denemelerim" },
    { href: "/pomodoro", label: "Pomodoro" },
    { href: "/messages", label: "Mesajlar" },
    { href: "/agenda", label: "Notlarim" },
    { href: "/library", label: "Kaynaklar" },
    { href: "/settings/security", label: "Ayarlar" },
  ];
  const items = user.role === "student" ? studentItems : coachItems;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <strong>Kocluk Platformu</strong>
        <span>
          {user.role === "student"
            ? "Gunluk plan, mesaj ve gelisim takibi"
            : "Ogrenci takip ve egitim operasyonu"}
        </span>
      </div>
      <nav className="sidebar__nav">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && item.href !== "/students" && pathname.startsWith(`${item.href}/`)) ||
            (item.label === "Profilim" && pathname.startsWith("/students/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link${active ? " sidebar__link--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
