import { FiMail, FiPhone } from 'react-icons/fi';

// One role holder: photo, name, role title and contact details.
const TeamCard = ({ person }) => (
  <div className="team-card">
    <div className="team-photo">
      {person.image ? <img src={person.image} alt={person.name} /> : <span>{(person.name || '?')[0].toUpperCase()}</span>}
    </div>
    <div className="team-body">
      <span className="badge">{person.role}</span>
      <h4>{person.name}</h4>
      {person.email && <a href={`mailto:${person.email}`}><FiMail /> {person.email}</a>}
      {person.phone && <a href={`tel:${person.phone}`}><FiPhone /> {person.phone}</a>}
    </div>
  </div>
);

// Builds the full public roster: president, login coordinators, then president-managed team roles.
export const buildRoster = (club) => {
  const list = [];
  if (club.president) list.push({ key: 'president', name: club.president.name, role: 'President', email: club.president.email, image: club.president.avatar, order: -2 });
  (club.coordinators || []).forEach((c) => list.push({ key: c._id, name: c.name, role: 'Coordinator', email: c.email, image: c.avatar, order: -1 }));
  (club.team || []).forEach((t) => list.push({ key: t._id, name: t.name, role: t.role, email: t.email, phone: t.phone, image: t.image, order: t.order ?? 100 }));
  return list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
};

export default TeamCard;
