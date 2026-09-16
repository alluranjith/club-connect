import { useEffect, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { EventAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

// Anyone (club member or not) can register for events, so everyone gets their
// own participation history here - it isn't gated by club membership status.
const MemberParticipations = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EventAPI.myParticipations().then((res) => setRecords(res.data.records)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">My Participations</h1>
      <p className="section-subtitle">Every event you have registered for or attended, across every club.</p>

      {records.length === 0 ? (
        <EmptyState icon={<FiTrendingUp />} title="No participations yet" subtitle="Register for an event to see it show up here." />
      ) : (
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
      )}
    </div>
  );
};

export default MemberParticipations;
