import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Stress Test — Find the breaking point
 *
 * Purpose: Push the target service beyond normal capacity to identify
 *          the breaking point and observe degradation behavior.
 *
 * VUs: ramp 0→200→0 | Duration: ~14 minutes | Expected: some errors at peak
 */
export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.10'],
  },
  tags: {
    test_type: 'stress',
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

  sleep(0.3);
}
