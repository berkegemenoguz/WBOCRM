import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>WBO CRM</h1>
        <p style={styles.sub}>Sign in to your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={submit} style={styles.form}>
          <input name="email" type="email" placeholder="Email" value={form.email}
            onChange={handle} required style={styles.input} />
          <input name="password" type="password" placeholder="Password" value={form.password}
            onChange={handle} required style={styles.input} />
          <button type="submit" style={styles.btn}>Sign In</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' },
  card:    { background:'#fff', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', width:'360px' },
  title:   { margin:'0 0 4px', fontSize:'1.8rem', color:'#1e293b' },
  sub:     { margin:'0 0 24px', color:'#64748b', fontSize:'0.9rem' },
  error:   { background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:'6px', fontSize:'0.85rem', marginBottom:'12px' },
  form:    { display:'flex', flexDirection:'column', gap:'12px' },
  input:   { padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'0.95rem' },
  btn:     { background:'#3b82f6', color:'#fff', border:'none', borderRadius:'8px', padding:'10px', cursor:'pointer', fontSize:'0.95rem', fontWeight:'600' },
};
