import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiCalendar, FiUserCheck } from 'react-icons/fi';
import { EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import EventDetailModal from '../../components/common/EventDetailModal';
import StatusBadge, { isActiveEvent } from '../../components/common/StatusBadge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MemberEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [openId, setOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    EventAPI.getAll().then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const isRegistered = (event) => event.participants?.includes(user._id);

  const handleParticipate = async (id) => {
    setJoiningId(id);
    try {
      await EventAPI.participate(id);
      toast.success('You are registered for this event!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setJoiningId(null);
    }
  };

  // Events whose date has passed are completed automatically by the server and hidden here by default
  const pastCount = events.filter((e) => !isActiveEvent(e)).length;
  const visibleEvents = showPast
    ? events
    : events.filter(isActiveEvent).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Events</h1>
      <p className="section-subtitle">
        Both club members and non-club members can register and participate in any event below.
      </p>

      {pastCount > 0 && (
        <button className="btn btn-outline btn-sm" style={{ marginBottom: 16 }} onClick={() => setShowPast(!showPast)}>
          {showPast ? 'Hide past events' : `Show past events (${pastCount})`}
        </button>
      )}
      {visibleEvents.length === 0 ? (
        <EmptyState title="No events yet" icon={<FiCalendar />} />
      ) : (
        <div className="grid grid-3 stagger">
          {visibleEvents.map((ev) => (
            <div className="card clickable-card" key={ev._id} onClick={() => setOpenId(ev._id)} style={!isActiveEvent(ev) ? { opacity: 0.65 } : undefined}>
              <StatusBadge status={ev.status} />
              <h4 style={{ margin: '10px 0 4px' }}>{ev.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{ev.club?.name || 'Platform-wide'}</p>
              <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCalendar /> {new Date(ev.date).toLocaleString()}
              </p>
              {ev.venue && <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin /> {ev.venue}</p>}
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{ev.description}</p>

              {isRegistered(ev) ? (
                <span className="badge badge-success" style={{ marginTop: 8 }}><FiUserCheck /> Registered</span>
              ) : !isActiveEvent(ev) ? (
                <span className="badge badge-muted" style={{ marginTop: 8 }}>Registration closed</span>
              ) : (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={(e) => { e.stopPropagation(); handleParticipate(ev._id); }} disabled={joiningId === ev._id}>
                  {joiningId === ev._id ? 'Registering...' : 'Participate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {openId && <EventDetailModal eventId={openId} onClose={() => setOpenId(null)} onChange={load} />}
    </div>
  );
};

export default MemberEvents;
