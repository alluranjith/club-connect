import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiCalendar, FiUserCheck } from 'react-icons/fi';
import { EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MemberEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);

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

  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Events</h1>
      <p className="section-subtitle">
        Both club members and non-club members can register and participate in any event below.
      </p>

      {events.length === 0 ? (
        <EmptyState title="No events yet" icon={<FiCalendar />} />
      ) : (
        <div className="grid grid-3 stagger">
          {events.map((ev) => (
            <div className="card" key={ev._id}>
              <span className="badge badge-success">{ev.status}</span>
              <h4 style={{ margin: '10px 0 4px' }}>{ev.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{ev.club?.name || 'Platform-wide'}</p>
              <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiCalendar /> {new Date(ev.date).toLocaleString()}
              </p>
              {ev.venue && <p style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin /> {ev.venue}</p>}
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{ev.description}</p>

              {isRegistered(ev) ? (
                <span className="badge badge-success" style={{ marginTop: 8 }}><FiUserCheck /> Registered</span>
              ) : (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => handleParticipate(ev._id)} disabled={joiningId === ev._id}>
                  {joiningId === ev._id ? 'Registering...' : 'Participate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberEvents;
