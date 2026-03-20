import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";

type StatCardProps = {
  label: string;
  value: string;
  meta: string;
  icon?: AppIconName;
  tone?: "teal" | "amber" | "violet" | "rose" | "sky";
};

export function StatCard({
  label,
  value,
  meta,
  icon = "spark",
  tone = "teal",
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span className="stat-card__icon">
          <AppIcon name={icon} />
        </span>
        <span className="stat-card__tag">Canli</span>
      </div>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__meta">{meta}</span>
    </article>
  );
}
