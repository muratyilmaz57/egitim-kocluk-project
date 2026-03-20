"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@web/lib/api";
import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";

type SidebarProps = {
  user: SessionUser;
  collapsed: boolean;
  onToggle: () => void;
};

type NavItem = {
  href: string;
  label: string;
  icon: AppIconName;
  description: string;
};

export function Sidebar({ user, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const coachItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", description: "Canli genel gorunum" },
    { href: "/notifications", label: "Bildirimler", icon: "notifications", description: "Anlik operasyon uyarilari" },
    { href: "/activity", label: "Aktivite", icon: "activity", description: "Butun hareketlerin akis merkezi" },
    { href: "/students", label: "Ogrenciler", icon: "students", description: "Profil ve veli takibi" },
    { href: "/lessons", label: "Dersler", icon: "lessons", description: "Ders ve konu yapisi" },
    { href: "/plans", label: "Planlar", icon: "plans", description: "Haftalik program panosu" },
    { href: "/tasks", label: "Gorevler", icon: "tasks", description: "Gunluk gorev operasyonu" },
    { href: "/exams", label: "Denemeler", icon: "exams", description: "Net ve sinav analizi" },
    { href: "/pomodoro", label: "Pomodoro", icon: "pomodoro", description: "Odak ve sure takibi" },
    { href: "/messages", label: "Mesajlar", icon: "messages", description: "Canli sohbet kutusu" },
    { href: "/agenda", label: "Ajanda", icon: "agenda", description: "Notlar ve gorusmeler" },
    { href: "/library", label: "Kutuphane", icon: "library", description: "Kaynak ve PDF merkezi" },
    { href: "/settings/security", label: "Ayarlar", icon: "settings", description: "Guvenlik ve tercihler" },
  ];
  const studentItems: NavItem[] = [
    {
      href: user.studentProfileId ? `/students/${user.studentProfileId}` : "/students",
      label: "Profilim",
      icon: "profile",
      description: "Gelisim ozeti ve hedefler",
    },
    { href: "/notifications", label: "Bildirimler", icon: "notifications", description: "Son uyarilar ve hatirlatmalar" },
    { href: "/activity", label: "Aktivite", icon: "activity", description: "Bugunku ilerleme akisi" },
    { href: "/tasks", label: "Gorevlerim", icon: "tasks", description: "Tamamlanacak calismalar" },
    { href: "/exams", label: "Denemelerim", icon: "exams", description: "Net, puan ve analiz" },
    { href: "/pomodoro", label: "Pomodoro", icon: "pomodoro", description: "Odak suresi takibi" },
    { href: "/messages", label: "Mesajlar", icon: "messages", description: "Koç ile anlik iletisim" },
    { href: "/agenda", label: "Notlarim", icon: "agenda", description: "Koç notlari ve hatirlatma" },
    { href: "/library", label: "Kaynaklar", icon: "library", description: "Video, PDF ve notlar" },
    { href: "/settings/security", label: "Ayarlar", icon: "settings", description: "Guvenlik ve hesap ayarlari" },
  ];
  const items = user.role === "student" ? studentItems : coachItems;

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar__brand">
        <div className="sidebar__brand-top">
          <div className="sidebar__brand-mark">
            <AppIcon name="spark" />
          </div>
          <button className="sidebar__toggle" type="button" onClick={onToggle}>
            <span aria-hidden="true">{collapsed ? "→" : "←"}</span>
          </button>
        </div>
        <div className="sidebar__brand-copy">
          <strong>Kocluk Platformu</strong>
          <span>
            {user.role === "student"
              ? "Gunluk plan, mesaj ve gelisim takibi"
              : "Ogrenci takip ve egitim operasyonu"}
          </span>
        </div>
        <span className="sidebar__status">
          <AppIcon name={user.role === "student" ? "target" : "shield"} />
          {user.role === "student" ? "Ogrenci modu" : "Kurumsal operasyon"}
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
              <span className="sidebar__link-icon">
                <AppIcon name={item.icon} />
              </span>
              <span className="sidebar__link-copy">
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
