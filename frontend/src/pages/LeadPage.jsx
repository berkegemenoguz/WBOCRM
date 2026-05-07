import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LeadForm from '../components/LeadForm';

const STAGE_COLORS = { New:'#6366f1', Contacted:'#3b82f6', Qualified:'#0ea5e9', Closed:'#10b981' };

export default function LeadPage() {
  const navigate = useNavigate();
  const [leads, setLeads]     = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError]     = useState('');

  async function fetchLeads() {
    try {
      const { data } = await api.get('/leads');
      setLeads(data);
    } catch {
      setError('Failed to load leads');
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  async function handleCreate(form) {
    try {
      await api.post('/leads', form);
      setCreating(false);
      fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed');
    }
  }

  async function handleUpdate(form) {
    try {
      await api.put(`/leads/${editing.lead_id}`, form);
      setEditing(null);
      fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      fetchLeads();
    } catch {
      setError('Delete failed');
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Leads</h2>
        <button onClick={() => { setCreating(true); setEditing(null); }} style={styles.addBtn}>+ New Lead</button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {creating && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>New Lead</h3>
          <LeadForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {editing && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Edit Lead</h3>
          <LeadForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="table-scroll">
      <table style={styles.table}>
        <thead>
          <tr>
            {['Name', 'Email', 'Stage', 'Score', 'Deal ($K)', 'Actions'].map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={l.lead_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.td}>{l.contact_name}</td>
              <td style={styles.td}>{l.email}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, background: STAGE_COLORS[l.pipeline_stage] || '#94a3b8' }}>
                  {l.pipeline_stage}
                </span>
              </td>
              <td style={{ ...styles.td, fontWeight:'bold' }}>{l.priority_score}</td>
              <td style={styles.td}>{Number(l.deal_value || 0).toLocaleString()}</td>
              <td style={styles.td}>
                <button onClick={() => navigate(`/leads/${l.lead_id}`)} style={styles.profileBtn}>Profile</button>
                <button onClick={() => { setEditing({ ...l, metrics: { calls: l.calls || 0, meetings: l.meetings || 0, budget: l.budget || 0, companySize: l.company_size || 'small', emailOpens: l.email_opens || 0 } }); setCreating(false); }} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(l.lead_id)} style={styles.delBtn}>Delete</button>
              </td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr><td colSpan={6} style={{ ...styles.td, textAlign:'center', color:'#94a3b8' }}>No leads yet</td></tr>
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
  profileBtn:{ background:'#f0fdf4', color:'#16a34a', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', marginRight:'6px', fontSize:'0.82rem' },
  editBtn:  { background:'#e0f2fe', color:'#0369a1', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', marginRight:'6px', fontSize:'0.82rem' },
  delBtn:   { background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:'4px', padding:'4px 10px', cursor:'pointer', fontSize:'0.82rem' },
};
