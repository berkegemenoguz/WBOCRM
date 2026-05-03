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
    <nav style={styles.nav}>
      <span style={styles.brand}>WBO CRM</span>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        {(role === 'sales' || role === 'admin') && (
          <Link to="/leads" style={styles.link}>Leads</Link>
        )}
        {(role === 'support' || role === 'admin') && (
          <Link to="/tickets" style={styles.link}>Tickets</Link>
        )}
        {role === 'admin' && (
          <Link to="/users" style={styles.link}>Users</Link>
        )}
      </div>
      <div style={styles.right}>
        <span style={styles.roleTag}>{role}</span>
        <button onClick={handleLogout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background:'#1e293b', color:'#fff' },
  brand:   { fontWeight:'bold', fontSize:'1.1rem' },
  links:   { display:'flex', gap:'20px' },
  link:    { color:'#94a3b8', textDecoration:'none', fontSize:'0.9rem' },
  right:   { display:'flex', alignItems:'center', gap:'12px' },
  roleTag: { background:'#334155', padding:'2px 8px', borderRadius:'4px', fontSize:'0.8rem' },
  btn:     { background:'#ef4444', color:'#fff', border:'none', borderRadius:'4px', padding:'4px 12px', cursor:'pointer', fontSize:'0.85rem' },
};
