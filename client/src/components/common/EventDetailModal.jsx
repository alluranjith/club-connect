import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCalendar, FiMapPin, FiUsers, FiUser, FiClock, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Modal from './Modal';
import Loader from './Loader';
import StatusBadge from './StatusBadge';

const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const countdown = (ev) => {
  const now = Date.now();
  const start = +new Date(ev.date);
  const end = ev.endDate ? +new Date(ev.endDate) : null;
  if (ev.status === 'cancelled') return 'This event has been cancelled';
  if (ev.status === 'completed') return 'This event has finished';
  if (ev.status === 'ongoing' || (start <= now && (!end || end >= now))) return 'Happening now';
  const mins = Math.round((start - now) / 60000);
  if (mins < 60) return `Starts in ${Math.max(mins, 1)} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `Starts in ${hrs} hour${hrs > 1 ? 's' : ''}`;
  return `Starts in ${Math.round(hrs / 24)} days`;
};

const calendarUrl = (ev) => {
  const z = (d) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = ev.endDate || new Date(+new Date(ev.date) + 2 * 60 * 60 * 1000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${z(ev.date)}/${z(end)}`, details: ev.description || '', location: ev.venue || '' });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
};

// Pop-up with EVERY detail of an event + a Participate button. Works anywhere events are listed:
// logged-in users register in one click, visitors are asked to log in (and come back afterwards).
const EventDetailModal = ({ eventId, onClose, onChange }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ev, setEv] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => EventAPI.getOne(eventId).then((res) => setEv(res.data.event)).catch(() => setError('This event could not be loaded.'));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [eventId]);

  const participate = async () => {
    if (!isAuthenticated) {
      toast('Please log in to participate');
      onClose();
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setBusy(true);
    try {
      await EventAPI.participate(eventId);
      toast.success("You're registered for this event!");
      await load();
      onChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not register');
    } finally {
      setBusy(false);
    }
  };

  const closed = ev && (ev.status === 'completed' || ev.status === 'cancelled');

  return (
    <Modal title="Event details" onClose={onClose} width={620}>
      {error && <p>{error}</p>}
      {!ev && !error && <Loader />}
      {ev && (
        <div className="event-detail">
          {ev.bannerImage && <img className="event-detail-banner" src={ev.bannerImage} alt={ev.title} />}
          <div className="event-detail-badges">
            <StatusBadge status={ev.status} />
            {ev.club ? <Link to={`/clubs/${ev.club._id}`} className="badge" onClick={onClose}>{ev.club.name} <FiExternalLink /></Link> : <span className="badge">Platform-wide</span>}
          </div>
          <h2 style={{ margin: '10px 0 4px' }}>{ev.title}</h2>
          <p className="event-detail-count"><FiClock /> {countdown(ev)}</p>

          <div className="detail-row"><span className="detail-label"><FiCalendar /> Starts</span><span>{fmtDateTime(ev.date)}</span></div>
          {ev.endDate && <div className="detail-row"><span className="detail-label"><FiCalendar /> Ends</span><span>{fmtDateTime(ev.endDate)}</span></div>}
          <div className="detail-row"><span className="detail-label"><FiMapPin /> Venue</span><span>{ev.venue || 'To be announced'}</span></div>
          <div className="detail-row"><span className="detail-label"><FiUsers /> Registered</span><span>{ev.participantCount ?? 0} participant{ev.participantCount === 1 ? '' : 's'}</span></div>
          {ev.createdBy && <div className="detail-row"><span className="detail-label"><FiUser /> Organised by</span><span>{ev.createdBy.name} <span className="muted-sm" style={{ display: 'inline' }}>({ev.createdBy.role})</span></span></div>}

          <div className="detail-quote">
            <span className="detail-label">About this event</span>
            <p style={{ whiteSpace: 'pre-wrap' }}>{ev.description || <em style={{ color: 'var(--color-text-muted)' }}>No description was added.</em>}</p>
          </div>

          <div className="event-detail-actions">
            {ev.registered ? (
              <button className="btn btn-success btn-block" disabled><FiCheckCircle /> You're registered</button>
            ) : closed ? (
              <button className="btn btn-outline btn-block" disabled>Registration closed</button>
            ) : (
              <button className="btn btn-primary btn-block" onClick={participate} disabled={busy}>
                {busy ? 'Registering...' : isAuthenticated ? 'Participate' : 'Log in to participate'}
              </button>
            )}
            {!closed && <a className="btn btn-outline btn-block" href={calendarUrl(ev)} target="_blank" rel="noopener noreferrer"><FiCalendar /> Add to Google Calendar</a>}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EventDetailModal;
