import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import { AuthAPI } from '../../api/endpoints';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await AuthAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: 'center' }} className="animate-popIn">
            <FiCheckCircle size={48} color="var(--color-success)" />
            <h2 className="section-title" style={{ marginTop: 14 }}>Check your email</h2>
            <p className="section-subtitle">
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">Back to login</Link>
          </div>
        ) : (
          <>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Forgot password</h2>
            <p className="section-subtitle" style={{ textAlign: 'center' }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label"><FiMail /> Email</label>
                <input
                  type="email" className="input" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 22, color: 'var(--color-text-muted)' }}>
              Remembered it? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
