import { useEffect, useState } from 'react';
import { FiUsers } from 'react-icons/fi';

const SESSION_KEY = 'cc_intro_shown';

// A brief brand splash on first load of a session - the mark scales/fades in,
// title and tagline follow, then the whole overlay slides up and away.
// Mirrors the "app intro" pattern seen in apps like Swiggy/Zomato, built with
// pure CSS animation (no 3D libraries) to keep it lightweight and dependable.
const IntroAnimation = () => {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const exitTimer = setTimeout(() => setExiting(true), 1600);
    const removeTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 2150);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`intro-overlay ${exiting ? 'intro-overlay-exit' : ''}`}>
      <span className="intro-blob intro-blob-1" />
      <span className="intro-blob intro-blob-2" />
      <div className="intro-content">
        <div className="intro-mark"><FiUsers /></div>
        <h1 className="intro-title">ClubConnect</h1>
        <p className="intro-tagline">Every club. One connected platform.</p>
        <div className="intro-loader"><span /></div>
      </div>
    </div>
  );
};

export default IntroAnimation;
