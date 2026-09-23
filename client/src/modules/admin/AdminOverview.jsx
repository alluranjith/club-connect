import { useEffect, useState } from 'react';
import { FiUsers, FiUserCheck, FiCalendar, FiImage, FiShield } from 'react-icons/fi';
import { AdminAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import DashboardHero from '../../components/common/DashboardHero';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card animate-popIn">
    <div className="flex-between">
      <div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>{label}</p>
        <h2 style={{ margin: '6px 0 0' }}>{value}</h2>
      </div>
      <div className="stat-icon-badge" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </div>
    </div>
  </div>
);

const AdminOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    AdminAPI.stats().then((res) => setStats(res.data.stats));
  }, []);

  if (!stats) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <DashboardHero
        title="Admin Overview"
        subtitle="Platform-wide snapshot of clubs, people and activity."
        chips={[`${stats.activeClubs} active clubs`, `${stats.totalUsers} total users`, `${stats.upcomingEvents} upcoming events`]}
      />

      <div className="grid grid-4 stagger" style={{ marginBottom: 30 }}>
        <StatCard icon={<FiShield />} label="Active Clubs" value={stats.activeClubs} color="var(--color-admin)" />
        <StatCard icon={<FiUsers />} label="Total Members" value={stats.totalMembers} color="var(--color-member)" />
        <StatCard icon={<FiUserCheck />} label="Coordinators" value={stats.totalCoordinators} color="var(--color-coordinator)" />
        <StatCard icon={<FiCalendar />} label="Upcoming Events" value={stats.upcomingEvents} color="var(--color-president)" />
      </div>

      <div className="grid grid-3 stagger">
        <StatCard icon={<FiShield />} label="Disbanded Clubs" value={stats.disbandedClubs} color="var(--color-danger)" />
        <StatCard icon={<FiUsers />} label="Presidents" value={stats.totalPresidents} color="var(--color-president)" />
        <StatCard icon={<FiImage />} label="Gallery Images" value={stats.galleryCount} color="var(--color-secondary)" />
      </div>
    </div>
  );
};

export default AdminOverview;
