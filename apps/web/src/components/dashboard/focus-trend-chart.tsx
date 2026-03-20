type FocusTrendChartProps = {
  data: Array<{
    label: string;
    minutes: number;
  }>;
};

export function FocusTrendChart({ data }: FocusTrendChartProps) {
  if (!data.length) {
    return <div className="chart-placeholder" />;
  }

  const maxValue = Math.max(...data.map((item) => item.minutes), 1);
  const width = 420;
  const height = 220;
  const padding = 24;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  const points = data
    .map((item, index) => {
      const x = padding + index * stepX;
      const y =
        height - padding - ((height - padding * 2) * item.minutes) / maxValue;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `${padding},${height - padding} ${points} ${
    width - padding
  },${height - padding}`;

  return (
    <div className="chart-card">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Haftalik odak suresi trendi"
      >
        <defs>
          <linearGradient id="focusArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15, 118, 110, 0.35)" />
            <stop offset="100%" stopColor="rgba(15, 118, 110, 0.02)" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#focusArea)" />
        <polyline points={points} fill="none" stroke="#0f766e" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((item, index) => {
          const x = padding + index * stepX;
          const y =
            height - padding - ((height - padding * 2) * item.minutes) / maxValue;

          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="5" fill="#0f766e" />
              <text x={x} y={height - 4} textAnchor="middle" className="trend-chart__label">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="chart-summary-grid">
        {data.map((item) => (
          <div className="chart-pill" key={item.label}>
            <strong>{item.minutes} dk</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
