import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

// Club posters are fetched once and refreshed at most every 30s (so new uploads show up quickly).
let cache = { at: 0, promise: null };
const loadPosters = () => {
  if (!cache.promise || Date.now() - cache.at > 30000) {
    cache = {
      at: Date.now(),
      promise: ClubAPI.getAll()
        .then((res) => res.data.clubs)
        .catch(() => []),
    };
  }
  return cache.promise;
};

const metaFor = (path, user) => {
  if (path === '/') return { size: 'hb-lg', eyebrow: 'ClubConnect', title: 'Every club. One connected platform.', text: 'Manage clubs, run events, track attendance and celebrate every moment.', cta: true };
  if (path.startsWith('/clubs')) return { size: '', eyebrow: 'Directory', title: 'Clubs', text: 'Every active club running on ClubConnect.' };
  if (path.startsWith('/gallery')) return { size: '', eyebrow: 'Moments', title: 'Gallery', text: 'Photos from events and clubs across the platform.' };
  if (path.startsWith('/about')) return { size: '', eyebrow: 'Who we are', title: 'About us', text: 'The team and the idea behind ClubConnect.' };
  if (user && /^\/(admin|president|coordinator|member)/.test(path)) {
    return { size: 'hb-sm', eyebrow: `${user.role} dashboard`, title: `Welcome, ${user.name?.split(' ')[0] || ''}` };
  }
  return { size: 'hb-sm', eyebrow: 'ClubConnect', title: 'ClubConnect' };
};

const HeroBanner = () => {
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [active, setActive] = useState(0);

  useEffect(() => { loadPosters().then(setClubs); }, [pathname]);
  // President / coordinator dashboards show THEIR OWN club's banner; everywhere else shows all club posters
  const isLeader = user && ['president', 'coordinator'].includes(user.role) && /^\/(president|coordinator)/.test(pathname);
  const ownId = isLeader ? user.club?._id || user.club : null;
  const own = ownId ? clubs.find((c) => c._id === ownId) : null;
  const posters = own ? (own.coverImage ? [own] : []) : clubs.filter((c) => c.coverImage);

  useEffect(() => {
    if (posters.length < 2) return undefined;
    const t = setInterval(() => setActive((i) => (i + 1) % posters.length), 5000);
    return () => clearInterval(t);
  }, [posters.length]);

  const m = own
    ? { size: 'hb-sm', eyebrow: `${user.role} · ${own.category || 'Club'}`, title: own.name }
    : metaFor(pathname, user);
  const current = posters[active % (posters.length || 1)];

  return (
    <section className={`hero-banner ${m.size}`}>
      {posters.map((c, i) => (
        <div key={c._id} className={`hero-slide ${i === active ? 'on' : ''}`} style={{ backgroundImage: `url("${c.coverImage}")` }} />
      ))}

      <div className="hero-content">
        <span className="hero-eyebrow">{m.eyebrow}</span>
        <h1>{m.title}</h1>
        {m.text && <p>{m.text}</p>}
        {m.cta && !isAuthenticated && (
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary">Get started</Link>
            <Link to="/clubs" className="btn btn-outline">Browse clubs</Link>
          </div>
        )}
      </div>

      {current && (
        <div className="hero-side">
          <Link to={`/clubs/${current._id}`} className="hero-caption">{own ? 'Public club page' : current.name} →</Link>
          {posters.length > 1 && (
            <div className="hero-dots">
              {posters.map((c, i) => (
                <button key={c._id} className={i === active ? 'on' : ''} onClick={() => setActive(i)} aria-label={`Show ${c.name}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
