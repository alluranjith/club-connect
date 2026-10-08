import { Link } from 'react-router-dom';
import SocialLinks from './SocialLinks';

// Full-screen-width club row. The club's uploaded poster (coverImage) is the background.
const ClubBand = ({ club }) => (
<div className="club-band-wrapper">
  <div
    className={`club-band ${club.coverImage ? '' : 'club-band-empty'}`}
    style={club.coverImage ? { backgroundImage: `url("${club.coverImage}")` } : undefined}
  >
    <div>
      {club.category && <span className="badge">{club.category}</span>}
      <h3>{club.name}</h3>
      <p>{club.description || 'No description provided yet.'}</p>
      {club.president !== undefined && (
        <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>President: {club.president?.name || 'Not yet assigned'}</p>
      )}
      <SocialLinks links={club.socialLinks} />
    </div>
    <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
      <Link to={`/clubs/${club._id}/team`} className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff', background: 'transparent' }}>Team</Link>
      <Link to={`/clubs/${club._id}`} className="btn btn-primary">View details</Link>
    </div>
  </div>
  </div>
);

export default ClubBand;
