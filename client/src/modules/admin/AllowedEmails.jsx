import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiPlus, FiSearch, FiFileText } from 'react-icons/fi';
import { AdminAPI } from '../../api/endpoints';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';

// Admin uploads the college's student email list (CSV / Excel). Only these emails can register
// (OTP) or use Google sign-in.
const AllowedEmails = () => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, allTotal: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [single, setSingle] = useState({ email: '', name: '' });
  const [toDelete, setToDelete] = useState(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const load = () => {
    setLoading(true);
    AdminAPI.allowedEmails({ page, q }).then((res) => setData(res.data)).finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [page, q]);

  const doUpload = async () => {
    setConfirmReplace(false);
    setUploading(true);
    try {
      const res = await AdminAPI.importAllowedEmails(file, mode);
      setResult(res.data);
      toast.success(`${res.data.found} emails processed`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setPage(1);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onUpload = () => {
    if (!file) { toast.error('Choose a CSV or Excel file first'); return; }
    if (mode === 'replace') setConfirmReplace(true);
    else doUpload();
  };

  const addSingle = async (e) => {
    e.preventDefault();
    try {
      await AdminAPI.addAllowedEmail(single);
      toast.success('Email added');
      setSingle({ email: '', name: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add email');
    }
  };

  const remove = async () => {
    try {
      await AdminAPI.deleteAllowedEmail(toDelete._id);
      toast.success('Removed from the list');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error('Could not remove email');
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="section-title">College emails</h1>
      <p className="section-subtitle">
        Only emails on this list can create an account (with an OTP) or sign in with Google. {data.allTotal} email{data.allTotal === 1 ? '' : 's'} on the list.
      </p>

      <div className="grid grid-2" style={{ alignItems: 'start', marginBottom: 32 }}>
        <div className="card">
          <h4><FiUpload /> Upload CSV / Excel</h4>
          <p className="muted-sm">Use a column named <strong>Email</strong> (a <strong>Name</strong> column is optional). Files without a header also work if one column holds the emails. Max 5 MB.</p>
          <label className="dropzone">
            <FiFileText size={22} />
            <span>{file ? file.name : 'Click to choose .csv, .xlsx or .xls'}</span>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
          <div className="chip-row" style={{ margin: '14px 0' }}>
            <button type="button" className={`chip ${mode === 'append' ? 'on' : ''}`} onClick={() => setMode('append')}>Add to existing list</button>
            <button type="button" className={`chip ${mode === 'replace' ? 'on' : ''}`} onClick={() => setMode('replace')}>Replace whole list</button>
          </div>
          <button className="btn btn-primary" onClick={onUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload list'}</button>
          {result && (
            <div className="upload-result">
              <strong>{result.found}</strong> valid emails found - <strong>{result.added}</strong> new, {result.alreadyPresent} already on the list
              {result.invalid > 0 && <>, <strong>{result.invalid}</strong> invalid skipped</>}. List now has <strong>{result.total}</strong>.
            </div>
          )}
        </div>

        <form className="card" onSubmit={addSingle}>
          <h4><FiPlus /> Add one email</h4>
          <div className="form-group"><label className="form-label">College email</label>
            <input className="input" type="email" required value={single.email} onChange={(e) => setSingle({ ...single, email: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Name (optional)</label>
            <input className="input" maxLength={80} value={single.name} onChange={(e) => setSingle({ ...single, name: e.target.value })} /></div>
          <button className="btn btn-outline">Add email</button>
        </form>
      </div>

      <div className="flex-between" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ margin: 0 }}>Email list</h3>
        <div className="search-box"><FiSearch /><input placeholder="Search email or name" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} /></div>
      </div>

      {loading ? <Loader /> : data.items.length === 0 ? (
        <EmptyState title={q ? 'No matches' : 'The list is empty'} subtitle={q ? 'Try a different search.' : 'Until you upload emails, nobody can register.'} />
      ) : (
        <>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Email</th><th>Name</th><th>Account</th><th></th></tr></thead>
              <tbody>
                {data.items.map((i) => (
                  <tr key={i._id}>
                    <td>{i.email}</td>
                    <td>{i.name || '-'}</td>
                    <td><span className={`badge ${i.registered ? 'badge-success' : 'badge-muted'}`}>{i.registered ? 'Registered' : 'Not yet'}</span></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => setToDelete(i)}><FiTrash2 /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-sm" style={{ marginTop: 16, alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span className="muted-sm">Page {data.page} of {data.pages} · {data.total} shown</span>
            <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}

      {toDelete && <ConfirmDialog title="Remove email?" message={`${toDelete.email} will no longer be able to register. An existing account is not deleted.`} confirmLabel="Remove" onConfirm={remove} onClose={() => setToDelete(null)} />}
      {confirmReplace && <ConfirmDialog title="Replace the whole list?" message="Every email currently on the list will be removed and replaced by this file. Existing accounts are not deleted." confirmLabel="Replace list" onConfirm={doUpload} onClose={() => setConfirmReplace(false)} />}
    </div>
  );
};

export default AllowedEmails;
