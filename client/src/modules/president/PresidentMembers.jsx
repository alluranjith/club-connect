import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserX, FiDownload } from 'react-icons/fi';
import { ClubAPI, ExportAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PresidentMembers = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toKick, setToKick] = useState(null);

  const load = () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    ClubAPI.getOne(clubId).then((res) => setClub(res.data.club)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  const handleKick = async () => {
    try {
      await ClubAPI.removeMember(clubId, toKick._id);
      toast.success('Member removed from club');
      setToKick(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (!clubId) return <EmptyState title="No club assigned" />;
  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Members</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>{club.members?.length || 0} members in {club.name}</p>
        </div>
        <a className="btn btn-outline" href={ExportAPI.membersCsvUrl(clubId)} target="_blank" rel="noreferrer"><FiDownload /> Export list</a>
      </div>

      {club.members?.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <div className="table-scroll">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
          <tbody>
            {club.members.map((m) => (
              <tr key={m._id}>
                <td>{m.name}</td>
                <td>{m.email}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => setToKick(m)}><FiUserX /> Kick</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {toKick && (
        <ConfirmDialog
          title="Remove member?"
          message={`${toKick.name} will be removed from ${club.name} and lose club-member benefits.`}
          confirmLabel="Remove"
          onConfirm={handleKick}
          onClose={() => setToKick(null)}
        />
      )}
    </div>
  );
};

export default PresidentMembers;
