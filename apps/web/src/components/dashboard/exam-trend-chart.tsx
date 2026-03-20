import { AppIcon } from "@web/components/ui/app-icon";

type ExamTrendChartProps = {
  data: Array<{
    id: string;
    label: string;
    examName: string;
    studentName: string;
    totalNet: number;
  }>;
};

export function ExamTrendChart({ data }: ExamTrendChartProps) {
  if (!data.length) {
    return <div className="chart-placeholder" />;
  }

  const maxValue = Math.max(...data.map((item) => item.totalNet), 1);

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <span className="chart-card__badge chart-card__badge--sky">
          <AppIcon name="chart" />
          Net performansi
        </span>
      </div>
      <div className="bar-chart">
      {data.map((item, index) => (
        <div className="bar-chart__item" key={item.id}>
          <div className="bar-chart__value">{item.totalNet}</div>
          <div className="bar-chart__track">
            <span
              className={`bar-chart__fill bar-chart__fill--${index % 4}`}
              style={{ height: `${Math.max((item.totalNet / maxValue) * 100, 8)}%` }}
            />
          </div>
          <div className="bar-chart__label">{item.label}</div>
          <div className="bar-chart__meta">{item.studentName}</div>
        </div>
      ))}
      </div>
    </div>
  );
}
