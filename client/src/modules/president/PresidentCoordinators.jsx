import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUserX } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

const PresidentCoordinators = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [toRemove, setToRemove] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    ClubAPI.getOne(clubId).then((res) => setClub(res.data.club)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ClubAPI.addCoordinator(clubId, { userEmail: email });
      toast.success('Coordinator assigned');
      setShowAdd(false);
      setEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign coordinator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    try {
      await ClubAPI.removeCoordinator(clubId, toRemove._id);
      toast.success('Coordinator removed');
      setToRemove(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove coordinator');
    }
  };

  if (!clubId) return <EmptyState title="No club assigned" />;
  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Coordinators</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>Assign coordinators to help run {club?.name}, or remove them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><FiUserPlus /> Assign Coordinator</button>
      </div>

      {club?.coordinators?.length ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {club.coordinators.map((c) => (
            <div key={c._id} className="card flex-between">
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{c.name}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{c.email}</p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setToRemove(c)}><FiUserX /> Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No coordinators yet" subtitle="Assign a registered student's email to make them a coordinator for your club." />
      )}

      {showAdd && (
        <Modal title="Assign a coordinator" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Registered user's email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Coordinator'}
            </button>
          </form>
        </Modal>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Remove coordinator?"
          message={`${toRemove.name} will lose coordinator access to ${club?.name}.`}
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onClose={() => setToRemove(null)}
        />
      )}
    </div>
  );
};

export default PresidentCoordinators;
