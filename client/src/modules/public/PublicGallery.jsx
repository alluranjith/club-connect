import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GalleryAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const GENERAL = 'none'; // photos not tied to a club

// Public gallery sorted by club: pick a club chip to see only its photos, or "All"
// to see every club's photos grouped under its name. The choice lives in the URL (?club=).
const PublicGallery = () => {
  const [params, setParams] = useSearchParams();
  const selected = params.get('club') || 'all';
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    GalleryAPI.getAll().then((res) => setImages(res.data.images)).finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    images.forEach((img) => {
      const key = img.club?._id || GENERAL;
      if (!map.has(key)) map.set(key, { key, name: img.club?.name || 'General', items: [] });
      map.get(key).items.push(img);
    });
    // clubs alphabetically, General last
    return [...map.values()].sort((a, b) => (a.key === GENERAL) - (b.key === GENERAL) || a.name.localeCompare(b.name));
  }, [images]);

  const choose = (key) => (key === 'all' ? setParams({}) : setParams({ club: key }));
  const shownGroups = selected === 'all' ? groups : groups.filter((g) => g.key === selected);

  if (loading) return <Loader fullscreen />;

  return (
    <div className="page container">
      {images.length === 0 ? (
        <EmptyState title="No photos yet" subtitle="Photos posted by admins, presidents and coordinators will show up here." />
      ) : (
        <>
          <div className="chip-row" style={{ marginBottom: 28 }}>
            <button className={`chip ${selected === 'all' ? 'on' : ''}`} onClick={() => choose('all')}>All ({images.length})</button>
            {groups.map((g) => (
              <button key={g.key} className={`chip ${selected === g.key ? 'on' : ''}`} onClick={() => choose(g.key)}>
                {g.name} ({g.items.length})
              </button>
            ))}
          </div>

          {shownGroups.length === 0 && <EmptyState title="No photos for this club yet" />}
          {shownGroups.map((g) => (
            <section key={g.key} style={{ marginBottom: 40 }} className="animate-fadeIn">
              {selected === 'all' && <h2 className="gallery-heading">{g.name}</h2>}
              <div className="gallery-grid">
                {g.items.map((img) => (
                  <div className="gallery-item" key={img._id} onClick={() => setActive(img)}>
                    <img src={img.imageUrl} alt={img.caption || 'Gallery'} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {active && (
        <Modal title={active.club?.name || 'Photo'} onClose={() => setActive(null)} width={640}>
          <img src={active.imageUrl} alt={active.caption} style={{ borderRadius: 0, marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-muted)' }}>{active.caption}</p>
        </Modal>
      )}
    </div>
  );
};

export default PublicGallery;
