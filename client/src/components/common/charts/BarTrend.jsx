// Small dependency-free SVG bar chart used across analytics dashboards.
// Keeps the bundle light (no chart library) while still looking polished.
const BarTrend = ({ data, color = 'var(--color-primary)', height = 160, valueKey = 'count' }) => {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const barWidth = 100 / data.length;

  return (
    <div className="chart-trend">
      <svg viewBox={`0 0 ${data.length * 40} ${height}`} preserveAspectRatio="none" className="chart-trend-svg">
        {data.map((d, i) => {
          const barH = Math.max(2, (d[valueKey] / max) * (height - 28));
          return (
            <g key={i}>
              <rect
                x={i * 40 + 8}
                y={height - 20 - barH}
                width={24}
                height={barH}
                rx={5}
                fill={color}
                className="chart-bar"
              >
                <title>{`${d.label}: ${d[valueKey]}`}</title>
              </rect>
              <text x={i * 40 + 20} y={height - 4} textAnchor="middle" className="chart-axis-label">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarTrend;
