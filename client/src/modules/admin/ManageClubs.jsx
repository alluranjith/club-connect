import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUserPlus, FiDownload } from 'react-icons/fi';
import { ClubAPI, ExportAPI } from '../../api/endpoints';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import ImageUploader from '../../components/common/ImageUploader';

const emptyForm = { name: '', description: '', category: 'General', coverImage: '', presidentEmail: '' };

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toDisband, setToDisband] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [presidentEmail, setPresidentEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    ClubAPI.getAll().then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ClubAPI.create(form);
      toast.success('Club created');
      setShowCreate(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisband = async () => {
    try {
      await ClubAPI.disband(toDisband._id);
      toast.success('Club disintegrated');
      setToDisband(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disband club');
    }
  };

  const handleAssignPresident = async (e) => {
    e.preventDefault();
    try {
      await ClubAPI.assignPresident(assignTarget._id, { userEmail: presidentEmail });
      toast.success('President assigned');
      setAssignTarget(null);
      setPresidentEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign president');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Manage Clubs</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>Create new clubs or disintegrate inactive ones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><FiPlus /> New Club</button>
      </div>

      {loading ? <Loader /> : clubs.length === 0 ? (
        <EmptyState title="No clubs yet" subtitle="Create the first club to get started." />
      ) : (
        <div className="grid grid-3 stagger">
          {clubs.map((club) => (
            <div className="card" key={club._id}>
              <div className="flex-between">
                <span className={`badge ${club.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {club.isActive ? 'Active' : 'Disbanded'}
                </span>
              </div>
              <h4 style={{ margin: '10px 0 4px' }}>{club.name}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                President: {club.president?.name || 'None'}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Coordinators: {club.coordinators?.length || 0}
              </p>
              <div className="flex gap-sm" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setAssignTarget(club)}>
                  <FiUserPlus /> Set President
                </button>
                <a className="btn btn-outline btn-sm" href={ExportAPI.membersCsvUrl(club._id)} target="_blank" rel="noreferrer">
                  <FiDownload /> Members
                </a>
                {club.isActive && (
                  <button className="btn btn-danger btn-sm" onClick={() => setToDisband(club)}>
                    <FiTrash2 /> Disband
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create a new club" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Club name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <ImageUploader
              label="Cover image (optional)"
              value={form.coverImage}
              onChange={(url) => setForm({ ...form, coverImage: url })}
            />
            <div className="form-group">
              <label className="form-label">President's email (optional - must already be registered)</label>
              <input className="input" type="email" value={form.presidentEmail} onChange={(e) => setForm({ ...form, presidentEmail: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create club'}
            </button>
          </form>
        </Modal>
      )}

      {assignTarget && (
        <Modal title={`Set president for ${assignTarget.name}`} onClose={() => setAssignTarget(null)}>
          <form onSubmit={handleAssignPresident}>
            <div className="form-group">
              <label className="form-label">Registered user's email</label>
              <input className="input" type="email" required value={presidentEmail} onChange={(e) => setPresidentEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block">Assign President</button>
          </form>
        </Modal>
      )}

      {toDisband && (
        <ConfirmDialog
          title="Disintegrate club?"
          message={`"${toDisband.name}" will be disbanded. Members, president and coordinators will be released from it.`}
          confirmLabel="Disband"
          onConfirm={handleDisband}
          onClose={() => setToDisband(null)}
        />
      )}
    </div>
  );
};

export default ManageClubs;
