import { FiX } from 'react-icons/fi';

const Modal = ({ title, onClose, children, width }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: 18 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-text-muted)' }}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
