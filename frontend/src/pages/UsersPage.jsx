import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['sales', 'support', 'admin'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.rbac_role === 'admin';
  const [users, setUsers]   = useState([]);
  const [error, setError]   = useState('');

  async function fetchUsers() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      setError('Failed to load users');
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleRoleChange(userId, role) {
    try {
      await api.put(`/users/${userId}/role`, { rbac_role: role });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Role update failed');
    }
  }

  async function handleErase(userId) {
    if (!window.confirm('This will permanently erase the personal data of this user. Continue?')) return;
    try {
      await api.delete(`/users/${userId}/erase`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Erase failed');
    }
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>User Management</h2>
      {error && <p style={styles.error}>{error}</p>}
      <div className="table-scroll">
      <table style={styles.table}>
        <thead>
          <tr>
            {['#', 'Full Name', 'Email', 'Role', 'Change Role', ...(isAdmin ? ['Actions'] : [])].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.user_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.td}>{u.user_id}</td>
              <td style={styles.td}>{u.full_name || '—'}</td>
              <td style={styles.td}>{u.user_email}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: ROLE_COLORS[u.rbac_role] || '#94a3b8' }}>
                  {u.rbac_role}
                </span>
              </td>
              <td style={styles.td}>
                <select
                  value={u.rbac_role}
                  onChange={e => handleRoleChange(u.user_id, e.target.value)}
                  style={styles.select}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              {isAdmin && (
                <td style={styles.td}>
                  <button onClick={() => handleErase(u.user_id)} style={styles.eraseBtn}>Erase Data</button>
                </td>
              )}
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={isAdmin ? 6 : 5} style={{ ...styles.td, textAlign:'center', color:'#94a3b8' }}>No users</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const ROLE_COLORS = { admin:'#7c3aed', sales:'#2563eb', support:'#059669' };

const styles = {
  page:    { padding:'24px' },
  heading: { marginBottom:'20px', color:'#1e293b' },
  error:   { background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px', fontSize:'0.85rem' },
  table:   { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  th:      { padding:'10px 14px', background:'#f1f5f9', textAlign:'left', borderBottom:'2px solid #e2e8f0', color:'#475569', fontSize:'0.85rem' },
  td:      { padding:'10px 14px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem' },
  rowEven: { background:'#fff' },
  rowOdd:  { background:'#f8fafc' },
  badge:   { color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.78rem', fontWeight:'600' },
  select:   { padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'0.85rem', cursor:'pointer' },
  eraseBtn: { background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', fontSize:'0.82rem', fontWeight:'600' },
};
