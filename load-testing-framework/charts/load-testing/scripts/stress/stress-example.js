import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultHeaders, responseChecks, thresholdPresets, getBaseUrl } from '../lib/helpers.js';

/**
 * Stress Test — Find the breaking point
 *
 * Purpose: Push the target service beyond normal capacity to identify
 *          the breaking point and observe degradation behavior.
 *
 * VUs: ramp 0→100→200→0 | Duration: ~14 minutes | Expected: some errors at peak
 */
export const options = {
  stages: [
    { duration: '2m', target: 50 },    // warm up
    { duration: '3m', target: 100 },   // push to high load
    { duration: '3m', target: 200 },   // push to breaking point
    { duration: '2m', target: 200 },   // hold at peak
    { duration: '2m', target: 50 },    // scale down
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: thresholdPresets.stress,
  tags: {
    test_type: 'stress',
    environment: __ENV.ENVIRONMENT || 'staging',
    service: __ENV.SERVICE || 'default',
  },
};

const BASE_URL = getBaseUrl();

export default function () {
  const res = http.get(`${BASE_URL}/`, {
    headers: defaultHeaders,
  });

  check(res, responseChecks(res, 200));

  sleep(0.3);
}
