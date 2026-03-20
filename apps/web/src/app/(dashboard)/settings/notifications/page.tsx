import { redirect } from "next/navigation";
import { SectionCard } from "@web/components/dashboard/section-card";
import { AppShell } from "@web/components/layout/app-shell";
import { NotificationPreferencesForm } from "@web/components/notifications/notification-preferences-form";
import { getCurrentUser, getNotificationPreferences } from "@web/lib/api";

export default async function NotificationSettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const preferences = await getNotificationPreferences();

  return (
    <AppShell
      user={currentUser}
      eyebrow="Ayarlar"
      title="Bildirim tercihleri"
      actions={[
        { label: "Bildirimler", href: "/notifications" },
        { label: "Guvenlik", href: "/settings/security" },
      ]}
    >
      <SectionCard
        title="Kanal ayarlari"
        subtitle="Bildirim tiplerini uygulama ici veya e-posta bazinda yonetin"
      >
        <NotificationPreferencesForm preferences={preferences} />
      </SectionCard>
    </AppShell>
  );
}
