import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserPlus } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import RoleBadge from '../../components/common/RoleBadge';

const MemberOverview = () => {
  const { user, refreshUser } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    ClubAPI.getAll().then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  }, []);

  const handleJoin = async (clubId) => {
    setJoining(clubId);
    try {
      await ClubAPI.requestToJoin(clubId, {});
      toast.success('Join request sent! Await approval from the club.');
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send join request');
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <Loader />;

  // ---- Accepted club member ----
  if (user.membershipStatus === 'accepted' && user.club) {
    return (
      <div className="animate-fadeIn">
        <h1 className="section-title">Welcome, {user.name}!</h1>
        <p className="section-subtitle">
          You're an accepted member of <strong>{user.club.name || 'your club'}</strong>. <RoleBadge role="member" />
        </p>
        <div className="card">
          <p>Use the sidebar to check notifications, browse events, view your participation history, and explore the gallery.</p>
        </div>
      </div>
    );
  }

  // ---- Pending request ----
  if (user.membershipStatus === 'pending') {
    return (
      <div className="animate-fadeIn">
        <h1 className="section-title">Request pending</h1>
        <div className="card" style={{ maxWidth: 480 }}>
          <span className="badge badge-warning">Pending approval</span>
          <p style={{ marginTop: 12 }}>
            Your request to join a club is awaiting a decision from the club's president or coordinator.
            You can still browse events, notifications and the gallery in the meantime.
          </p>
        </div>
      </div>
    );
  }

  // ---- 'none' (first-time) or 'rejected' (non-club member) - show club list to request joining ----
  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">{user.membershipStatus === 'rejected' ? 'Find another club' : 'Join a club'}</h1>
      <p className="section-subtitle">
        {user.membershipStatus === 'rejected'
          ? "Your previous request wasn't accepted, but you can still participate in events and try another club."
          : 'Pick a club below to send a join request. You can still browse events and the gallery without joining.'}
      </p>

      {clubs.length === 0 ? (
        <EmptyState title="No clubs available yet" />
      ) : (
        <div className="grid grid-3 stagger">
          {clubs.map((club) => (
            <div className="card" key={club._id}>
              {club.coverImage && <img src={club.coverImage} alt={club.name} style={{ borderRadius: 10, height: 130, objectFit: 'cover', marginBottom: 10 }} />}
              <h4>{club.name}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', minHeight: 36 }}>{club.description || 'No description yet.'}</p>
              <button className="btn btn-primary btn-sm" onClick={() => handleJoin(club._id)} disabled={joining === club._id}>
                <FiUserPlus /> {joining === club._id ? 'Sending...' : 'Request to Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberOverview;
