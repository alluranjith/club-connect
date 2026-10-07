import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import ImageUploader from '../common/ImageUploader';

// Used by both President and Coordinator dashboards to edit their own club's
// description, category, and cover image. Neither role can rename the club -
// only admin can do that (enforced server-side too).
const ClubInfoEditor = ({ title = 'Club Information', subtitle }) => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [form, setForm] = useState({ description: '', category: '', coverImage: '' });
  const [socialLinks, setSocialLinks] = useState([]);
  const canEditSocial = user?.role === 'president' || user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    ClubAPI.getOne(clubId)
      .then((res) => {
        setClub(res.data.club);
        setForm({
          description: res.data.club.description || '',
          category: res.data.club.category || '',
          coverImage: res.data.club.coverImage || '',
        });
        setSocialLinks((res.data.club.socialLinks || []).map(({ name, url }) => ({ name, url })));
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ClubAPI.update(clubId, canEditSocial ? { ...form, socialLinks } : form);
      toast.success('Club information updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update club info');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;
  if (!clubId) return <EmptyState title="No club assigned" />;

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 640 }}>
      <h1 className="section-title">{title}</h1>
      <p className="section-subtitle">{subtitle || `Keep ${club?.name}'s public description and details up to date.`}</p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Category</label>
          <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <ImageUploader
          label="Cover image"
          value={form.coverImage}
          onChange={(url) => setForm({ ...form, coverImage: url })}
        />
        {canEditSocial && (
          <div className="form-group">
            <label className="form-label">Social media links</label>
            {socialLinks.map((l, i) => (
              <div key={i} className="social-edit-row">
                <input className="input" list="social-names" placeholder="Name (e.g. Instagram)" value={l.name}
                  onChange={(e) => setSocialLinks(socialLinks.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="input" placeholder="https://..." value={l.url}
                  onChange={(e) => setSocialLinks(socialLinks.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setSocialLinks(socialLinks.filter((_, j) => j !== i))} aria-label="Remove link"><FiTrash2 /></button>
              </div>
            ))}
            <datalist id="social-names">{['Instagram', 'LinkedIn', 'X (Twitter)', 'YouTube', 'GitHub', 'Facebook', 'Discord', 'Website'].map((n) => <option key={n} value={n} />)}</datalist>
            {socialLinks.length < 10 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSocialLinks([...socialLinks, { name: '', url: '' }])}><FiPlus /> Add link</button>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 8 }}>Shown publicly on the clubs page and club detail page.</p>
          </div>
        )}
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
};

export default ClubInfoEditor;
