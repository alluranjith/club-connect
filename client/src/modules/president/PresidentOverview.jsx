import { useEffect, useState } from 'react';
import { FiUsers, FiUserCheck, FiCalendar } from 'react-icons/fi';
import { ClubAPI, EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import DashboardHero from '../../components/common/DashboardHero';

const StatCard = ({ icon, label, value, color }) => (
  <div className="card">
    <div className="flex-between">
      <div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{label}</p>
        <h2 style={{ margin: 0 }}>{value}</h2>
      </div>
      <div className="stat-icon-badge" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
        {icon}
      </div>
    </div>
  </div>
);

const PresidentOverview = () => {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.club) { setLoading(false); return; }
    const clubId = user.club._id || user.club;
    Promise.all([ClubAPI.getOne(clubId), EventAPI.getAll({ club: clubId })])
      .then(([c, e]) => { setClub(c.data.club); setEvents(e.data.events); })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Loader />;
  if (!club) return <EmptyState title="No club assigned yet" subtitle="Ask the admin to assign you as president of a club." />;

  return (
    <div className="animate-fadeIn">
      <DashboardHero
        title={club.name}
        subtitle={`Welcome back, ${user.name}. Here's how your club is doing.`}
        chips={[`${club.members?.length || 0} members`, `${events.length} events`]}
      />

      <div className="grid grid-3 stagger">
        <StatCard icon={<FiUsers />} label="Members" value={club.members?.length || 0} color="var(--color-president)" />
        <StatCard icon={<FiUserCheck />} label="Coordinators" value={club.coordinators?.length || 0} color="var(--color-coordinator)" />
        <StatCard icon={<FiCalendar />} label="Events" value={events.length} color="var(--color-admin)" />
      </div>
    </div>
  );
};

export default PresidentOverview;
