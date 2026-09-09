import GalleryManager from '../../components/shared/GalleryManager';
import { useAuth } from '../../context/AuthContext';

const CoordinatorGallery = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  return <GalleryManager clubId={clubId} />;
};

export default CoordinatorGallery;
