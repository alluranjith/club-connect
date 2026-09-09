import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiUsers, FiImage, FiBell, FiAward } from 'react-icons/fi';
import { ClubAPI, EventAPI, PublicAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';

const FEATURES = [
  { icon: <FiUsers />, title: 'Club Membership', text: 'Discover clubs, request to join, and get accepted with full member benefits.' },
  { icon: <FiCalendar />, title: 'Events', text: 'Register for events, track your participation, and never miss an update.' },
  { icon: <FiBell />, title: 'Notifications', text: 'Real-time announcements from admins, presidents, and coordinators.' },
  { icon: <FiImage />, title: 'Gallery', text: 'Relive every event through a rich, ever-growing photo gallery.' },
];

const Home = () => {
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
    <div className="page container">
      <section className="hero animate-slideUp">
        <h1>Every club. One connected platform.</h1>
        <p style={{ maxWidth: 560, margin: '14px auto 30px', opacity: 0.92 }}>
          ClubConnect brings admins, presidents, coordinators and members together —
          manage clubs, run events, track attendance, and celebrate every moment in the gallery.
        </p>
        <div className="flex-center gap-md">
          <Link to="/register" className="btn btn-primary">Get Started <FiArrowRight /></Link>
          <Link to="/clubs" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.12)', borderColor: '#fff', color: '#fff' }}>
            Browse Clubs
          </Link>
        </div>

        {stats && (
          <div className="hero-stats animate-popIn">
            <div className="hero-stat">
              <FiUsers />
              <div>
                <strong>{stats.clubs}</strong>
                <span>Active Clubs</span>
              </div>
            </div>
            <div className="hero-stat">
              <FiAward />
              <div>
                <strong>{stats.members}</strong>
                <span>Total Members</span>
              </div>
            </div>
            <div className="hero-stat">
              <FiCalendar />
              <div>
                <strong>{stats.eventsConducted}</strong>
                <span>Events Held</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 60 }}>
        <h2 className="section-title">Why ClubConnect</h2>
        <p className="section-subtitle">Everything a campus community needs, built into one dashboard per role.</p>
        <div className="grid grid-4 stagger">
          {FEATURES.map((f) => (
            <div className="card" key={f.title}>
              <div style={{ fontSize: 28, color: 'var(--color-primary)', marginBottom: 10 }}>{f.icon}</div>
              <h4>{f.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {loading ? <Loader /> : (
        <>
          <section style={{ marginTop: 60 }}>
            <div className="flex-between">
              <h2 className="section-title">Featured Clubs</h2>
              <Link to="/clubs" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>View all →</Link>
            </div>
            <div className="grid grid-3 stagger">
              {clubs.map((c) => (
                <div className="card" key={c._id}>
                  {c.coverImage && <img src={c.coverImage} alt={c.name} style={{ borderRadius: 10, marginBottom: 12, height: 140, objectFit: 'cover' }} />}
                  <h4>{c.name}</h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{c.description || 'No description yet.'}</p>
                </div>
              ))}
              {clubs.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No clubs yet — check back soon!</p>}
            </div>
          </section>

          <section style={{ marginTop: 60 }}>
            <div className="flex-between">
              <h2 className="section-title">Upcoming Events</h2>
            </div>
            <div className="grid grid-3 stagger">
              {events.map((e) => (
                <div className="card" key={e._id}>
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
    </div>
  );
};

export default Home;
