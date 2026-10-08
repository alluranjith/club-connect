import { useState } from 'react';
import toast from 'react-hot-toast';
import { ClubAPI } from '../../api/endpoints';
import Modal from './Modal';

export const MIN_INTENT = 10;
export const MAX_INTENT = 300;

// One dialog for every "Request to join" button (club page AND student dashboard):
// the student explains briefly why they want to join; the club's leaders see it with the request.
const JoinRequestModal = ({ club, onClose, onSent }) => {
  const [intent, setIntent] = useState('');
  const [sending, setSending] = useState(false);
  const tooShort = intent.trim().length < MIN_INTENT;

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await ClubAPI.requestToJoin(club._id, { message: intent.trim() });
      toast.success('Join request sent! Await approval from the club.');
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send join request');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={`Join ${club.name}`} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Why do you want to join?</label>
          <textarea className="input" rows={4} required minLength={MIN_INTENT} maxLength={MAX_INTENT} autoFocus
            placeholder="A short note for the club's leaders - your interests, skills, what you hope to do..."
            value={intent} onChange={(e) => setIntent(e.target.value)} />
          <small style={{ color: tooShort ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            {intent.length}/{MAX_INTENT} characters{tooShort ? ` (minimum ${MIN_INTENT})` : ''}
          </small>
        </div>
        <p className="muted-sm">The club will see this message along with your name, photo, email, mobile and description.</p>
        <button className="btn btn-primary btn-block" disabled={sending || tooShort}>{sending ? 'Sending...' : 'Send request'}</button>
      </form>
    </Modal>
  );
};

export default JoinRequestModal;
