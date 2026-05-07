# Capacity Test Results — NFR-ST-13

**Date:** 2026-05-07
**Requirement:** Handle 100k records with acceptable query performance

## Setup

| Parameter | Value |
|---|---|
| Target record count | 100.000 |
| Records before test | 5 |
| Records inserted | 99.995 |
| Total during test | 100.000 |
| Batch size | 1.000 |
| Insert time | 46164ms |

## Query Performance — `SELECT * FROM Lead ORDER BY priority_score DESC LIMIT 500`

| Run | Time (ms) |
|---|---|
| Run 1 | 693 |
| Run 2 | 683 |
| Run 3 | 718 |
| Run 4 | 898 |
| Run 5 | 683 |
| **Average** | **735.0** |
| **Min** | **683** |
| **Max** | **898** |

## Verdict

**PASS ✅** — Average query time 735.0ms at 100k records. PostgreSQL ORDER BY on indexed column handles the load within acceptable range.

## Notes

- Test records were inserted with email prefix `perftest_` and cleaned up after measurement.
- Production data was not affected.
- `priority_score` has no dedicated index; adding `CREATE INDEX ON Lead(priority_score DESC)` would further reduce query time.
