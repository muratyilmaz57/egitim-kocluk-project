type StatCardProps = {
  label: string;
  value: string;
  meta: string;
};

export function StatCard({ label, value, meta }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__meta">{meta}</span>
    </article>
  );
}

