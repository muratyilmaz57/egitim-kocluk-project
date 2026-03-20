type StatusBreakdownProps = {
  data: Array<{
    label: string;
    tone: string;
    count: number;
  }>;
};

function toneToClass(tone: string) {
  switch (tone) {
    case "success":
      return "badge badge--success";
    case "warning":
      return "badge badge--warning";
    default:
      return "badge badge--danger";
  }
}

export function StatusBreakdown({ data }: StatusBreakdownProps) {
  if (!data.length) {
    return <div className="chart-placeholder" />;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="breakdown-list">
      {data.map((item) => (
        <div className="breakdown-item" key={item.label}>
          <div className="breakdown-item__meta">
            <strong>{item.label}</strong>
            <span>{Math.round((item.count / total) * 100)}%</span>
          </div>
          <div className="breakdown-item__bar">
            <span style={{ width: `${(item.count / total) * 100}%` }} />
          </div>
          <span className={toneToClass(item.tone)}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}
