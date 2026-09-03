import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiX } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const JoinRequests = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    ClubAPI.getJoinRequests(clubId).then((res) => setRequests(res.data.requests)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  const decide = async (requestId, decision) => {
    try {
      await ClubAPI.decideJoinRequest(requestId, decision);
      toast.success(`Request ${decision}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update request');
    }
  };

  if (!clubId) return <EmptyState title="No club assigned" subtitle="You need to be assigned as president of a club first." />;
  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Join Requests</h1>
      <p className="section-subtitle">Approve or reject new members who want to join your club.</p>

      {requests.length === 0 ? (
        <EmptyState title="No pending requests" subtitle="New join requests will show up here." />
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((r) => (
            <div className="card flex-between" key={r._id}>
              <div>
                <h4 style={{ margin: 0 }}>{r.user.name}</h4>
                <p style={{ margin: '4px 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{r.user.email}</p>
                {r.message && <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>"{r.message}"</p>}
              </div>
              <div className="flex gap-sm">
                <button className="btn btn-success btn-sm" onClick={() => decide(r._id, 'accepted')}><FiCheck /> Accept</button>
                <button className="btn btn-danger btn-sm" onClick={() => decide(r._id, 'rejected')}><FiX /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JoinRequests;
