import { useEffect, useState } from 'react';
import api from '../services/api';
import PriorityTable from '../components/PriorityTable';

export default function DashboardPage() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Failed to load dashboard'));
  }, []);

  if (error) return <p style={styles.error}>{error}</p>;
  if (!data)  return <p style={styles.loading}>Loading…</p>;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Dashboard</h2>
      <div style={styles.stats}>
        <StatCard label="Active Leads"  value={data.activeLeads} color="#3b82f6" />
        <StatCard label="Open Tickets"  value={data.openTickets} color="#f59e0b" />
      </div>
      <h3 style={styles.sub}>Top 5 Leads by Score</h3>
      <PriorityTable leads={data.top5} />
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <p style={styles.cardLabel}>{label}</p>
      <p style={{ ...styles.cardValue, color }}>{value}</p>
    </div>
  );
}

const styles = {
  page:      { padding:'24px' },
  heading:   { marginBottom:'20px', color:'#1e293b' },
  stats:     { display:'flex', gap:'16px', marginBottom:'28px' },
  card:      { background:'#fff', borderRadius:'10px', padding:'20px 28px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', minWidth:'160px' },
  cardLabel: { margin:'0 0 8px', color:'#64748b', fontSize:'0.85rem' },
  cardValue: { margin:0, fontSize:'2rem', fontWeight:'bold' },
  sub:       { marginBottom:'12px', color:'#374151' },
  error:     { padding:'16px', color:'#b91c1c' },
  loading:   { padding:'16px', color:'#64748b' },
};
