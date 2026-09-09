import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiShield, FiUsers, FiUserCheck, FiUser } from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';

// The four possible logins. "member" is labelled "Student" in the UI per spec,
// but maps to the same 'member' role in the database.
const ROLE_TABS = [
  { role: 'admin', label: 'Admin', icon: <FiShield /> },
  { role: 'president', label: 'President', icon: <FiUsers /> },
  { role: 'coordinator', label: 'Coordinator', icon: <FiUserCheck /> },
  { role: 'member', label: 'Student', icon: <FiUser /> },
];

const Login = () => {
  const [selectedRole, setSelectedRole] = useState('member');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthAPI.login({ ...form, role: selectedRole });
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(`/${res.data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Welcome back</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          Choose your role, then login to your ClubConnect account
        </p>

        {/* Role selector tabs - the "four possible logins" */}
        <div className="role-tabs">
          {ROLE_TABS.map((tab) => (
            <button
              type="button"
              key={tab.role}
              className={`role-tab ${selectedRole === tab.role ? 'role-tab-active' : ''}`}
              onClick={() => setSelectedRole(tab.role)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><FiMail /> Email</label>
            <input
              type="email" name="email" className="input" required
              placeholder="you@example.com" value={form.email} onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label className="form-label"><FiLock /> Password</label>
            <input
              type="password" name="password" className="input" required
              placeholder="••••••••" value={form.password} onChange={handleChange}
            />
          </div>

          <div className="flex-between" style={{ marginBottom: 20 }}>
            <span />
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : `Login as ${ROLE_TABS.find((t) => t.role === selectedRole).label}`}
          </button>
        </form>

        {selectedRole !== 'member' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {selectedRole === 'admin'
              ? 'The admin account is created by the platform - it cannot be self-registered.'
              : `${ROLE_TABS.find((t) => t.role === selectedRole).label} accounts are assigned by the admin, not self-registered.`}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--color-text-muted)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
