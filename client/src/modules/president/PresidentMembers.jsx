import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserX, FiDownload } from 'react-icons/fi';
import { ClubAPI, ExportAPI } from '../../api/endpoints';
import { downloadFile } from '../../api/download';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import MemberDetailModal from '../../components/common/MemberDetailModal';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

const PresidentMembers = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toKick, setToKick] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [q, setQ] = useState('');

  const load = () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    ClubAPI.getMembers(clubId)
      .then((res) => { setClub(res.data.club); setMembers(res.data.members); })
      .finally(() => setLoading(false));
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

  const shown = members.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Members</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>{members.length} members in {club?.name} - click a member to see their details</p>
        </div>
        <button className="btn btn-outline" onClick={() => downloadFile(ExportAPI.membersCsvUrl(clubId), `${(club?.name || 'club').replace(/[^a-z0-9]+/gi, '_')}_members.csv`)}>
          <FiDownload /> Download members list
        </button>
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members yet" />
      ) : (
        <>
          <input className="input" style={{ maxWidth: 320, marginBottom: 16 }} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="table-scroll">
            <table className="table table-clickable">
              <thead><tr><th></th><th>Name</th><th>Email</th><th>Mobile</th><th>Action</th></tr></thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m._id} onClick={() => setViewing(m)}>
                    <td style={{ width: 52 }}>
                      <span className="sidebar-avatar">{m.avatar ? <img src={m.avatar} alt="" /> : m.name[0].toUpperCase()}</span>
                    </td>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone || '-'}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); setToKick(m); }}><FiUserX /> Kick</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {viewing && <MemberDetailModal person={viewing} onClose={() => setViewing(null)} />}
      {toKick && (
        <ConfirmDialog
          title="Remove member?"
          message={`${toKick.name} will be removed from ${club?.name} and lose club-member benefits.`}
          confirmLabel="Remove"
          onConfirm={handleKick}
          onClose={() => setToKick(null)}
        />
      )}
    </div>
  );
};

export default PresidentMembers;
