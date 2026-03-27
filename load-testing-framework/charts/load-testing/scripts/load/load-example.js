import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Load Test — Standard performance baseline
 *
 * Purpose: Establish a performance baseline under expected production load.
 *          Ramp up gradually, sustain, then ramp down.
 *
 * VUs: ramp 0→50→0 | Duration: ~7 minutes | Expected: <5% error rate
 */
export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  tags: {
    test_type: 'load',
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

  sleep(0.5);
}
