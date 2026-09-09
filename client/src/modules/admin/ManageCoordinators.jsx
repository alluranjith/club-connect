import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUserX } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

const ManageCoordinators = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTarget, setAddTarget] = useState(null);
  const [email, setEmail] = useState('');
  const [toRemove, setToRemove] = useState(null); // { club, coordinator }

  const load = () => {
    setLoading(true);
    ClubAPI.getAll().then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await ClubAPI.addCoordinator(addTarget._id, { userEmail: email });
      toast.success('Coordinator added');
      setAddTarget(null);
      setEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add coordinator');
    }
  };

  const handleRemove = async () => {
    try {
      await ClubAPI.removeCoordinator(toRemove.club._id, toRemove.coordinator._id);
      toast.success('Coordinator removed');
      setToRemove(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove coordinator');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">Manage Coordinators</h1>
      <p className="section-subtitle">Assign coordinators to clubs, or kick underperforming ones.</p>

      {clubs.length === 0 ? (
        <EmptyState title="No clubs yet" />
      ) : (
        <div className="grid grid-2 stagger">
          {clubs.map((club) => (
            <div className="card" key={club._id}>
              <div className="flex-between">
                <h4 style={{ margin: 0 }}>{club.name}</h4>
                <button className="btn btn-secondary btn-sm" onClick={() => setAddTarget(club)}>
                  <FiUserPlus /> Add
                </button>
              </div>
              <div style={{ marginTop: 14 }}>
                {club.coordinators?.length ? club.coordinators.map((c) => (
                  <div key={c._id} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ margin: 0 }}>{c.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.email}</p>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setToRemove({ club, coordinator: c })}>
                      <FiUserX /> Kick
                    </button>
                  </div>
                )) : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>No coordinators assigned yet.</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {addTarget && (
        <Modal title={`Add coordinator to ${addTarget.name}`} onClose={() => setAddTarget(null)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Registered user's email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block">Add Coordinator</button>
          </form>
        </Modal>
      )}

      {toRemove && (
        <ConfirmDialog
          title="Kick coordinator?"
          message={`${toRemove.coordinator.name} will lose coordinator access to ${toRemove.club.name}.`}
          confirmLabel="Kick"
          onConfirm={handleRemove}
          onClose={() => setToRemove(null)}
        />
      )}
    </div>
  );
};

export default ManageCoordinators;
