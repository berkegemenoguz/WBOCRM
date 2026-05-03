import { useState } from 'react';

const STAGES = ['New', 'Contacted', 'Qualified', 'Closed'];

export default function LeadForm({ initial = {}, onSubmit, onCancel }) {
  const metrics = initial.metrics || {};
  const [form, setForm] = useState({
    contact_name:   initial.contact_name || '',
    email:          initial.email        || '',
    pipeline_stage: initial.pipeline_stage || 'New',
    calls:          metrics.calls       ?? 0,
    meetings:       metrics.meetings    ?? 0,
    budget:         metrics.budget      ?? 0,
    companySize:    metrics.companySize  || 'small',
    emailOpens:     metrics.emailOpens  ?? 0,
  });

  function handle(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function submit(e) {
    e.preventDefault();
    const { contact_name, email, pipeline_stage, calls, meetings, budget, companySize, emailOpens } = form;
    onSubmit({
      contact_name,
      email,
      pipeline_stage,
      metrics: {
        calls:       Number(calls),
        meetings:    Number(meetings),
        budget:      Number(budget),
        companySize,
        emailOpens:  Number(emailOpens),
      },
    });
  }

  return (
    <form onSubmit={submit} style={styles.form}>
      <label style={styles.label}>Contact Name
        <input name="contact_name" value={form.contact_name} onChange={handle} required style={styles.input} />
      </label>
      <label style={styles.label}>Email
        <input name="email" type="email" value={form.email} onChange={handle} required style={styles.input} />
      </label>
      <label style={styles.label}>Stage
        <select name="pipeline_stage" value={form.pipeline_stage} onChange={handle} style={styles.input}>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label style={styles.label}>Calls
        <input name="calls" type="number" min="0" value={form.calls} onChange={handle} style={styles.input} />
      </label>
      <label style={styles.label}>Meetings
        <input name="meetings" type="number" min="0" value={form.meetings} onChange={handle} style={styles.input} />
      </label>
      <label style={styles.label}>Budget ($K)
        <input name="budget" type="number" min="0" value={form.budget} onChange={handle} style={styles.input} />
      </label>
      <label style={styles.label}>Company Size
        <select name="companySize" value={form.companySize} onChange={handle} style={styles.input}>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </label>
      <label style={styles.label}>Email Opens
        <input name="emailOpens" type="number" min="0" value={form.emailOpens} onChange={handle} style={styles.input} />
      </label>
      <div style={styles.actions}>
        <button type="submit" style={styles.primary}>Save</button>
        {onCancel && <button type="button" onClick={onCancel} style={styles.secondary}>Cancel</button>}
      </div>
    </form>
  );
}

const styles = {
  form:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', padding:'16px' },
  label:     { display:'flex', flexDirection:'column', gap:'4px', fontSize:'0.85rem', color:'#374151' },
  input:     { padding:'6px 10px', border:'1px solid #d1d5db', borderRadius:'6px', fontSize:'0.9rem' },
  actions:   { gridColumn:'1/-1', display:'flex', gap:'8px', justifyContent:'flex-end' },
  primary:   { background:'#3b82f6', color:'#fff', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer' },
  secondary: { background:'#e5e7eb', color:'#374151', border:'none', borderRadius:'6px', padding:'8px 20px', cursor:'pointer' },
};
