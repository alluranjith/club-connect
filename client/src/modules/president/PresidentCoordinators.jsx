import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUserX, FiEdit2, FiTrash2, FiPlus, FiExternalLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { ClubAPI } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';

const ROLE_SUGGESTIONS = ['Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Technical Lead', 'Design Head', 'Content Head', 'Media Head', 'PR & Outreach', 'Events Head', 'Sponsorship Head', 'Logistics Head', 'Social Media Manager', 'Event Coordinator', 'Volunteer Lead'];
const EMPTY_MEMBER = { email: '', role: '', order: 100, showEmail: true, showPhone: false };

const PresidentCoordinators = () => {
  const { user } = useAuth();
  const clubId = user?.club?._id || user?.club;
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [toRemove, setToRemove] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [memberForm, setMemberForm] = useState(null); // null = closed, else { _id?, ...fields }
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [team, setTeam] = useState([]);
  const [lookup, setLookup] = useState(null); // result of the email lookup in the add form

  const load = () => {
    if (!clubId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([ClubAPI.getOne(clubId), ClubAPI.getTeam(clubId)])
      .then(([c, t]) => { setClub(c.data.club); setTeam(t.data.team); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [clubId]);

  // As the president types an email, look the person up (debounced) and preview who it is
  useEffect(() => {
    if (!memberForm || memberForm._id) return undefined;
    const email = memberForm.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setLookup(null); return undefined; }
    let cancelled = false;
    setLookup({ state: 'loading' });
    const t = setTimeout(() => {
      ClubAPI.lookupTeamUser(clubId, email)
        .then((res) => !cancelled && setLookup({ state: 'found', ...res.data }))
        .catch((err) => !cancelled && setLookup({ state: 'error', message: err.response?.data?.message || 'User not found' }));
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [memberForm?.email, memberForm?._id, clubId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ClubAPI.addCoordinator(clubId, { userEmail: email });
      toast.success('Coordinator assigned');
      setShowAdd(false);
      setEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign coordinator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    try {
      await ClubAPI.removeCoordinator(clubId, toRemove._id);
      toast.success('Coordinator removed');
      setToRemove(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove coordinator');
    }
  };

  const closeMemberForm = () => { setMemberForm(null); setLookup(null); };

  const saveMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { _id, email, role, order, showEmail, showPhone } = memberForm;
      if (_id) await ClubAPI.updateTeamMember(clubId, _id, { role, order, showEmail, showPhone });
      else await ClubAPI.addTeamMember(clubId, { email, role, order, showEmail, showPhone });
      toast.success(_id ? 'Role updated' : 'Role assigned');
      closeMemberForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async () => {
    try {
      await ClubAPI.removeTeamMember(clubId, memberToRemove._id);
      toast.success('Role holder removed');
      setMemberToRemove(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove role holder');
    }
  };

  if (!clubId) return <EmptyState title="No club assigned" />;
  if (loading) return <Loader />;

  return (
    <div className="animate-fadeIn">
      {/* ---------- Team & roles (no login needed) ---------- */}
      <div className="flex-between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>Team &amp; roles</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Assign roles to your club members by email. Their name, photo and contact details are fetched from their own profile and shown on the public club team page.
          </p>
        </div>
        <div className="flex gap-sm">
          <Link to={`/clubs/${clubId}/team`} className="btn btn-outline"><FiExternalLink /> Public page</Link>
          <button className="btn btn-primary" onClick={() => setMemberForm({ ...EMPTY_MEMBER })}><FiPlus /> Assign role</button>
        </div>
      </div>

      {team.length ? (
        <div className="team-admin-list stagger">
          {[...team].sort((x, y) => (x.order ?? 100) - (y.order ?? 100) || x.name.localeCompare(y.name)).map((m) => (
            <div key={m._id} className="card team-admin-row">
              <div className="sidebar-avatar" style={{ width: 48, height: 48 }}>
                {m.avatar ? <img src={m.avatar} alt={m.name} /> : m.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{m.name} <span className="badge" style={{ marginLeft: 8 }}>{m.role}</span></p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {m.email}{m.phone ? ` · ${m.phone}` : ''}
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Public: {[m.showEmail && 'email', m.showPhone && 'mobile'].filter(Boolean).join(' + ') || 'name & photo only'}
                  {!m.linked && ' · typed-in entry (remove and re-add by email to link the account)'}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setMemberForm({ ...m })}><FiEdit2 /></button>
              <button className="btn btn-danger btn-sm" onClick={() => setMemberToRemove(m)}><FiTrash2 /></button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No roles assigned yet" subtitle="Add your secretary, treasurer, leads and other office bearers by email." />
      )}

      <hr style={{ margin: '48px 0 32px', border: 0, borderTop: '1px solid var(--color-border)' }} />

      {/* ---------- Coordinators with logins ---------- */}
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Coordinators (with login)</h2>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>Assign coordinators to help run {club?.name}, or remove them.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><FiUserPlus /> Assign Coordinator</button>
      </div>

      {club?.coordinators?.length ? (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {club.coordinators.map((c) => (
            <div key={c._id} className="card flex-between">
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{c.name}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{c.email}</p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => setToRemove(c)}><FiUserX /> Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No coordinators yet" subtitle="Assign a registered student's email to make them a coordinator for your club." />
      )}

      {showAdd && (
        <Modal title="Assign a coordinator" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">Registered user's email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Assigning...' : 'Assign Coordinator'}
            </button>
          </form>
        </Modal>
      )}

      {memberForm && (
        <Modal title={memberForm._id ? 'Edit role' : 'Assign a role'} onClose={closeMemberForm}>
          <form onSubmit={saveMember}>
            {memberForm._id ? (
              <div className="lookup-card">
                <span className="sidebar-avatar" style={{ width: 44, height: 44 }}>{memberForm.avatar ? <img src={memberForm.avatar} alt="" /> : memberForm.name[0].toUpperCase()}</span>
                <div><strong>{memberForm.name}</strong><p className="muted-sm">{memberForm.email}</p></div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Member's email</label>
                  <input className="input" type="email" required autoFocus placeholder="member@college.edu" value={memberForm.email}
                    onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })} />
                </div>
                {lookup?.state === 'loading' && <p className="muted-sm">Searching...</p>}
                {lookup?.state === 'error' && <div className="lookup-card lookup-bad"><FiAlertCircle /> <span>{lookup.message}</span></div>}
                {lookup?.state === 'found' && lookup.isMember && (
                  <div className="lookup-card lookup-ok">
                    <span className="sidebar-avatar" style={{ width: 44, height: 44 }}>{lookup.user.avatar ? <img src={lookup.user.avatar} alt="" /> : lookup.user.name[0].toUpperCase()}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{lookup.user.name}</strong> <FiCheckCircle />
                      <p className="muted-sm">{lookup.user.phone || 'No mobile on profile'}{lookup.roles.length ? ` · already: ${lookup.roles.join(', ')}` : ''}</p>
                    </div>
                  </div>
                )}
                {lookup?.state === 'found' && !lookup.isMember && (
                  <div className="lookup-card lookup-bad"><FiAlertCircle /> <span>{lookup.user.name} has an account but isn't a member of {club?.name} yet. They need to join (and be accepted) first.</span></div>
                )}
              </>
            )}

            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="input" required list="role-suggestions" placeholder="e.g. Treasurer" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} />
              <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Display order (lower shows first)</label>
              <input className="input" type="number" value={memberForm.order} onChange={(e) => setMemberForm({ ...memberForm, order: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Shown publicly with the role</label>
              <label className="check-row"><input type="checkbox" checked={memberForm.showEmail} onChange={(e) => setMemberForm({ ...memberForm, showEmail: e.target.checked })} /> Email address</label>
              <label className="check-row"><input type="checkbox" checked={memberForm.showPhone} onChange={(e) => setMemberForm({ ...memberForm, showPhone: e.target.checked })} /> Mobile number</label>
              <p className="muted-sm">Name and photo are always shown. Only turn on contact details if the person is fine with it.</p>
            </div>
            <button className="btn btn-primary btn-block" disabled={submitting || (!memberForm._id && !(lookup?.state === 'found' && lookup.isMember))}>
              {submitting ? 'Saving...' : memberForm._id ? 'Save changes' : 'Assign role'}
            </button>
          </form>
        </Modal>
      )}

      {memberToRemove && (
        <ConfirmDialog
          title="Remove role holder?"
          message={`${memberToRemove.name} (${memberToRemove.role}) will be removed from the public team page.`}
          confirmLabel="Remove"
          onConfirm={removeMember}
          onClose={() => setMemberToRemove(null)}
        />
      )}

      {toRemove && (
        <ConfirmDialog
          title="Remove coordinator?"
          message={`${toRemove.name} will lose coordinator access to ${club?.name}.`}
          confirmLabel="Remove"
          onConfirm={handleRemove}
          onClose={() => setToRemove(null)}
        />
      )}
    </div>
  );
};

export default PresidentCoordinators;
