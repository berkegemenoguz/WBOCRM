import { useEffect, useState } from 'react';
import api from '../services/api';
import TicketForm from '../components/TicketForm';

const STATUS_COLORS = { Open:'#ef4444', 'In Progress':'#f59e0b', Resolved:'#10b981' };
const PRIORITY_COLORS = { Low:'#94a3b8', Medium:'#f59e0b', High:'#ef4444' };

export default function TicketPage() {
  const [tickets, setTickets]   = useState([]);
  const [leads, setLeads]       = useState([]);
  const [editing, setEditing]   = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');

  async function fetchAll() {
    try {
      const [t, l] = await Promise.all([api.get('/tickets'), api.get('/leads').catch(() => ({ data: [] }))]);
      setTickets(t.data);
      setLeads(l.data);
    } catch {
      setError('Failed to load tickets');
    }
  }

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate(form) {
    try {
      await api.post('/tickets', form);
      setCreating(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  }

  async function handleUpdate(form) {
    try {
      await api.put(`/tickets/${editing.ticket_id}`, form);
      setEditing(null);
      fetchAll();
    } catch (err) {
      const code = err.response?.data?.error;
      if (code === 'CONFLICT') {
        setError('Conflict: ticket was modified by another user. Please reload and try again.');
      } else {
        setError(err.response?.data?.message || 'Update failed');
      }
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      fetchAll();
    } catch {
      setError('Delete failed');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Support Tickets</h2>
        <button onClick={() => { setCreating(true); setEditing(null); }} style={styles.addBtn}>+ New Ticket</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {creating && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Ticket</h3>
          <TicketForm leads={leads} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editing && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Edit Ticket</h3>
          <TicketForm initial={editing} leads={leads} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="table-scroll">
      <table style={styles.table}>
        <thead>
          <tr>
            {['#', 'Description', 'Priority', 'Status', 'Lead', 'Actions'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, i) => (
            <tr key={t.ticket_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.td}>{t.ticket_id}</td>
              <td style={{ ...styles.td, maxWidth:'260px' }}>{t.description}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: PRIORITY_COLORS[t.priority_level] || '#94a3b8' }}>
                  {t.priority_level}
                </span>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: STATUS_COLORS[t.status] || '#94a3b8' }}>
                  {t.status}
                </span>
              </td>
              <td style={styles.td}>{t.lead_id}</td>
              <td style={styles.td}>
                <button onClick={() => { setEditing(t); setCreating(false); }} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(t.ticket_id)} style={styles.delBtn}>Delete</button>
              </td>
            </tr>
          ))}
          {tickets.length === 0 && (
            <tr><td colSpan={6} style={{ ...styles.td, textAlign:'center', color:'#94a3b8' }}>No tickets yet</td></tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const styles = {
  page:     { padding:'24px' },
  header:   { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' },
  heading:  { margin:0, color:'#1e293b' },
  addBtn:   { background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 16px', cursor:'pointer' },
  error:    { background:'#fee2e2', color:'#b91c1c', padding:'8px 12px', borderRadius:'6px', marginBottom:'12px', fontSize:'0.85rem' },
  formCard: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', marginBottom:'20px' },
  formTitle:{ margin:'0', padding:'16px 16px 0', color:'#1e293b' },
  table:    { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  th:       { padding:'10px 14px', background:'#f1f5f9', textAlign:'left', borderBottom:'2px solid #e2e8f0', color:'#475569', fontSize:'0.85rem' },
  td:       { padding:'10px 14px', borderBottom:'1px solid #f1f5f9', fontSize:'0.9rem' },
  rowEven:  { background:'#fff' },
  rowOdd:   { background:'#f8fafc' },
  badge:    { color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.78rem', fontWeight:'600' },
  editBtn:  { background:'#e0f2fe', color:'#0369a1', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', marginRight:'6px', fontSize:'0.82rem' },
  delBtn:   { background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', fontSize:'0.82rem' },
};
