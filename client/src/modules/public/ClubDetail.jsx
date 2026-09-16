import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const ClubDetail = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [myStatus, setMyStatus] = useState(null); // 'member' | 'pending' | null
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const load = () => {
    setLoading(true);
    const requests = [ClubAPI.getOne(id)];
    if (isAuthenticated && user.role === 'member') requests.push(ClubAPI.myStatus());

    Promise.all(requests)
      .then(([clubRes, statusRes]) => {
        setClub(clubRes.data.club);
        if (statusRes) {
          const isMember = statusRes.data.myClubs.some((c) => String(c._id) === id);
          const isPending = statusRes.data.pendingClubIds.includes(id);
          setMyStatus(isMember ? 'member' : isPending ? 'pending' : null);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await ClubAPI.requestToJoin(id, {});
      toast.success('Join request sent! Await approval.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send join request');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Loader fullscreen />;
  if (!club) return <div className="page container"><p>Club not found.</p></div>;

  const canRequestJoin = isAuthenticated && user.role === 'member' && myStatus === null;

  return (
    <div className="page container animate-fadeIn">
      {club.coverImage && <img src={club.coverImage} alt={club.name} style={{ borderRadius: 16, height: 260, objectFit: 'cover', marginBottom: 24 }} />}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="badge badge-president">{club.category}</span>
          <h1 style={{ marginTop: 10 }}>{club.name}</h1>
          <p style={{ color: 'var(--color-text-muted)' }}><FiUsers /> {club.members?.length || 0} members</p>
        </div>
        {canRequestJoin && (
          <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
            <FiUserPlus /> {joining ? 'Sending...' : 'Request to Join'}
          </button>
        )}
        {myStatus === 'member' && <span className="badge badge-success"><FiCheckCircle /> You're a member</span>}
        {myStatus === 'pending' && <span className="badge badge-warning"><FiClock /> Join request pending</span>}
      </div>

      <p style={{ marginTop: 24, maxWidth: 700, lineHeight: 1.7 }}>{club.description || 'No description provided yet.'}</p>

      <div className="grid grid-2" style={{ marginTop: 30 }}>
        <div className="card">
          <h4>Leadership</h4>
          <p>President: <strong>{club.president?.name || 'Not assigned'}</strong></p>
          <p>Coordinators: {club.coordinators?.length ? club.coordinators.map((c) => c.name).join(', ') : 'None yet'}</p>
        </div>
        <div className="card">
          <h4>Get Involved</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isAuthenticated
              ? "You can be a member of multiple clubs at once, and register for this club's events either way."
              : <>Please <Link to="/login" style={{ color: 'var(--color-primary)' }}>login</Link> or <Link to="/register" style={{ color: 'var(--color-primary)' }}>sign up</Link> to join or participate.</>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
