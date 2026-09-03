import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiEdit2, FiLock } from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../../components/common/RoleBadge';
import ImageUploader from '../../components/common/ImageUploader';

const MemberProfile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', bio: user.bio || '', avatar: user.avatar || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await AuthAPI.updateMe(form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await AuthAPI.changePassword(pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 560 }}>
      <h1 className="section-title">My Profile</h1>
      <p className="section-subtitle">
        <RoleBadge role={user.role} /> · {user.club?.name ? `Member of ${user.club.name}` : 'Not in a club yet'}
      </p>

      <form onSubmit={handleProfileSubmit} className="card" style={{ marginBottom: 20 }}>
        <h4><FiUser /> Basic info</h4>
        <ImageUploader
          label="Profile photo"
          value={form.avatar}
          onChange={(url) => setForm({ ...form, avatar: url })}
        />
        <div className="form-group">
          <label className="form-label">Full name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label"><FiMail /> Email</label>
          <input className="input" value={user.email} disabled />
        </div>
        <div className="form-group">
          <label className="form-label"><FiPhone /> Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button className="btn btn-primary" disabled={savingProfile}><FiEdit2 /> {savingProfile ? 'Saving...' : 'Save changes'}</button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="card">
        <h4><FiLock /> Change password</h4>
        <div className="form-group">
          <label className="form-label">Current password</label>
          <input type="password" className="input" required value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">New password</label>
          <input type="password" className="input" required minLength={6} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
        </div>
        <button className="btn btn-secondary" disabled={savingPw}>{savingPw ? 'Updating...' : 'Update password'}</button>
      </form>
    </div>
  );
};

export default MemberProfile;
