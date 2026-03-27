import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Spike Test — Sudden traffic surge
 *
 * Purpose: Simulate a sudden spike in traffic to test auto-scaling,
 *          circuit breakers, and recovery behavior.
 *
 * VUs: ramp 0→5→200→5→0 | Duration: ~8 minutes | Expected: recovery after spike
 */
export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 5 },
    { duration: '3m', target: 5 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],
  },
  tags: {
    test_type: 'spike',
    environment: __ENV.ENVIRONMENT || 'staging',
    service: __ENV.SERVICE || 'default',
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

export default function () {
  const res = http.get(`${BASE_URL}/`, { headers });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.2);
}
