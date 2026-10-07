import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUser, FiPhone, FiLogOut } from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import ImageUploader from '../../components/common/ImageUploader';

// Shown right after the first login: full name, profile photo and a 10-digit mobile number are
// required, the self description is optional. Every dashboard route redirects here until it's done.
const CompleteProfile = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name && !user.name.includes('@') ? user.name : '',
    avatar: user?.avatar || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.avatar) { toast.error('Please upload a profile photo'); return; }
    if (!/^\d{10}$/.test(form.phone)) { toast.error('Mobile number must be exactly 10 digits'); return; }
    setSaving(true);
    try {
      await AuthAPI.updateMe(form);
      await refreshUser();
      toast.success('Profile completed!');
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save your profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page auth-page-simple">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Complete your profile</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          Clubs use these details to know who you are. You can edit them later.
        </p>
        <form onSubmit={submit}>
          <ImageUploader label="Profile photo (required)" value={form.avatar} onChange={(url) => setForm({ ...form, avatar: url })} />
          <div className="form-group">
            <label className="form-label"><FiUser /> Full name</label>
            <input className="input" required minLength={2} maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label"><FiPhone /> Mobile number</label>
            <input className="input" required inputMode="numeric" pattern="\d{10}" maxLength={10} title="Exactly 10 digits" placeholder="10-digit mobile number"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div className="form-group">
            <label className="form-label">About you <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea className="input" rows={3} maxLength={300} placeholder="Interests, skills, what you want from clubs..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <small style={{ color: 'var(--color-text-muted)' }}>{form.bio.length}/300</small>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving}>{saving ? 'Saving...' : 'Save and continue'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="link-btn" onClick={() => { logout(); navigate('/login'); }}><FiLogOut /> Log out</button>
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;
