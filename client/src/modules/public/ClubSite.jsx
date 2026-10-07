import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, NavLink } from 'react-router-dom';
import { FiUserPlus, FiUsers, FiCheckCircle, FiClock, FiMapPin, FiCalendar, FiSearch } from 'react-icons/fi';
import { ClubAPI, EventAPI, GalleryAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import JoinRequestModal from '../../components/common/JoinRequestModal';
import EmptyState from '../../components/common/EmptyState';
import SocialLinks from '../../components/common/SocialLinks';
import EventDetailModal from '../../components/common/EventDetailModal';
import StatusBadge from '../../components/common/StatusBadge';
import TeamCard, { buildRoster } from '../../components/common/TeamCard';

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' });

const EventCard = ({ ev, onOpen }) => (
  <div className="card event-card clickable-card" role="button" tabIndex={0} onClick={() => onOpen(ev._id)} onKeyDown={(e) => e.key === 'Enter' && onOpen(ev._id)} style={ev.status === 'completed' || ev.status === 'cancelled' ? { opacity: 0.85 } : undefined}>
    <div className="flex-between"><StatusBadge status={ev.status} /><span className="muted-sm">{ev.participants?.length || 0} registered</span></div>
    <h4 style={{ margin: '10px 0 6px' }}>{ev.title}</h4>
    <p className="muted-sm"><FiCalendar /> {fmtDate(ev.date)} {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    <p className="muted-sm"><FiMapPin /> {ev.venue || 'Venue to be announced'}</p>
    {ev.description && <p className="overview-clamp" style={{ WebkitLineClamp: 3 }}>{ev.description}</p>}
  </div>
);

// Each club behaves like its own small website: header + Home / Events / Gallery / Team tabs.
const ClubSite = () => {
  const { id, tab = 'home' } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [myStatus, setMyStatus] = useState(null); // 'member' | 'pending' | null
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [role, setRole] = useState('All');
  const [q, setQ] = useState('');

  const load = () => {
    const reqs = [ClubAPI.getOne(id), EventAPI.getAll({ club: id }), GalleryAPI.getAll({ club: id })];
    if (isAuthenticated && user.role === 'member') reqs.push(ClubAPI.myStatus());
    return Promise.all(reqs).then(([c, e, g, st]) => {
      setClub(c.data.club);
      setEvents(e.data.events);
      setPhotos(g.data.images);
      if (st) {
        const isMember = st.data.myClubs.some((x) => String(x._id) === id);
        setMyStatus(isMember ? 'member' : st.data.pendingClubIds.includes(id) ? 'pending' : null);
      }
    });
  };
  useEffect(() => { setLoading(true); load().finally(() => setLoading(false)); /* eslint-disable-next-line */ }, [id]);

  const upcoming = useMemo(() => events.filter((e) => e.status === 'upcoming' || e.status === 'ongoing').sort((a, b) => new Date(a.date) - new Date(b.date)), [events]);
  const past = useMemo(() => events.filter((e) => e.status === 'completed' || e.status === 'cancelled').sort((a, b) => new Date(b.date) - new Date(a.date)), [events]);
  const roster = useMemo(() => (club ? buildRoster(club) : []), [club]);
  const roles = useMemo(() => {
    const c = {};
    roster.forEach((p) => { c[p.role] = (c[p.role] || 0) + 1; });
    return Object.entries(c);
  }, [roster]);
  const shownTeam = roster.filter((p) => (role === 'All' || p.role === role) && (!q || `${p.name} ${p.role}`.toLowerCase().includes(q.toLowerCase())));

  if (loading) return <Loader fullscreen />;
  if (!club) return <div className="page container"><p>Club not found.</p></div>;

  const isStudent = isAuthenticated && user.role === 'member';
  const tabs = [
    { key: 'home', label: 'Home' },
    { key: 'events', label: `Events (${events.length})` },
    { key: 'gallery', label: `Gallery (${photos.length})` },
    { key: 'team', label: `Team (${roster.length})` },
  ];

  const joinButton = isStudent && myStatus === null && (
    user.profileComplete
      ? <button className="btn btn-primary" onClick={() => setJoinOpen(true)}><FiUserPlus /> Request to join</button>
      : <Link to="/complete-profile" className="btn btn-primary">Complete profile to join</Link>
  );

  return (
    <div className="animate-fadeIn">
      <div className={`club-band cover-full ${club.coverImage ? '' : 'club-band-empty'}`} style={club.coverImage ? { backgroundImage: `url("${club.coverImage}")` } : undefined}>
        <div>
          <span className="badge">{club.category}</span>
          <h1>{club.name}</h1>
          <p><FiUsers /> {club.memberCount || 0} members</p>
          <SocialLinks links={club.socialLinks} />
        </div>
        <div>
          {joinButton}
          {myStatus === 'member' && <span className="badge badge-success"><FiCheckCircle /> You're a member</span>}
          {myStatus === 'pending' && <span className="badge badge-warning"><FiClock /> Join request pending</span>}
        </div>
      </div>

      <nav className="club-tabs">
        {tabs.map((t) => (
          <NavLink key={t.key} to={t.key === 'home' ? `/clubs/${id}` : `/clubs/${id}/${t.key}`} end className={() => (tab === t.key ? 'on' : '')}>{t.label}</NavLink>
        ))}
      </nav>

      <div className="container section-pad">
        {tab === 'home' && (
          <>
            <div className="stat-strip" style={{ border: '1px solid var(--color-border)', marginBottom: 40 }}>
              <div><strong>{club.memberCount || 0}</strong><span>Members</span></div>
              <div><strong>{upcoming.length}</strong><span>Upcoming events</span></div>
              <div><strong>{past.filter((e) => e.status === 'completed').length}</strong><span>Past events</span></div>
              <div><strong>{photos.length}</strong><span>Photos</span></div>
            </div>

            <h2 className="section-title">About</h2>
            <p style={{ maxWidth: 760, lineHeight: 1.7 }}>{club.description || 'This club has not added a description yet.'}</p>

            <div className="section-head" style={{ marginTop: 48 }}><h2 className="section-title" style={{ margin: 0 }}>Upcoming events</h2><Link to={`/clubs/${id}/events`} className="link-arrow">All events →</Link></div>
            {upcoming.length === 0 ? <p className="muted-sm">Nothing scheduled right now - check the past events for what this club has done.</p>
              : <div className="grid grid-3" style={{ marginTop: 16 }}>{upcoming.slice(0, 3).map((e) => <EventCard key={e._id} ev={e} onOpen={setEventId} />)}</div>}

            {photos.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 48 }}><h2 className="section-title" style={{ margin: 0 }}>Gallery</h2><Link to={`/clubs/${id}/gallery`} className="link-arrow">All photos →</Link></div>
                <div className="gallery-grid" style={{ marginTop: 16 }}>
                  {photos.slice(0, 6).map((p) => <div className="gallery-item" key={p._id} onClick={() => setPhoto(p)}><img src={p.imageUrl} alt={p.caption || 'Club photo'} /></div>)}
                </div>
              </>
            )}

            {roster.length > 0 && (
              <>
                <div className="section-head" style={{ marginTop: 48 }}><h2 className="section-title" style={{ margin: 0 }}>Team &amp; roles</h2><Link to={`/clubs/${id}/team`} className="link-arrow">Meet all {roster.length} →</Link></div>
                <div className="team-grid" style={{ marginTop: 16 }}>{roster.slice(0, 4).map((p) => <TeamCard key={p.key} person={p} />)}</div>
              </>
            )}

            {!isAuthenticated && (
              <p className="muted-sm" style={{ marginTop: 40 }}>
                <Link to="/login" style={{ textDecoration: 'underline' }}>Log in</Link> or <Link to="/register" style={{ textDecoration: 'underline' }}>sign up</Link> to join this club and register for its events.
              </p>
            )}
          </>
        )}

        {tab === 'events' && (
          <>
            <h2 className="section-title">Upcoming &amp; ongoing</h2>
            {upcoming.length === 0 ? <p className="muted-sm">No upcoming events right now.</p> : <div className="grid grid-3" style={{ margin: '16px 0 48px' }}>{upcoming.map((e) => <EventCard key={e._id} ev={e} onOpen={setEventId} />)}</div>}
            <h2 className="section-title">Previous events</h2>
            <p className="section-subtitle">Every past event stays here as the club's history.</p>
            {past.length === 0 ? <p className="muted-sm">No previous events yet.</p> : <div className="grid grid-3">{past.map((e) => <EventCard key={e._id} ev={e} onOpen={setEventId} />)}</div>}
          </>
        )}

        {tab === 'gallery' && (photos.length === 0
          ? <EmptyState title="No photos yet" subtitle="This club hasn't posted any photos." />
          : <div className="gallery-grid">{photos.map((p) => <div className="gallery-item" key={p._id} onClick={() => setPhoto(p)}><img src={p.imageUrl} alt={p.caption || 'Club photo'} /></div>)}</div>)}

        {tab === 'team' && (
          <>
            <div className="filter-bar">
              <div className="chip-row">
                <button className={`chip ${role === 'All' ? 'on' : ''}`} onClick={() => setRole('All')}>All ({roster.length})</button>
                {roles.map(([r, n]) => <button key={r} className={`chip ${role === r ? 'on' : ''}`} onClick={() => setRole(r)}>{r} ({n})</button>)}
              </div>
              <div className="search-box"><FiSearch /><input placeholder="Search name or role" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            </div>
            {shownTeam.length === 0 ? <EmptyState title="No one to show" subtitle="This club hasn't listed any role holders yet." />
              : <div className="team-grid stagger">{shownTeam.map((p) => <TeamCard key={p.key} person={p} />)}</div>}
          </>
        )}
      </div>

      {joinOpen && <JoinRequestModal club={{ _id: id, name: club.name }} onClose={() => setJoinOpen(false)} onSent={load} />}
      {eventId && <EventDetailModal eventId={eventId} onClose={() => setEventId(null)} onChange={load} />}
      {photo && (
        <Modal title={club.name} onClose={() => setPhoto(null)} width={640}>
          <img src={photo.imageUrl} alt={photo.caption} style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>{photo.caption}</p>
        </Modal>
      )}
    </div>
  );
};

export default ClubSite;
