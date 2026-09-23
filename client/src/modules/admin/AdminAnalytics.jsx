import { useEffect, useState } from 'react';
import { FiUsers, FiCalendar, FiCheckCircle, FiShield, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { AnalyticsAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import DashboardHero from '../../components/common/DashboardHero';
import BarTrend from '../../components/common/charts/BarTrend';
import LineTrend from '../../components/common/charts/LineTrend';
import ClubAnalyticsPanel from '../../components/shared/ClubAnalyticsPanel';

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

const AdminAnalytics = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [clubAnalytics, setClubAnalytics] = useState(null);
  const [clubLoading, setClubLoading] = useState(false);

  useEffect(() => {
    AnalyticsAPI.overview()
      .then((res) => setOverview(res.data.analytics))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClubId) { setClubAnalytics(null); return; }
    setClubLoading(true);
    AnalyticsAPI.club(selectedClubId)
      .then((res) => setClubAnalytics(res.data.analytics))
      .finally(() => setClubLoading(false));
  }, [selectedClubId]);

  if (loading) return <Loader />;
  if (!overview || overview.totals.totalClubs === 0) {
    return <EmptyState title="No club data yet" subtitle="Analytics will populate once clubs, events and members exist." />;
  }

  const { totals, clubComparison, platformEventTrend, platformMemberGrowth } = overview;
  const maxMembers = Math.max(1, ...clubComparison.map((c) => c.members));

  return (
    <div className="animate-fadeIn">
      <DashboardHero
        title="Platform Analytics"
        subtitle="Performance across every active club on ClubConnect."
        chips={[`${totals.totalClubs} clubs`, `${totals.totalMembers} members`, `${totals.avgAttendanceRate}% avg. attendance`]}
      />

      <div className="grid grid-4 stagger" style={{ marginBottom: 24 }}>
        <StatBlock icon={<FiShield />} label="Active Clubs" value={totals.totalClubs} color="var(--color-admin)" />
        <StatBlock icon={<FiUsers />} label="Total Members" value={totals.totalMembers} color="var(--color-member)" />
        <StatBlock icon={<FiCalendar />} label="Total Events" value={totals.totalEvents} color="var(--color-president)" />
        <StatBlock icon={<FiCheckCircle />} label="Avg. Attendance Rate" value={`${totals.avgAttendanceRate}%`} color="var(--color-success)" />
      </div>

      <div className="grid grid-2 stagger" style={{ marginBottom: 24, alignItems: 'stretch' }}>
        <div className="analytics-card">
          <h3 className="analytics-card-title"><FiTrendingUp /> Events per month (all clubs)</h3>
          <BarTrend data={platformEventTrend} color="var(--color-admin)" />
        </div>
        <div className="analytics-card">
          <h3 className="analytics-card-title"><FiUsers /> Member growth (all clubs, cumulative)</h3>
          <LineTrend data={platformMemberGrowth} color="var(--color-secondary)" />
        </div>
      </div>

      <div className="analytics-card" style={{ marginBottom: 24 }}>
        <h3 className="analytics-card-title"><FiBarChart2 /> Club comparison</h3>
        {clubComparison.map((c, i) => (
          <div key={c.clubId} className="rank-row">
            <span className="rank-badge">{i + 1}</span>
            <div className="rank-row-body">
              <div className="rank-row-top">
                <strong>{c.clubName}</strong>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {c.members} members · {c.totalEvents} events · {c.attendanceRate}% attendance
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(c.members / maxMembers) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-card">
        <div className="club-select-bar">
          <h3 className="analytics-card-title" style={{ margin: 0 }}>Drill into a specific club</h3>
          <select className="input" style={{ maxWidth: 260 }} value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
            <option value="">Select a club...</option>
            {clubComparison.map((c) => (
              <option key={c.clubId} value={c.clubId}>{c.clubName}</option>
            ))}
          </select>
        </div>
        {clubLoading && <Loader />}
        {!clubLoading && clubAnalytics && <ClubAnalyticsPanel analytics={clubAnalytics} />}
      </div>
    </div>
  );
};

export default AdminAnalytics;
