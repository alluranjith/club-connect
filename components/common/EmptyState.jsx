const EmptyState = ({ icon, title = 'Nothing here yet', subtitle }) => (
  <div className="empty-state animate-fadeIn">
    {icon && <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>}
    <h3>{title}</h3>
    {subtitle && <p>{subtitle}</p>}
  </div>
);

export default EmptyState;
