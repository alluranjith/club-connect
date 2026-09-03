import { useEffect, useState } from 'react';
import { GalleryAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const PublicGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    GalleryAPI.getAll().then((res) => setImages(res.data.images)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader fullscreen />;

  return (
    <div className="page container">
      <h1 className="section-title">Gallery</h1>
      <p className="section-subtitle">Moments from events and clubs across the platform.</p>

      {images.length === 0 ? (
        <EmptyState title="No photos yet" subtitle="Photos posted by admins, presidents and coordinators will show up here." />
      ) : (
        <div className="gallery-grid animate-fadeIn">
          {images.map((img) => (
            <div className="gallery-item" key={img._id} onClick={() => setActive(img)}>
              <img src={img.imageUrl} alt={img.caption || 'Gallery'} />
            </div>
          ))}
        </div>
      )}

      {active && (
        <Modal title={active.club?.name || 'Photo'} onClose={() => setActive(null)} width={640}>
          <img src={active.imageUrl} alt={active.caption} style={{ borderRadius: 10, marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>{active.caption}</p>
        </Modal>
      )}
    </div>
  );
};

export default PublicGallery;
