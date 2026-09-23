// Gradient welcome banner used at the top of role dashboards for a stronger first impression.
// `chips` is an optional array of short strings/nodes shown as small pills under the text.
const DashboardHero = ({ title, subtitle, chips = [] }) => (
  <div className="dashboard-hero animate-fadeIn">
    <h1>{title}</h1>
    <p>{subtitle}</p>
    {chips.length > 0 && (
      <div className="dashboard-hero-meta">
        {chips.map((chip, i) => <span key={i} className="dashboard-hero-chip">{chip}</span>)}
      </div>
    )}
  </div>
);

export default DashboardHero;
