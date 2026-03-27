import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Smoke Test — Basic health check
 *
 * Purpose: Verify the target service is alive and responding correctly
 *          under minimal load. Run this before any heavier tests.
 *
 * VUs: 1 | Duration: 1 minute | Expected: zero errors
 */
export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: {
    test_type: 'smoke',
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

  sleep(1);
}
