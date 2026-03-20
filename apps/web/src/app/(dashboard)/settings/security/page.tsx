import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { MfaSettingsPanel } from "@web/components/settings/mfa-settings-panel";
import { PasswordChangeForm } from "@web/components/settings/password-change-form";
import {
  formatDate,
  formatDateTime,
  getAuditLogs,
  getCurrentUser,
  getSecurityStatus,
} from "@web/lib/api";

export default async function SecuritySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ force?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const { force = "" } = await searchParams;
  const security = await getSecurityStatus();
  const auditLogs = await getAuditLogs(8);
  const forced = force === "1" || currentUser.passwordExpired;

  return (
    <AppShell
      user={currentUser}
      eyebrow="Guvenlik"
      title="Hesap guvenligi"
      actions={[
        { label: "Bildirimler", href: "/notifications" },
        { label: "Bildirim tercihleri", href: "/settings/notifications" },
        { label: "Hareket gecmisi", href: "/settings/activity" },
      ]}
    >
      <SectionCard title="Sifre politikasi" subtitle="6 ayda bir yenileme ve guclu parola zorunlulugu">
        <div className="settings-stack">
          <div className="settings-row">
            <strong>Son sifre degisimi</strong>
            <span>{security ? formatDate(security.passwordChangedAt) : "-"}</span>
          </div>
          <div className="settings-row">
            <strong>Sonraki zorunlu yenileme</strong>
            <span>{security ? formatDate(security.passwordExpiresAt) : "-"}</span>
          </div>
          <PasswordChangeForm forced={Boolean(forced)} />
        </div>
      </SectionCard>

      <SectionCard title="MFA" subtitle="Authenticator veya e-posta kodu ile opsiyonel ikinci adim">
        <MfaSettingsPanel security={security} />
      </SectionCard>

      <SectionCard
        title="Hesap hareket gecmisi"
        subtitle="Giris, sifre ve kritik veri degisikliklerini izleyin"
        action={{ label: "Tumu", href: "/settings/activity" }}
      >
        <div className="audit-list">
          {auditLogs.length > 0 ? auditLogs.map((log) => (
            <article className="audit-item" key={log.id}>
              <div className="audit-item__header">
                <strong>{log.description}</strong>
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
              <div className="audit-item__meta">
                <span>{log.action}</span>
                <span>{log.studentName ? `Ogrenci: ${log.studentName}` : "Genel sistem"}</span>
                {log.subjectName ? <span>Hedef: {log.subjectName}</span> : null}
              </div>
            </article>
          )) : (
            <div className="audit-empty">Heniz kayitli hareket bulunmuyor.</div>
          )}
        </div>
      </SectionCard>
    </AppShell>
  );
}
