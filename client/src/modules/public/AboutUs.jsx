import { FiTarget, FiHeart, FiZap } from 'react-icons/fi';

const VALUES = [
  { icon: <FiTarget />, title: 'Our Mission', text: 'To give every campus club the tools to organize, grow, and celebrate their community without friction.' },
  { icon: <FiHeart />, title: 'Built for people', text: 'From the first-time member to the seasoned club president, every role has a dashboard designed around what they actually need to do.' },
  { icon: <FiZap />, title: 'Fast & simple', text: 'Join a club, register for an event, or check the gallery — all in a few taps, on any device.' },
];

const AboutUs = () => (
  <div className="page container">
    <div className="hero animate-slideUp">
      <h1>About ClubConnect</h1>
      <p style={{ maxWidth: 600, margin: '14px auto 0', opacity: 0.92 }}>
        ClubConnect is a full campus-club management platform connecting admins, club presidents,
        coordinators, and members in one seamless experience.
      </p>
    </div>

    <div className="grid grid-3 stagger" style={{ marginTop: 50 }}>
      {VALUES.map((v) => (
        <div className="card" key={v.title}>
          <div style={{ fontSize: 28, color: 'var(--color-primary)', marginBottom: 10 }}>{v.icon}</div>
          <h4>{v.title}</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{v.text}</p>
        </div>
      ))}
    </div>

    <section style={{ marginTop: 60 }}>
      <h2 className="section-title">How roles work</h2>
      <div className="grid grid-4 stagger">
        <div className="card">
          <span className="badge badge-admin">Admin</span>
          <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            One super-admin oversees the whole platform — creates/disbands clubs, manages coordinators,
            posts platform-wide news, and tracks every event.
          </p>
        </div>
        <div className="card">
          <span className="badge badge-president">President</span>
          <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Leads a single club — approves new members, posts events and updates, curates the gallery.
          </p>
        </div>
        <div className="card">
          <span className="badge badge-coordinator">Coordinator</span>
          <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Supports club operations — takes attendance at events and keeps club info current.
          </p>
        </div>
        <div className="card">
          <span className="badge badge-member">Member</span>
          <p style={{ marginTop: 10, fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
            Requests to join clubs, joins events, and keeps track of their own participation history.
          </p>
        </div>
      </div>
    </section>
  </div>
);

export default AboutUs;
