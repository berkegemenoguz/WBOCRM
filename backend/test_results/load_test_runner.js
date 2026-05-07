/**
 * Writes load test results to load_test_results.md
 */

const autocannon = require('autocannon');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE_URL = 'https://wbocrm.onrender.com';

async function getToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ user_email: 'admin@crm.com', user_password: 'Admin123!' });
    const req = https.request(
      { hostname: 'wbocrm.onrender.com', path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data).token); } catch { reject(new Error('Login failed')); }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const token = await getToken();

  const result = await autocannon({
    url: `${BASE_URL}/api/leads`,
    connections: 10,
    duration: 10,
    amount: 500,
    headers: { Authorization: `Bearer ${token}` },
  });

  const errorRate = result.errors === 0 ? 0 : (result.errors / result.requests.total) * 100;
  const avgRps    = result.requests.average;
  const pass      = errorRate <= 5;
  const date      = new Date().toISOString().split('T')[0];

  const md = `# Load Test Results — NFR-ST-14

**Date:** ${date}
**Target:** \`GET ${BASE_URL}/api/leads\`
**Tool:** autocannon
**Requirement:** ≥ 50 req/sec, ≤ 5% error rate

## Configuration

| Parameter | Value |
|---|---|
| Concurrent connections | 10 |
| Duration | 10 seconds |
| Total requests sent | ${result.requests.total} |

## Results

| Metric | Value |
|---|---|
| **Avg req/sec** | ${avgRps.toFixed(1)} |
| **Min req/sec** | ${result.requests.min} |
| **Max req/sec** | ${result.requests.max} |
| **Total requests** | ${result.requests.total} |
| **Errors** | ${result.errors} |
| **Error rate** | ${errorRate.toFixed(2)}% |
| **Avg latency** | ${result.latency.average.toFixed(1)} ms |
| **p99 latency** | ${result.latency.p99} ms |
| **Throughput avg** | ${(result.throughput.average / 1024).toFixed(1)} KB/s |

## Verdict

**${pass ? 'PASS ✅' : 'FAIL ❌'}** — ${avgRps.toFixed(1)} req/sec (requirement: ≥ 50), error rate ${errorRate.toFixed(2)}% (requirement: ≤ 5%)
`;

  fs.writeFileSync(path.join(__dirname, 'load_test_results.md'), md, 'utf8');
  process.stdout.write(md);
}

run().catch(err => { console.error(err.message); process.exit(1); });
