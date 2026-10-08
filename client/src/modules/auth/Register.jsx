import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiKey, FiEye, FiEyeOff, FiUserPlus, FiCompass, FiAward } from 'react-icons/fi';
import { useEffect } from 'react';
import { AuthAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import AuthBanner from '../../components/common/AuthBanner';
import PasswordRules from '../../components/common/PasswordRules';
import GoogleButton from '../../components/common/GoogleButton';
import { isStrongPassword } from '../../utils/password';

const FEATURES = [
  { icon: <FiUserPlus />, text: 'Join as many clubs as you like, all from one account' },
  { icon: <FiCompass />, text: 'Discover events happening across campus' },
  { icon: <FiAward />, text: 'Track your own participation history over time' },
];

// Step 1: college email is checked against the admin's list, then a 6-digit OTP is emailed.
// Step 2: enter the OTP and choose a password. The rest of the profile is completed after login.
const Register = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fixedMode, setFixedMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { AuthAPI.config().then((r) => setFixedMode(r.data.otpMode === 'fixed')).catch(() => {}); }, []);

  const sendCode = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const check = await AuthAPI.checkEmail(email);
      if (check.data.status === 'registered') {
        toast.error('You already have an account - please log in');
        return;
      }
      if (check.data.status === 'not_allowed') {
        toast.error('This email is not in the college list. Contact your admin.');
        return;
      }
      await AuthAPI.sendOtp(email);
      toast.success(fixedMode ? 'Enter the verification code to continue' : 'Code sent! Check your college inbox.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the code');
    } finally {
      setLoading(false);
    }
  };

  const register = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) { toast.error('Password does not meet all the rules'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await AuthAPI.register({ email, otp: form.otp, password: form.password, requestedRole: 'member' });
      login(res.data.token, res.data.user);
      toast.success('Account created! Let\'s finish your profile.');
      navigate('/complete-profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await AuthAPI.googleLogin(credential);
      login(res.data.token, res.data.user);
      navigate(res.data.user.profileComplete ? `/${res.data.user.role}` : '/complete-profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  return (
    <div className="auth-page">
      <AuthBanner
        badge="Welcome to ClubConnect"
        title="Join the community."
        description="Verify your college email to explore clubs, register for events, and stay in the loop on everything happening around campus."
        features={FEATURES}
      />

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Create account</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            {step === 1 ? 'Step 1 of 2 - verify your college email' : 'Step 2 of 2 - enter the code and set a password'}
          </p>

          {step === 1 ? (
            <form onSubmit={sendCode}>
              <div className="form-group">
                <label className="form-label"><FiMail /> College email</label>
                <input type="email" className="input" required placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Checking...' : 'Send verification code'}</button>
              <GoogleButton onCredential={googleLogin} />
            </form>
          ) : (
            <form onSubmit={register}>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                {fixedMode ? 'Enter the verification code for ' : 'We sent a 6-digit code to '}<strong style={{ color: 'var(--color-text)' }}>{email}</strong>.{' '}
                <button type="button" className="link-btn" onClick={() => setStep(1)}>Change</button>
              </p>
              <div className="form-group">
                <label className="form-label"><FiKey /> Verification code</label>
                <input className="input otp-input" required inputMode="numeric" pattern="\d{6}" maxLength={6} placeholder="------" value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiLock /> Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showPw ? 'text' : 'password'} className="input" required style={{ width: '100%', paddingRight: '2.5rem' }}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="eye-btn" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility">
                    {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
                <PasswordRules value={form.password} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiLock /> Confirm password</label>
                <input type={showPw ? 'text' : 'password'} className="input" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
              <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.85rem' }}>
                {fixedMode ? 'Verification is in simple-code mode (no email sent).' : <>Didn't get it? <button type="button" className="link-btn" onClick={sendCode} disabled={loading}>Resend code</button></>}
              </p>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--color-text-muted)' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Login</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            President and coordinator accounts are assigned by the admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
