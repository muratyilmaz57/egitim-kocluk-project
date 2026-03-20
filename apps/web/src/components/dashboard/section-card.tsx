import Link from "next/link";
import { AppIcon, type AppIconName } from "@web/components/ui/app-icon";

type SectionCardAction =
  | string
  | {
      label: string;
      href: string;
      icon?: AppIconName;
    };

type SectionCardProps = {
  title: string;
  subtitle: string;
  action?: SectionCardAction;
  icon?: AppIconName;
  tone?: "teal" | "amber" | "violet" | "rose" | "sky";
  children: React.ReactNode;
};

export function SectionCard({
  title,
  subtitle,
  action,
  icon = "spark",
  tone = "teal",
  children,
}: SectionCardProps) {
  return (
    <section className={`section-card section-card--${tone}`}>
      <div className="section-card__header">
        <div className="section-card__title-group">
          <span className="section-card__icon">
            <AppIcon name={icon} />
          </span>
          <div>
            <div className="section-card__title">{title}</div>
            <div className="section-card__subtitle">{subtitle}</div>
          </div>
        </div>
        {action
          ? typeof action === "string"
            ? (
              <button className="secondary-button" type="button">
                {action}
              </button>
            )
            : (
              <Link className="secondary-button" href={action.href}>
                {action.icon ? <AppIcon className="button-icon" name={action.icon} /> : null}
                {action.label}
              </Link>
            )
          : null}
      </div>
      {children}
    </section>
  );
}
