import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { ProfileForm } from "@web/components/settings/profile-form";
import { getApiBaseUrl, getSessionToken } from "@web/lib/auth";
import { getCurrentUser } from "@web/lib/api";

async function getProfile() { const token = await getSessionToken(); if (!token) return null; const response = await fetch(`${getApiBaseUrl()}/auth/profile`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" }); return response.ok ? response.json() : null; }
export default async function ProfileSettingsPage() {
  const [currentUser, profile] = await Promise.all([getCurrentUser(), getProfile()]); if (!currentUser || !profile) redirect("/login");
  return <AppShell user={currentUser} eyebrow="Hesap" title="Profilim" actions={[{ label: "Güvenlik ayarları", href: "/settings/security" }]}><SectionCard title="Kişisel bilgiler" subtitle="İletişim bilgilerinizi ve profil resminizi yönetin"><ProfileForm profile={profile} /></SectionCard></AppShell>;
}
