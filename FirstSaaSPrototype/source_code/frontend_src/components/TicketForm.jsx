import { useState } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES   = ['Open', 'In Progress', 'Resolved'];

export default function TicketForm({ initial = {}, leads = [], onSubmit, onCancel }) {
  const [form, setForm] = useState({
    description:    initial.description    || '',
    priority_level: initial.priority_level || 'Medium',
    status:         initial.status         || 'Open',
    lead_id:        initial.lead_id        || '',
  });

  function handle(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({ ...form, updated_at: initial.updated_at });
  }

  return (
    <form onSubmit={submit} style={styles.form}>
      <label style={styles.label}>Description
        <textarea name="description" value={form.description} onChange={handle} required rows={3} style={{ ...styles.input, resize:'vertical' }} />
      </label>
      <label style={styles.label}>Priority
        <select name="priority_level" value={form.priority_level} onChange={handle} style={styles.input}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </label>
      {initial.ticket_id && (
        <label style={styles.label}>Status
          <select name="status" value={form.status} onChange={handle} style={styles.input}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
      )}
      <label style={styles.label}>Lead
        <select name="lead_id" value={form.lead_id} onChange={handle} required style={styles.input}>
          <option value="">-- select lead --</option>
          {leads.map(l => <option key={l.lead_id} value={l.lead_id}>{l.contact_name}</option>)}
        </select>
      </label>
      <div style={styles.actions}>
        <button type="submit" style={styles.primary}>Save</button>
        {onCancel && <button type="button" onClick={onCancel} style={styles.secondary}>Cancel</button>}
      </div>
    </form>
  );
}

const styles = {
  form:      { display:'grid', gap:'12px', padding:'16px' },
  label:     { display:'flex', flexDirection:'column', gap:'4px', fontSize:'0.85rem', color:'#374151' },
  input:     { padding:'6px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'0.9rem' },
  actions:   { display:'flex', gap:'8px', justifyContent:'flex-end' },
  primary:   { background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer' },
  secondary: { background:'#e5e7eb', color:'#374151', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer' },
};
