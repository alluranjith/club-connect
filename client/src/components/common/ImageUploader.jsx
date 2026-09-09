import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiX, FiImage } from 'react-icons/fi';
import { ImageAPI } from '../../api/endpoints';

// value: the current image URL (e.g. "/api/images/<id>") or '' if none
// onChange: (url) => void - called with the new URL after a successful upload, or '' on remove
const ImageUploader = ({ value, onChange, label = 'Image' }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const doUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await ImageAPI.upload(formData);
      onChange(res.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    doUpload(file);
  };

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    doUpload(file);
    e.target.value = ''; // allow re-selecting the same file later
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      {value ? (
        <div className="image-preview">
          <img src={value} alt="Preview" />
          <button type="button" className="image-preview-remove" onClick={() => onChange('')} aria-label="Remove image">
            <FiX />
          </button>
        </div>
      ) : (
        <div
          className={`image-dropzone ${dragging ? 'image-dropzone-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            hidden
            onChange={handlePick}
          />
          {uploading ? (
            <div className="spinner" style={{ width: 26, height: 26, borderWidth: 3 }} />
          ) : (
            <>
              <FiUploadCloud size={26} />
              <p style={{ margin: '8px 0 2px', fontWeight: 600 }}>Drag & drop an image here</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                or click to browse · JPG, PNG, GIF, WEBP up to 5MB
              </p>
            </>
          )}
        </div>
      )}
      {!value && !uploading && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
          <FiImage /> Images are stored securely in the database, not linked from external sites.
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
