import { AppIcon } from "@web/components/ui/app-icon";

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
      <div className="chart-card__header">
        <span className="chart-card__badge">
          <AppIcon name="focus" />
          Odak ritmi
        </span>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Haftalik odak suresi trendi"
      >
        <defs>
          <linearGradient id="focusArea" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3158d6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3158d6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="focusStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="60%" stopColor="#3158d6" />
            <stop offset="100%" stopColor="#b87938" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((row) => {
          const y = padding + ((height - padding * 2) / 4) * row;
          return (
            <line
              key={row}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(96, 112, 124, 0.16)"
              strokeDasharray="4 7"
            />
          );
        })}
        <polygon points={areaPoints} fill="url(#focusArea)" />
        <polyline
          points={points}
          fill="none"
          stroke="url(#focusStroke)"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((item, index) => {
          const x = padding + index * stepX;
          const y =
            height - padding - ((height - padding * 2) * item.minutes) / maxValue;

          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="6" fill="#1e3a8a" stroke="white" strokeWidth="3" />
              <text x={x} y={y - 12} textAnchor="middle" className="trend-chart__value">
                {item.minutes}
              </text>
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
