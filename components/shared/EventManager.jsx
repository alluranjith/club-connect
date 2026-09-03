import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiTrendingUp, FiDownload, FiEdit2 } from 'react-icons/fi';
import { EventAPI, ExportAPI } from '../../api/endpoints';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import Loader from '../common/Loader';
import ImageUploader from '../common/ImageUploader';

const emptyForm = { title: '', description: '', venue: '', date: '', endDate: '', bannerImage: '' };

const EventManager = ({ clubId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toDelete, setToDelete] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    EventAPI.getAll(clubId ? { club: clubId } : {}).then((res) => setEvents(res.data.events)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (ev) => {
    setEditing(ev);
    setForm({
      title: ev.title, description: ev.description || '', venue: ev.venue || '',
      date: ev.date?.slice(0, 16), endDate: ev.endDate?.slice(0, 16) || '', bannerImage: ev.bannerImage || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await EventAPI.update(editing._id, form);
        toast.success('Event updated');
      } else {
        await EventAPI.create(form);
        toast.success('Event created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await EventAPI.remove(toDelete._id);
      toast.success('Event removed');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove event');
    }
  };

  const viewTracking = async (ev) => {
    try {
      const res = await EventAPI.tracking(ev._id);
      setTracking(res.data.tracking);
    } catch (err) {
      toast.error('Could not load tracking data');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Events</h2>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Event</button>
      </div>

      {loading ? <Loader /> : events.length === 0 ? (
        <EmptyState title="No events yet" subtitle="Create your first event to start tracking participation." />
      ) : (
        <div className="grid grid-3 stagger">
          {events.map((ev) => (
            <div className="card" key={ev._id}>
              <span className="badge badge-success">{ev.status}</span>
              <h4 style={{ margin: '8px 0 4px' }}>{ev.title}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {new Date(ev.date).toLocaleString()} · {ev.venue || 'TBA'}
              </p>
              <div className="flex gap-sm" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ev)}><FiEdit2 /> Edit</button>
                <button className="btn btn-outline btn-sm" onClick={() => viewTracking(ev)}><FiTrendingUp /> Track</button>
                <a className="btn btn-outline btn-sm" href={ExportAPI.participationCsvUrl(ev._id)} target="_blank" rel="noreferrer">
                  <FiDownload /> Export
                </a>
                <button className="btn btn-danger btn-sm" onClick={() => setToDelete(ev)}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit event' : 'Create event'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Venue</label>
              <input className="input" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Start date & time</label>
              <input type="datetime-local" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <ImageUploader
              label="Banner image (optional)"
              value={form.bannerImage}
              onChange={(url) => setForm({ ...form, bannerImage: url })}
            />
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Save changes' : 'Create event'}
            </button>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete event?"
          message="This removes the event and its participation records permanently."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}

      {tracking && (
        <Modal title={`Tracking: ${tracking.title}`} onClose={() => setTracking(null)}>
          <div className="grid grid-2" style={{ marginBottom: 16 }}>
            <div className="card"><h3 style={{ margin: 0 }}>{tracking.totalRegistered}</h3><p>Registered</p></div>
            <div className="card"><h3 style={{ margin: 0 }}>{tracking.attendanceRate}%</h3><p>Attendance rate</p></div>
          </div>
          <h4>Participants</h4>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {tracking.participants.map((p) => (
              <div key={p._id} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span>{p.name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{p.email}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventManager;
