import { useEffect, useState } from 'react';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ClubBand from '../../components/common/ClubBand';
import { ClubAPI } from '../../api/endpoints';

const AboutClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ClubAPI.getAll().then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullscreen />;

  return (
    <>
      {clubs.length === 0 ? (
        <div className="container section-pad">
          <EmptyState title="No clubs yet" subtitle="Clubs created by the admin will appear here." />
        </div>
      ) : (
        <div className="animate-fadeIn">
          {clubs.map((club) => <ClubBand key={club._id} club={club} />)}
        </div>
      )}
    </>
  );
};

export default AboutClubs;
