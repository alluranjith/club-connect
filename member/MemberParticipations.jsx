import { useEffect, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { EventAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MemberParticipations = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const isClubMember = user.membershipStatus === 'accepted' && user.club;

  useEffect(() => {
    // Accepted club members: their own participation history.
    // Non-club members (rejected/none): browse events and see who has participated, so they
    // get a general picture of activity without exposing every user's full profile.
    if (isClubMember) {
      EventAPI.myParticipations().then((res) => setRecords(res.data.records)).finally(() => setLoading(false));
    } else {
      EventAPI.getAll({ status: 'completed' })
        .then((res) => setRecords(res.data.events))
        .finally(() => setLoading(false));
    }
  }, [isClubMember]);

  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">{isClubMember ? 'My Participations' : 'Previously Participated Events'}</h1>
      <p className="section-subtitle">
        {isClubMember
          ? 'Every event you have registered for or attended.'
          : 'A look at past events and who took part in them.'}
      </p>

      {records.length === 0 ? (
        <EmptyState icon={<FiTrendingUp />} title="Nothing to show yet" />
      ) : isClubMember ? (
        <div className="table-scroll">
        <table className="table">
          <thead><tr><th>Event</th><th>Date</th><th>Venue</th><th>Attended</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td>{r.event?.title}</td>
                <td>{r.event ? new Date(r.event.date).toLocaleDateString() : '—'}</td>
                <td>{r.event?.venue || '—'}</td>
                <td><span className={`badge ${r.attended ? 'badge-success' : 'badge-warning'}`}>{r.attended ? 'Yes' : 'Not yet'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : (
        <div className="grid grid-3 stagger">
          {records.map((ev) => (
            <div className="card" key={ev._id}>
              <h4>{ev.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{new Date(ev.date).toLocaleDateString()}</p>
              <p style={{ fontSize: '0.85rem' }}>{ev.participants?.length || 0} participants</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberParticipations;
