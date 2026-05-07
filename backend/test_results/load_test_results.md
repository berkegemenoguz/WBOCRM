# Load Test Results — NFR-ST-14

**Date:** 2026-05-07
**Target:** `GET https://wbocrm.onrender.com/api/leads`
**Tool:** autocannon
**Requirement:** ≥ 50 req/sec, ≤ 5% error rate

## Configuration

| Parameter | Value |
|---|---|
| Concurrent connections | 10 |
| Duration | 10 seconds |
| Total requests sent | 500 |

## Results

| Metric | Value |
|---|---|
| **Avg req/sec** | 83.3 |
| **Min req/sec** | 21 |
| **Max req/sec** | 143 |
| **Total requests** | 500 |
| **Errors** | 0 |
| **Error rate** | 0.00% |
| **Avg latency** | 88.4 ms |
| **p99 latency** | 1300 ms |
| **Throughput avg** | 241.4 KB/s |

## Verdict

**PASS ✅** — 83.3 req/sec (requirement: ≥ 50), error rate 0.00% (requirement: ≤ 5%)
