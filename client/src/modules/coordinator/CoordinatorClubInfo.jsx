import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ImageUploader from '../../components/common/ImageUploader';

const CoordinatorClubInfo = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [form, setForm] = useState({ description: '', category: '', coverImage: '' });
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
      })
      .finally(() => setLoading(false));
  }, [clubId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ClubAPI.update(clubId, form);
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
    <div className="animate-fadeIn" style={{ maxWidth: 560 }}>
      <h1 className="section-title">Club Information</h1>
      <p className="section-subtitle">Keep {club.name}'s public description and details up to date.</p>

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
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
};

export default CoordinatorClubInfo;
