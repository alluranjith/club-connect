import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminAPI } from '../../api/endpoints';
import MemberDetailModal from '../../components/common/MemberDetailModal';
import Loader from '../../components/common/Loader';
import RoleBadge from '../../components/common/RoleBadge';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [detail, setDetail] = useState(null); // { person, memberships }
  const [q, setQ] = useState('');

  const openDetail = async (u) => {
    try {
      const res = await AdminAPI.userDetails(u._id);
      setDetail({ person: res.data.user, memberships: res.data.memberships });
    } catch (err) {
      toast.error('Could not load user details');
    }
  };

  const load = () => {
    setLoading(true);
    AdminAPI.users(roleFilter ? { role: roleFilter } : {}).then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [roleFilter]);

  const toggleStatus = async (user) => {
    try {
      await AdminAPI.setUserStatus(user._id, !user.isActive);
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 4 }}>All Users</h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>Every account registered on ClubConnect.</p>
        </div>
        <input className="input" style={{ width: 240 }} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ width: 200 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="president">President</option>
          <option value="coordinator">Coordinator</option>
          <option value="member">Member</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="table-scroll">
        <table className="table table-clickable">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Club</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())).map((u) => (
              <tr key={u._id} onClick={() => openDetail(u)}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>{u.club?.name || '—'}</td>
                <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={(e) => { e.stopPropagation(); toggleStatus(u); }}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      {detail && <MemberDetailModal person={detail.person} memberships={detail.memberships} onClose={() => setDetail(null)} />}
    </div>
  );
};

export default AllUsers;
