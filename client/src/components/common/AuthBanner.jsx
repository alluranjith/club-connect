import { FiUsers } from 'react-icons/fi';

// A reusable "welcome banner" visual panel shown alongside the Login/Register
// forms. Pure CSS animated gradient blobs - lightweight, no extra dependencies.
const AuthBanner = ({ badge, title, description, features = [] }) => (
  <div className="auth-visual-panel">
    <span className="auth-blob auth-blob-1" />
    <span className="auth-blob auth-blob-2" />
    <span className="auth-blob auth-blob-3" />
    <div className="auth-visual-content">
      <span className="auth-welcome-badge">{badge}</span>
      <div className="auth-visual-mark"><FiUsers /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {features.length > 0 && (
        <div className="auth-feature-list">
          {features.map((f) => (
            <div className="auth-feature-item" key={f.text}>
              <span className="icon-badge">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default AuthBanner;
