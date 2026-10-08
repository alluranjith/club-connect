const CLASS_BY_STATUS = {
  upcoming: 'badge-president',
  ongoing: 'badge-warning',
  completed: 'badge-muted',
  cancelled: 'badge-danger',
};

// Event status pill - status itself is updated automatically by the server as dates pass.
const StatusBadge = ({ status }) => (
  <span className={`badge ${CLASS_BY_STATUS[status] || 'badge-muted'}`}>{status}</span>
);

export const isActiveEvent = (ev) => ev.status === 'upcoming' || ev.status === 'ongoing';

export default StatusBadge;
