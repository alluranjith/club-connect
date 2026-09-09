import EventManager from '../../components/shared/EventManager';
import { useAuth } from '../../context/AuthContext';

const PresidentEvents = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  return <EventManager clubId={clubId} />;
};

export default PresidentEvents;
