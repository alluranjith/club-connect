import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock } from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthAPI.resetPassword(token, { password: form.password });
      login(res.data.token, res.data.user);
      toast.success('Password reset! You are now logged in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset link invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="section-title" style={{ textAlign: 'center' }}>Reset password</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>Choose a new password for your account.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><FiLock /> New password</label>
            <input
              type="password" className="input" required minLength={6} placeholder="At least 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label"><FiLock /> Confirm new password</label>
            <input
              type="password" className="input" required placeholder="Re-enter new password"
              value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--color-text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
