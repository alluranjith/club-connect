import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiEye } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import MemberDetailModal from '../../components/common/MemberDetailModal';

// Shared by president / coordinator: every applicant's photo, contact details, bio and
// the reason they wrote are visible BEFORE deciding.
const JoinRequests = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

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
      setViewing(null);
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
      <p className="section-subtitle">Review each applicant's details and reason before you approve or reject.</p>

      {requests.length === 0 ? (
        <EmptyState title="No pending requests" subtitle="New join requests will show up here." />
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((r) => (
            <div className="card request-card" key={r._id}>
              <div className="request-who">
                <div className="sidebar-avatar" style={{ width: 56, height: 56, fontSize: '1.2rem' }}>
                  {r.user.avatar ? <img src={r.user.avatar} alt={r.user.name} /> : r.user.name[0].toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{r.user.name}</h4>
                  <p className="muted-sm">{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ''}</p>
                  <p className="muted-sm">Requested {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="request-reason"><span className="detail-label">Why they want to join</span><p>{r.message || <em>No reason given</em>}</p></div>
              <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setViewing(r)}><FiEye /> Full profile</button>
                <button className="btn btn-success btn-sm" onClick={() => decide(r._id, 'accepted')}><FiCheck /> Accept</button>
                <button className="btn btn-danger btn-sm" onClick={() => decide(r._id, 'rejected')}><FiX /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && <MemberDetailModal person={{ ...viewing.user, intent: viewing.message }} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default JoinRequests;
