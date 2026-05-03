import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STAGES = ['New', 'Contacted', 'Qualified', 'Closed'];
const STAGE_COLORS = { New:'#6366f1', Contacted:'#3b82f6', Qualified:'#0ea5e9', Closed:'#10b981' };
const PRIORITY_COLORS = { Low:'#94a3b8', Medium:'#f59e0b', High:'#ef4444' };
const STATUS_COLORS   = { Open:'#ef4444', 'In Progress':'#f59e0b', Resolved:'#10b981' };

export default function LeadProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const role = user?.rbac_role;

  const [lead, setLead]       = useState(null);
  const [logs, setLogs]       = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users, setUsers]     = useState([]);
  const [note, setNote]       = useState('');
  const [error, setError]     = useState('');

  async function fetchAll() {
    try {
      const [lRes, logRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/leads/${id}/logs`),
      ]);
      setLead(lRes.data);
      setLogs(logRes.data);

      if (role === 'support' || role === 'admin') {
        const tRes = await api.get('/tickets');
        setTickets(tRes.data.filter(t => String(t.lead_id) === String(id)));
      }
      if (role === 'admin') {
        const uRes = await api.get('/users');
        setUsers(uRes.data.filter(u => u.rbac_role === 'sales'));
      }
    } catch {
      setError('Failed to load profile');
    }
  }

  useEffect(() => { fetchAll(); }, [id]);

  async function handleStageChange(e) {
    try {
      const updated = await api.put(`/leads/${id}`, { pipeline_stage: e.target.value });
      setLead(updated.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  }

  async function handleAssign(e) {
    try {
      const updated = await api.put(`/leads/${id}`, { user_id: Number(e.target.value) });
      setLead(updated.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await api.post(`/leads/${id}/logs`, { note_text: note });
      setNote('');
      const logRes = await api.get(`/leads/${id}/logs`);
      setLogs(logRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    }
  }

  if (error) return <div style={styles.page}><p style={styles.errorBanner}>{error}</p></div>;
  if (!lead) return <div style={styles.page}><p style={styles.loading}>Loading…</p></div>;

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/leads')} style={styles.back}>← Back to Leads</button>

      <div style={styles.layout}>

        {/* LEFT: Lead Static Info */}
        <div style={styles.card}>
          <h2 style={styles.name}>{lead.contact_name}</h2>
          <p style={styles.email}>{lead.email}</p>

          <div style={styles.row}>
            <span style={styles.fieldLabel}>Pipeline Stage</span>
            {role === 'sales' || role === 'admin' ? (
              <select value={lead.pipeline_stage} onChange={handleStageChange} style={styles.select}>
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            ) : (
              <span style={{ ...styles.badge, background: STAGE_COLORS[lead.pipeline_stage] || '#94a3b8' }}>
                {lead.pipeline_stage}
              </span>
            )}
          </div>

          <div style={styles.row}>
            <span style={styles.fieldLabel}>Priority Score</span>
            <span style={{ ...styles.scoreValue, color: scoreColor(lead.priority_score) }}>
              {lead.priority_score}
            </span>
          </div>

          <div style={styles.row}>
            <span style={styles.fieldLabel}>Deal Value</span>
            <span style={styles.fieldValue}>${Number(lead.deal_value || 0).toLocaleString()}K</span>
          </div>

          {lead.campaign_id && (
            <div style={styles.row}>
              <span style={styles.fieldLabel}>Campaign</span>
              <span style={styles.fieldValue}>{lead.campaign_id}</span>
            </div>
          )}

          {role === 'admin' && users.length > 0 && (
            <div style={styles.row}>
              <span style={styles.fieldLabel}>Assigned To</span>
              <select value={lead.user_id || ''} onChange={handleAssign} style={styles.select}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
              </select>
            </div>
          )}

          <div style={styles.row}>
            <span style={styles.fieldLabel}>Created</span>
            <span style={styles.fieldValue}>{new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* RIGHT: Logs + Tickets */}
        <div style={styles.rightPanel}>

          {/* Interaction Logs */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Interaction Log</h3>
            <div style={styles.timeline}>
              {logs.length === 0 && <p style={styles.empty}>No interactions yet.</p>}
              {[...logs].reverse().map(log => (
                <div key={log.log_id} style={styles.logEntry}>
                  <span style={styles.logDot} />
                  <div>
                    <p style={styles.logText}>{log.note_text}</p>
                    <p style={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            {(role === 'sales' || role === 'admin') && (
              <form onSubmit={handleAddNote} style={styles.noteForm}>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add interaction note…"
                  style={styles.noteInput}
                />
                <button type="submit" style={styles.noteBtn}>Add Note</button>
              </form>
            )}
          </div>

          {/* Linked Support Tickets */}
          {(role === 'support' || role === 'admin') && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Support Tickets</h3>
              {tickets.length === 0 && <p style={styles.empty}>No tickets linked to this lead.</p>}
              {tickets.map(t => (
                <div key={t.ticket_id} style={styles.ticketRow}>
                  <span style={styles.ticketDesc}>{t.description}</span>
                  <span style={{ ...styles.badge, background: PRIORITY_COLORS[t.priority_level] || '#94a3b8' }}>
                    {t.priority_level}
                  </span>
                  <span style={{ ...styles.badge, background: STATUS_COLORS[t.status] || '#94a3b8' }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

const styles = {
  page:         { padding:'24px', maxWidth:'1100px', margin:'0 auto' },
  back:         { background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.9rem', marginBottom:'16px', padding:0 },
  layout:       { display:'grid', gridTemplateColumns:'320px 1fr', gap:'24px', alignItems:'start' },
  card:         { background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  name:         { margin:'0 0 4px', color:'#1e293b', fontSize:'1.3rem' },
  email:        { margin:'0 0 20px', color:'#64748b', fontSize:'0.9rem' },
  row:          { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' },
  fieldLabel:   { fontSize:'0.82rem', color:'#64748b' },
  fieldValue:   { fontSize:'0.9rem', color:'#1e293b', fontWeight:'500' },
  scoreValue:   { fontSize:'1.2rem', fontWeight:'bold' },
  badge:        { color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600' },
  select:       { padding:'4px 8px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'0.85rem' },
  rightPanel:   { display:'flex', flexDirection:'column', gap:'20px' },
  section:      { background:'#fff', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle: { margin:'0 0 16px', color:'#1e293b', fontSize:'1rem' },
  timeline:     { display:'flex', flexDirection:'column', gap:'12px', marginBottom:'16px' },
  logEntry:     { display:'flex', gap:'12px', alignItems:'flex-start' },
  logDot:       { width:'10px', height:'10px', borderRadius:'50%', background:'#3b82f6', marginTop:'4px', flexShrink:0 },
  logText:      { margin:'0 0 2px', fontSize:'0.9rem', color:'#374151' },
  logTime:      { margin:0, fontSize:'0.75rem', color:'#94a3b8' },
  noteForm:     { display:'flex', gap:'8px' },
  noteInput:    { flex:1, padding:'8px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'0.9rem' },
  noteBtn:      { background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 14px', cursor:'pointer', fontSize:'0.85rem', whiteSpace:'nowrap' },
  ticketRow:    { display:'flex', alignItems:'center', gap:'8px', padding:'8px 0', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap' },
  ticketDesc:   { flex:1, fontSize:'0.9rem', color:'#374151', minWidth:'120px' },
  empty:        { color:'#94a3b8', fontSize:'0.85rem', margin:0 },
  errorBanner:  { color:'#b91c1c', padding:'16px' },
  loading:      { color:'#64748b', padding:'16px' },
};
