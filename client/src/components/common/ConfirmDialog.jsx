import Modal from './Modal';

const ConfirmDialog = ({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, onConfirm, onClose }) => (
  <Modal title={title} onClose={onClose} width={380}>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>{message}</p>
    <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
