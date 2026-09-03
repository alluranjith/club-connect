import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiBell } from 'react-icons/fi';
import { NotificationAPI } from '../../api/endpoints';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import Loader from '../common/Loader';
import { useAuth } from '../../context/AuthContext';

const NotificationManager = ({ canPost = true }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'general' });
  const [toDelete, setToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    NotificationAPI.getAll().then((res) => setItems(res.data.notifications)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await NotificationAPI.create(form);
      toast.success('Notification sent');
      setShowAdd(false);
      setForm({ title: '', message: '', type: 'general' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await NotificationAPI.remove(toDelete._id);
      toast.success('Notification removed');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove notification');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        {canPost && <button className="btn btn-primary" onClick={() => setShowAdd(true)}><FiPlus /> New Notification</button>}
      </div>

      {loading ? <Loader /> : items.length === 0 ? (
        <EmptyState icon={<FiBell />} title="No notifications yet" />
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((n) => (
            <div className="card flex-between" key={n._id}>
              <div>
                <span className={`badge badge-${n.type === 'event' ? 'success' : 'president'}`}>{n.type}</span>
                <h4 style={{ margin: '8px 0 4px' }}>{n.title}</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{n.message}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {n.club?.name || 'Platform-wide'} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {(user.role === 'admin' || String(n.createdBy?._id) === String(user._id)) && (
                <button className="btn btn-danger btn-sm" onClick={() => setToDelete(n)}><FiTrash2 /></button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Send notification" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="input" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="general">General</option>
                <option value="event">Event</option>
                <option value="club">Club</option>
                <option value="alert">Alert</option>
              </select>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete notification?"
          message="This will remove the notification for everyone who can see it."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default NotificationManager;
