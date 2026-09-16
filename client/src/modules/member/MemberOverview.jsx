import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserPlus, FiCheckCircle, FiClock } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const MemberOverview = () => {
  const { user } = useAuth();
  const [allClubs, setAllClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [pendingClubIds, setPendingClubIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([ClubAPI.getAll(), ClubAPI.myStatus()])
      .then(([clubsRes, statusRes]) => {
        setAllClubs(clubsRes.data.clubs);
        setMyClubs(statusRes.data.myClubs);
        setPendingClubIds(statusRes.data.pendingClubIds);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleJoin = async (clubId) => {
    setJoining(clubId);
    try {
      await ClubAPI.requestToJoin(clubId, {});
      toast.success('Join request sent! Await approval from the club.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send join request');
    } finally {
      setJoining(null);
    }
  };

  if (loading) return <Loader />;

  const myClubIds = myClubs.map((c) => String(c._id));
  // Clubs the student hasn't joined and doesn't have a pending request for yet -
  // a student can be a member of several clubs at once, so this list is never
  // hidden just because they're already in one club.
  const browsableClubs = allClubs.filter(
    (c) => !myClubIds.includes(String(c._id)) && !pendingClubIds.includes(String(c._id))
  );

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Welcome, {user.name}!</h1>
      <p className="section-subtitle">
        You can be part of as many clubs as you like — request to join any club below.
      </p>

      {/* ---- Clubs I'm already an accepted member of ---- */}
      {myClubs.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ marginBottom: 14 }}>My Clubs</h3>
          <div className="grid grid-3 stagger">
            {myClubs.map((club) => (
              <div className="card" key={club._id}>
                {club.coverImage && <img src={club.coverImage} alt={club.name} style={{ borderRadius: 10, height: 120, objectFit: 'cover', marginBottom: 10 }} />}
                <h4>{club.name}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', minHeight: 36 }}>{club.description || 'No description yet.'}</p>
                <span className="badge badge-success"><FiCheckCircle /> Member</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Pending requests ---- */}
      {pendingClubIds.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ marginBottom: 14 }}>Pending Requests</h3>
          <div className="grid grid-3 stagger">
            {allClubs.filter((c) => pendingClubIds.includes(String(c._id))).map((club) => (
              <div className="card" key={club._id}>
                <h4>{club.name}</h4>
                <span className="badge badge-warning"><FiClock /> Awaiting approval</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Browse & request to join other clubs ---- */}
      <div>
        <h3 style={{ marginBottom: 14 }}>{myClubs.length > 0 ? 'Join another club' : 'Join a club'}</h3>
        {browsableClubs.length === 0 ? (
          <EmptyState title="No more clubs to join right now" subtitle="You're already a member of, or have a pending request for, every club." />
        ) : (
          <div className="grid grid-3 stagger">
            {browsableClubs.map((club) => (
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
    </div>
  );
};

export default MemberOverview;
