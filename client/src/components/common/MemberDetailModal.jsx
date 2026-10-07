import { FiMail, FiPhone, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import Modal from './Modal';

const Row = ({ icon, label, children }) => (
  <div className="detail-row">
    <span className="detail-label">{icon} {label}</span>
    <span>{children}</span>
  </div>
);

// Full profile of a member / applicant. `intent` = what they wrote when asking to join.
// `memberships` (admin view) = every club they belong to.
const MemberDetailModal = ({ person, onClose, memberships }) => (
  <Modal title="Member details" onClose={onClose} width={520}>
    <div className="detail-head">
      <div className="sidebar-avatar" style={{ width: 84, height: 84, fontSize: '2rem' }}>
        {person.avatar ? <img src={person.avatar} alt={person.name} /> : (person.name || '?')[0].toUpperCase()}
      </div>
      <div>
        <h3 style={{ margin: 0 }}>{person.name}</h3>
        {person.role && <span className="badge" style={{ marginTop: 6 }}>{person.role}</span>}
      </div>
    </div>

    <Row icon={<FiMail />} label="Email"><a href={`mailto:${person.email}`}>{person.email}</a></Row>
    <Row icon={<FiPhone />} label="Mobile">{person.phone ? <a href={`tel:${person.phone}`}>{person.phone}</a> : <em>Not provided</em>}</Row>
    {person.joinedAt && <Row icon={<FiCalendar />} label="Joined club">{new Date(person.joinedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</Row>}
    {person.createdAt && <Row icon={<FiCalendar />} label="On ClubConnect since">{new Date(person.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</Row>}

    {person.intent && (
      <div className="detail-quote">
        <span className="detail-label"><FiMessageSquare /> Why they joined</span>
        <p>{person.intent}</p>
      </div>
    )}
    <div className="detail-quote">
      <span className="detail-label">About</span>
      <p>{person.bio || <em style={{ color: 'var(--color-text-muted)' }}>No description added.</em>}</p>
    </div>

    {memberships && (
      <div className="detail-quote">
        <span className="detail-label">Clubs ({memberships.length})</span>
        {memberships.length === 0 ? <p><em style={{ color: 'var(--color-text-muted)' }}>Not a member of any club.</em></p> : memberships.map((m) => (
          <p key={m.club._id} style={{ margin: '6px 0' }}>
            <strong>{m.club.name}</strong>
            {m.joinedAt && <span style={{ color: 'var(--color-text-muted)' }}> · since {new Date(m.joinedAt).toLocaleDateString()}</span>}
            {m.intent && <><br /><span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>"{m.intent}"</span></>}
          </p>
        ))}
      </div>
    )}
  </Modal>
);

export default MemberDetailModal;
