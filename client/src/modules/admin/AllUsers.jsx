import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AdminAPI } from '../../api/endpoints';
import Loader from '../../components/common/Loader';
import RoleBadge from '../../components/common/RoleBadge';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

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
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Club</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>{u.club?.name || '—'}</td>
                <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span></td>
                <td>
                  {u.role !== 'admin' && (
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(u)}>
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
    </div>
  );
};

export default AllUsers;
