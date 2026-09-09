import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { GalleryAPI } from '../../api/endpoints';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import Loader from '../common/Loader';
import ImageUploader from '../common/ImageUploader';

// clubId = null means admin posting to the general/platform gallery
const GalleryManager = ({ clubId }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ imageUrl: '', caption: '' });
  const [toDelete, setToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    GalleryAPI.getAll(clubId ? { club: clubId } : {})
      .then((res) => setImages(res.data.images))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error('Please upload an image first');
      return;
    }
    setSubmitting(true);
    try {
      await GalleryAPI.add({ ...form, club: clubId });
      toast.success('Image posted to gallery');
      setShowAdd(false);
      setForm({ imageUrl: '', caption: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await GalleryAPI.remove(toDelete._id);
      toast.success('Image removed');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove image');
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Gallery</h2>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><FiPlus /> Add Image</button>
      </div>

      {loading ? <Loader /> : images.length === 0 ? (
        <EmptyState title="No images yet" subtitle="Post the first photo to get this gallery started." />
      ) : (
        <div className="gallery-grid">
          {images.map((img) => (
            <div className="gallery-item animate-popIn" key={img._id} style={{ position: 'relative' }}>
              <img src={img.imageUrl} alt={img.caption} />
              <button
                className="btn btn-danger btn-sm"
                style={{ position: 'absolute', top: 8, right: 8 }}
                onClick={() => setToDelete(img)}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add gallery image" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <ImageUploader
              label="Photo"
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
            />
            <div className="form-group">
              <label className="form-label">Caption (optional)</label>
              <input
                className="input" placeholder="A short caption"
                value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting || !form.imageUrl}>
              {submitting ? 'Posting...' : 'Post to gallery'}
            </button>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Remove image?"
          message="This image will be permanently removed from the gallery."
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
};

export default GalleryManager;
