import Link from "next/link";

type SectionCardAction =
  | string
  | {
      label: string;
      href: string;
    };

type SectionCardProps = {
  title: string;
  subtitle: string;
  action?: SectionCardAction;
  children: React.ReactNode;
};

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <section className="section-card">
      <div className="section-card__header">
        <div>
          <div className="section-card__title">{title}</div>
          <div className="section-card__subtitle">{subtitle}</div>
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
                {action.label}
              </Link>
            )
          : null}
      </div>
      {children}
    </section>
  );
}
