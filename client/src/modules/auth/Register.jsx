import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiLock, FiShield, FiUsers, FiUserCheck, FiInfo,
  FiUserPlus, FiAward, FiCompass, FiEye, FiEyeOff,
} from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import AuthBanner from '../../components/common/AuthBanner';

const ROLE_TABS = [
  { role: 'admin', label: 'Admin', icon: <FiShield /> },
  { role: 'president', label: 'President', icon: <FiUsers /> },
  { role: 'coordinator', label: 'Coordinator', icon: <FiUserCheck /> },
  { role: 'member', label: 'Student', icon: <FiUser /> },
];

const RESTRICTED_MESSAGE = {
  admin: 'The admin account is a single, platform-managed account seeded by the server. It cannot be created here.',
  president: 'President accounts are assigned by the admin to an existing club. Register as a Student first, then ask the admin to promote your account.',
  coordinator: 'Coordinator accounts are assigned by the admin or your club president. Register as a Student first, then ask them to promote your account.',
};

const FEATURES = [
  { icon: <FiUserPlus />, text: 'Join as many clubs as you like, all from one account' },
  { icon: <FiCompass />, text: 'Discover events happening across campus' },
  { icon: <FiAward />, text: 'Track your own participation history over time' },
];

const Register = () => {
  const [selectedRole, setSelectedRole] = useState('member');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
        requestedRole: 'member',
      });
      login(res.data.token, res.data.user);
      toast.success('Account created! Request to join a club anytime from your dashboard.');
      navigate('/member');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isRestricted = selectedRole !== 'member';

  return (
    <div className="auth-page">
      <AuthBanner
        badge="🎉 Welcome to ClubConnect"
        title="Join the community."
        description="Create your account to explore clubs, register for events, and stay in the loop on everything happening around campus."
        features={FEATURES}
      />

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Create account</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Choose the account type you're creating
          </p>

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

          {isRestricted ? (
            <div className="card animate-fadeIn" style={{ background: 'var(--color-surface-alt)', border: '1px dashed var(--color-border)' }}>
              <div className="flex gap-sm" style={{ alignItems: 'flex-start' }}>
                <FiInfo style={{ marginTop: 3, flexShrink: 0, color: 'var(--color-primary)' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  {RESTRICTED_MESSAGE[selectedRole]}
                </p>
              </div>
              <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => setSelectedRole('member')}>
                Register as Student instead
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label"><FiUser /> Full name</label>
                <input type="text" name="name" className="input" required placeholder="Jane Doe" value={form.name} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label"><FiMail /> Email</label>
                <input type="email" name="email" className="input" required placeholder="you@example.com" value={form.email} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label"><FiLock /> Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="input"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted, #6b7280)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label"><FiLock /> Confirm password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm"
                    className="input"
                    required
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={handleChange}
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted, #6b7280)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Student account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--color-text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;