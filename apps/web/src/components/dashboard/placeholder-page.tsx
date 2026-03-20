import { AppShell } from "@web/components/layout/app-shell";
import type { SessionUser } from "@web/lib/api";
import { SectionCard } from "./section-card";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: string[];
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  actions,
}: PlaceholderPageProps) {
  const fallbackUser: SessionUser = {
    id: "0",
    email: "placeholder@local",
    fullName: "Placeholder",
    role: "coach",
  };

  return (
    <AppShell user={fallbackUser} eyebrow={eyebrow} title={title} actions={actions}>
      <SectionCard title="Ekran hazir" subtitle="Icerik iskeleti baglandi">
        <div className="list">
          <div className="list-item">
            <div className="list-item__meta">
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  );
}
