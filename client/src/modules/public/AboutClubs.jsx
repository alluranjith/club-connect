import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { ClubAPI } from '../../api/endpoints';

const AboutClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ClubAPI.getAll().then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullscreen />;

  return (
    <div className="page container">
      <h1 className="section-title">About Our Clubs</h1>
      <p className="section-subtitle">A snapshot of every active club running on ClubConnect.</p>

      {clubs.length === 0 ? (
        <EmptyState title="No clubs yet" subtitle="Clubs created by the admin will appear here." />
      ) : (
        <div className="grid grid-3 stagger">
          {clubs.map((club) => (
            <div className="card" key={club._id}>
              {club.coverImage && (
                <img src={club.coverImage} alt={club.name} style={{ borderRadius: 10, height: 150, objectFit: 'cover', marginBottom: 12 }} />
              )}
              <span className="badge badge-president">{club.category}</span>
              <h3 style={{ marginTop: 10 }}>{club.name}</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', minHeight: 40 }}>
                {club.description || 'No description provided yet.'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                President: {club.president?.name || 'Not yet assigned'}
              </p>
              <Link to={`/clubs/${club._id}`} className="btn btn-outline btn-sm" style={{ marginTop: 10 }}>View details</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AboutClubs;
