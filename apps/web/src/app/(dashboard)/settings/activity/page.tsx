import { redirect } from "next/navigation";
import { AppShell } from "@web/components/layout/app-shell";
import { SectionCard } from "@web/components/dashboard/section-card";
import { formatDateTime, getAuditLogs, getCurrentUser } from "@web/lib/api";

export default async function SecurityActivityPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const auditLogs = await getAuditLogs(50);

  return (
    <AppShell
      user={currentUser}
      eyebrow="Guvenlik"
      title="Hesap hareket gecmisi"
      actions={[{ label: "Guvenlik ayarlari", href: "/settings/security" }]}
    >
      <SectionCard
        title="Audit log"
        subtitle="Kritik hesap ve veri islemlerinin son 50 kaydi"
      >
        <div className="audit-list">
          {auditLogs.length > 0 ? auditLogs.map((log) => (
            <article className="audit-item audit-item--full" key={log.id}>
              <div className="audit-item__header">
                <strong>{log.description}</strong>
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
              <div className="audit-item__meta">
                <span>Aksiyon: {log.action}</span>
                <span>Varlik: {log.entityType}</span>
                {log.entityId ? <span>Kayit no: {log.entityId}</span> : null}
                {log.studentName ? <span>Ogrenci: {log.studentName}</span> : null}
                {log.actorName ? <span>Islemi yapan: {log.actorName}</span> : null}
                {log.subjectName ? <span>Etkilenen: {log.subjectName}</span> : null}
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
