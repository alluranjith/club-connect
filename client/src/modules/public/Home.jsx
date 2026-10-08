import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiUsers, FiImage, FiBell } from 'react-icons/fi';
import { ClubAPI, EventAPI, PublicAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import EventDetailModal from '../../components/common/EventDetailModal';
import ClubBand from '../../components/common/ClubBand';

const FEATURES = [
  { icon: <FiUsers />, title: 'Club Membership', text: 'Discover clubs, request to join, and get accepted with full member benefits.' },
  { icon: <FiCalendar />, title: 'Events', text: 'Register for events, track your participation, and never miss an update.' },
  { icon: <FiBell />, title: 'Notifications', text: 'Real-time announcements from admins, presidents, and coordinators.' },
  { icon: <FiImage />, title: 'Gallery', text: 'Relive every event through a rich, ever-growing photo gallery.' },
];

const Home = () => {
  const [openId, setOpenId] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ClubAPI.getAll(), EventAPI.getAll({ status: 'upcoming' }), PublicAPI.stats()])
      .then(([clubRes, eventRes, statsRes]) => {
        setClubs(clubRes.data.clubs.slice(0, 3));
        setEvents(eventRes.data.events.slice(0, 3));
        setStats(statsRes.data.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {stats && (
        <section className="stat-strip animate-fadeIn">
          <div><strong>{stats.clubs}</strong><span>Active clubs</span></div>
          <div><strong>{stats.members}</strong><span>Total members</span></div>
          <div><strong>{stats.eventsConducted}</strong><span>Events held</span></div>
        </section>
      )}

      <section className="container section-pad">
        <h2 className="section-title">Why ClubConnect</h2>
        <p className="section-subtitle">Everything a campus community needs, built into one dashboard per role.</p>
        <div className="grid grid-4 stagger" style={{ marginTop: 24 }}>
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h4>{f.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {loading ? <Loader /> : (
        <>
          <section>
            <div className="container section-head" style={{ paddingBottom: 24 }}>
              <h2 className="section-title" style={{ margin: 0 }}>Featured clubs</h2>
              <Link to="/clubs" className="link-arrow">View all →</Link>
            </div>
            {clubs.map((c) => <ClubBand key={c._id} club={c} />)}
            {clubs.length === 0 && (
              <div className="container"><p style={{ color: 'var(--color-text-muted)' }}>No clubs yet — check back soon!</p></div>
            )}
          </section>

          <section className="container section-pad">
            <h2 className="section-title">Upcoming events</h2>
            <div className="grid grid-3 stagger" style={{ marginTop: 24 }}>
              {events.map((e) => (
                <div className="card clickable-card" key={e._id} onClick={() => setOpenId(e._id)}>
                  <span className="badge badge-president">{e.club?.name || 'Platform-wide'}</span>
                  <h4 style={{ marginTop: 10 }}>{e.title}</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                    {new Date(e.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {e.venue || 'TBA'}
                  </p>
                </div>
              ))}
              {events.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No upcoming events right now.</p>}
            </div>
          </section>
        </>
      )}
      {openId && <EventDetailModal eventId={openId} onClose={() => setOpenId(null)} />}
    </>
  );
};

export default Home;
