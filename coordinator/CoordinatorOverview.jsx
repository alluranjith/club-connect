import { useEffect, useState } from 'react';
import { FiUsers, FiCalendar, FiClock } from 'react-icons/fi';
import { ClubAPI, EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const CoordinatorOverview = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    Promise.all([ClubAPI.getOne(clubId), EventAPI.getAll({ club: clubId })])
      .then(([c, e]) => { setClub(c.data.club); setEvents(e.data.events); })
      .finally(() => setLoading(false));
  }, [clubId]);

  if (loading) return <Loader />;
  if (!club) return <EmptyState title="No club assigned yet" subtitle="Ask the admin to assign you as a coordinator." />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">{club.name}</h1>
      <p className="section-subtitle">Welcome back, {user.name}. Here's your club at a glance.</p>

      <div className="grid grid-3 stagger">
        <div className="card"><div className="flex-between"><div><p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Members</p><h2 style={{ margin: 0 }}>{club.members?.length || 0}</h2></div><FiUsers size={26} color="var(--color-coordinator)" /></div></div>
        <div className="card"><div className="flex-between"><div><p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Events</p><h2 style={{ margin: 0 }}>{events.length}</h2></div><FiCalendar size={26} color="var(--color-president)" /></div></div>
        <div className="card"><div className="flex-between"><div><p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Upcoming</p><h2 style={{ margin: 0 }}>{events.filter((e) => e.status === 'upcoming').length}</h2></div><FiClock size={26} color="var(--color-admin)" /></div></div>
      </div>
    </div>
  );
};

export default CoordinatorOverview;
