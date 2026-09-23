// Small dependency-free SVG line/area chart (e.g. cumulative member growth).
const LineTrend = ({ data, color = 'var(--color-secondary)', height = 160, valueKey = 'cumulative' }) => {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const stepX = 100 / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = 100 - (d[valueKey] / max) * 90 - 5;
    return `${x},${y}`;
  });

  const areaPoints = `0,100 ${points.join(' ')} 100,100`;

  return (
    <div className="chart-trend">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="chart-trend-svg" style={{ height }}>
        <polygon points={areaPoints} fill={color} opacity="0.12" />
        <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const x = i * stepX;
          const y = 100 - (d[valueKey] / max) * 90 - 5;
          return <circle key={i} cx={x} cy={y} r="1.6" fill={color}><title>{`${d.label}: ${d[valueKey]}`}</title></circle>;
        })}
      </svg>
      <div className="chart-axis-row">
        {data.map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  );
};

export default LineTrend;
