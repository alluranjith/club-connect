import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiCalendar, FiClock, FiCheckCircle, FiBell, FiTrendingUp, FiExternalLink } from 'react-icons/fi';
import { ClubAPI, EventAPI, NotificationAPI, AnalyticsAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import EventDetailModal from '../common/EventDetailModal';
import DashboardHero from '../common/DashboardHero';
import SocialLinks from '../common/SocialLinks';
import StatusBadge, { isActiveEvent } from '../common/StatusBadge';
import BarTrend from '../common/charts/BarTrend';
import LineTrend from '../common/charts/LineTrend';

const Stat = ({ icon, label, value }) => (
  <div className="card">
    <div className="flex-between">
      <div>
        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</p>
        <h2 style={{ margin: '6px 0 0' }}>{value}</h2>
      </div>
      <div className="stat-icon-badge">{icon}</div>
    </div>
  </div>
);

// Shared club home for president & coordinator: stats, latest announcements,
// upcoming events, and (president only) analytics charts.
const ClubOverview = ({ role, withAnalytics = false }) => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    Promise.all([
      ClubAPI.getOne(clubId),
      EventAPI.getAll({ club: clubId }),
      NotificationAPI.getAll().catch(() => ({ data: { notifications: [] } })),
      withAnalytics ? AnalyticsAPI.club(clubId).catch(() => null) : Promise.resolve(null),
    ])
      .then(([c, e, n, a]) => setData({ club: c.data.club, events: e.data.events, notifications: n.data.notifications, analytics: a?.data?.analytics }))
      .finally(() => setLoading(false));
  }, [clubId, withAnalytics]);

  if (loading) return <Loader />;
  if (!data) return <EmptyState title="No club assigned yet" subtitle={`Ask the admin to assign you as ${role === 'president' ? 'president' : 'a coordinator'}.`} />;

  const { club, events, notifications, analytics } = data;
  const upcoming = events.filter(isActiveEvent).sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = notifications.slice(0, 3);
  const teamSize = (club.coordinators?.length || 0) + (club.team?.length || 0) + (club.president ? 1 : 0);

  return (
    <div className="animate-fadeIn">
      <DashboardHero
        title={club.name}
        subtitle={`Welcome back, ${user.name}. Here's how your club is doing.`}
        chips={[`${club.memberCount || 0} members`, `${events.length} events`, `${teamSize} role holders`]}
      />

      <div className="grid grid-4 stagger" style={{ marginBottom: 24 }}>
        <Stat icon={<FiUsers />} label="Members" value={club.memberCount || 0} />
        <Stat icon={<FiUserCheck />} label="Role holders" value={teamSize} />
        <Stat icon={<FiClock />} label="Upcoming" value={upcoming.length} />
        <Stat icon={<FiCheckCircle />} label={analytics ? 'Attendance' : 'Total events'} value={analytics ? `${analytics.summary.attendanceRate}%` : events.length} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24, alignItems: 'start' }}>
        <div className="analytics-card">
          <div className="flex-between"><h3 className="analytics-card-title"><FiBell /> Latest announcements</h3>
            <Link to={`/${role}/notifications`} className="link-arrow">All →</Link></div>
          {latest.length === 0 ? <EmptyState title="No announcements yet" subtitle="Post one from the Notifications page." /> : latest.map((n) => (
            <div key={n._id} className="overview-item">
              {n.image && <img className="overview-thumb" src={n.image} alt="" />}
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{n.title}</p>
                <p className="overview-clamp">{n.message}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{n.club?.name || 'Platform-wide'} · {new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="analytics-card">
          <div className="flex-between"><h3 className="analytics-card-title"><FiCalendar /> Upcoming events</h3>
            <Link to={`/${role}/events`} className="link-arrow">All →</Link></div>
          {upcoming.length === 0 ? <EmptyState title="Nothing scheduled" subtitle="Past events are cleared automatically." /> : upcoming.slice(0, 4).map((e) => (
            <div key={e._id} className="overview-item clickable-card" onClick={() => setOpenId(e._id)}>
              <div className="overview-date"><strong>{new Date(e.date).getDate()}</strong><span>{new Date(e.date).toLocaleString(undefined, { month: 'short' })}</span></div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{e.title}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {e.venue || 'TBA'}</p>
              </div>
              <StatusBadge status={e.status} />
            </div>
          ))}
        </div>
      </div>

      {analytics && (
        <div className="grid grid-2" style={{ marginBottom: 24, alignItems: 'stretch' }}>
          <div className="analytics-card">
            <h3 className="analytics-card-title"><FiTrendingUp /> Events per month</h3>
            {analytics.eventsByMonth.some((m) => m.count > 0) ? <BarTrend data={analytics.eventsByMonth} color="var(--color-primary)" /> : <EmptyState title="No events yet" />}
          </div>
          <div className="analytics-card">
            <h3 className="analytics-card-title"><FiUsers /> Member growth</h3>
            {analytics.memberGrowth.some((m) => m.count > 0) ? <LineTrend data={analytics.memberGrowth} color="var(--color-primary)" /> : <EmptyState title="No accepted members yet" />}
          </div>
        </div>
      )}

      <div className="analytics-card">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 className="analytics-card-title" style={{ marginBottom: 8 }}>Public presence</h3>
            <SocialLinks links={club.socialLinks} />
            {!club.socialLinks?.length && <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{role === 'president' ? 'Add social links under Club Info.' : 'No social links published yet.'}</p>}
          </div>
          <div className="flex gap-sm">
            <Link to={`/clubs/${club._id}/team`} className="btn btn-outline btn-sm"><FiExternalLink /> Team page</Link>
            <Link to={`/clubs/${club._id}`} className="btn btn-primary btn-sm"><FiExternalLink /> Public club page</Link>
          </div>
        </div>
      </div>
      {openId && <EventDetailModal eventId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
};

export default ClubOverview;
