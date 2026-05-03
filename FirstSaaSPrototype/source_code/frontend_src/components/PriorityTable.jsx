export default function PriorityTable({ leads = [] }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          {['Rank', 'Name', 'Stage', 'Score'].map(h => (
            <th key={h} style={styles.th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leads.map((lead, i) => (
          <tr key={lead.lead_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
            <td style={styles.td}>{i + 1}</td>
            <td style={styles.td}>{lead.contact_name}</td>
            <td style={styles.td}>{lead.pipeline_stage}</td>
            <td style={{ ...styles.td, fontWeight: 'bold', color: scoreColor(lead.priority_score) }}>
              {lead.priority_score}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function scoreColor(score) {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

const styles = {
  table:   { width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' },
  th:      { padding:'8px 12px', background:'#f1f5f9', textAlign:'left', borderBottom:'2px solid #e2e8f0', color:'#475569' },
  td:      { padding:'8px 12px', borderBottom:'1px solid #f1f5f9' },
  rowEven: { background:'#fff' },
  rowOdd:  { background:'#f8fafc' },
};
