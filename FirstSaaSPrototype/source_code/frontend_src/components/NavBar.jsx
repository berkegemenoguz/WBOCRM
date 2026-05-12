import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const role = user?.rbac_role;

  return (
    <nav className="nav">
      <span className="nav-brand">WBO CRM</span>
      <div className="nav-links">
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        {(role === 'sales' || role === 'admin') && (
          <Link to="/leads" className="nav-link">Leads</Link>
        )}
        {(role === 'support' || role === 'admin') && (
          <Link to="/tickets" className="nav-link">Tickets</Link>
        )}
        {role === 'admin' && (
          <Link to="/users" className="nav-link">Users</Link>
        )}
      </div>
      <div className="nav-right">
        <span style={styles.roleTag}>{role}</span>
        <button onClick={handleLogout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  roleTag: { background:'#334155', padding:'2px 8px', borderRadius:'4px', fontSize:'0.8rem', color:'#fff' },
  btn:     { background:'#ef4444', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 12px', cursor:'pointer', fontSize:'0.85rem' },
};
