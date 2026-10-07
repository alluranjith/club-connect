import { useEffect, useRef, useState } from 'react';
import { AuthAPI } from '../../api/endpoints';

let scriptPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

// "Continue with Google". The server decides whether the email is a college email;
// the button only hands over Google's signed credential. Hidden if the server has no GOOGLE_CLIENT_ID.
const GoogleButton = ({ onCredential }) => {
  const box = useRef(null);
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    AuthAPI.config().then((res) => setClientId(res.data.googleClientId)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId || !box.current) return;
    loadGoogleScript().then(() => {
      window.google.accounts.id.initialize({ client_id: clientId, callback: (r) => onCredential(r.credential) });
      window.google.accounts.id.renderButton(box.current, {
        theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: 320,
      });
    }).catch(() => {});
    // eslint-disable-next-line
  }, [clientId]);

  if (!clientId) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="or-divider"><span>or</span></div>
      <div ref={box} style={{ display: 'flex', justifyContent: 'center' }} />
      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
        College Google accounts only
      </p>
    </div>
  );
};

export default GoogleButton;
