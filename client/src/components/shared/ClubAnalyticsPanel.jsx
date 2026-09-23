import { FiUsers, FiUserCheck, FiCalendar, FiCheckCircle, FiTrendingUp, FiAward } from 'react-icons/fi';
import BarTrend from '../common/charts/BarTrend';
import LineTrend from '../common/charts/LineTrend';
import EmptyState from '../common/EmptyState';

const STATUS_COLORS = {
  upcoming: 'var(--color-info)',
  ongoing: 'var(--color-warning)',
  completed: 'var(--color-success)',
  cancelled: 'var(--color-danger)',
};

const StatBlock = ({ icon, label, value, color }) => (
  <div className="card">
    <div className="flex-between">
      <div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{label}</p>
        <h2 style={{ margin: '6px 0 0' }}>{value}</h2>
      </div>
      <div className="stat-icon-badge" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </div>
    </div>
  </div>
);

const ClubAnalyticsPanel = ({ analytics }) => {
  if (!analytics) return null;
  const { summary, eventsByStatus, eventsByMonth, memberGrowth, topEventsByAttendance } = analytics;

  const hasEventTrend = eventsByMonth.some((m) => m.count > 0);
  const hasGrowth = memberGrowth.some((m) => m.count > 0);

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-4 stagger" style={{ marginBottom: 24 }}>
        <StatBlock icon={<FiUsers />} label="Members" value={summary.members} color="var(--color-member)" />
        <StatBlock icon={<FiUserCheck />} label="Coordinators" value={summary.coordinators} color="var(--color-coordinator)" />
        <StatBlock icon={<FiCalendar />} label="Total Events" value={summary.totalEvents} color="var(--color-president)" />
        <StatBlock icon={<FiCheckCircle />} label="Avg. Attendance Rate" value={`${summary.attendanceRate}%`} color="var(--color-success)" />
      </div>

      <div className="grid grid-2 stagger" style={{ marginBottom: 24, alignItems: 'stretch' }}>
        <div className="analytics-card">
          <h3 className="analytics-card-title"><FiTrendingUp /> Events per month</h3>
          {hasEventTrend ? <BarTrend data={eventsByMonth} color="var(--color-president)" /> : (
            <EmptyState title="No events yet" subtitle="Create events to see this trend fill in." />
          )}
        </div>
        <div className="analytics-card">
          <h3 className="analytics-card-title"><FiUsers /> Member growth (cumulative)</h3>
          {hasGrowth ? <LineTrend data={memberGrowth} color="var(--color-secondary)" /> : (
            <EmptyState title="No accepted members yet" subtitle="Accepted join requests will build this trend." />
          )}
        </div>
      </div>

      <div className="grid grid-2 stagger" style={{ alignItems: 'start' }}>
        <div className="analytics-card">
          <h3 className="analytics-card-title">Events by status</h3>
          <div className="status-chip-row">
            {Object.entries(eventsByStatus).map(([status, count]) => (
              <span key={status} className="status-chip">
                <span className="dot" style={{ background: STATUS_COLORS[status] }} />
                {status[0].toUpperCase() + status.slice(1)}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3 className="analytics-card-title"><FiAward /> Top events by attendance</h3>
          {topEventsByAttendance.length === 0 ? (
            <EmptyState title="No attendance marked yet" subtitle="Once coordinators mark attendance, top events appear here." />
          ) : (
            topEventsByAttendance.map((e, i) => (
              <div key={i} className="rank-row">
                <span className="rank-badge">{i + 1}</span>
                <div className="rank-row-body">
                  <div className="rank-row-top">
                    <strong>{e.title}</strong>
                    <span style={{ color: 'var(--color-text-muted)' }}>{e.present}/{e.total} ({e.rate}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${e.rate}%` }} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubAnalyticsPanel;
