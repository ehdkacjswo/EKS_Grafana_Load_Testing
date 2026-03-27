import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultHeaders, responseChecks, thresholdPresets, getBaseUrl } from '../lib/helpers.js';

/**
 * Load Test — Standard performance baseline
 *
 * Purpose: Establish a performance baseline under expected production load.
 *          Ramp up gradually, sustain, then ramp down.
 *
 * VUs: ramp 0→50→50→0 | Duration: ~7 minutes | Expected: <5% error rate
 */
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // ramp up
    { duration: '3m', target: 50 },   // sustain peak
    { duration: '1m', target: 50 },   // hold
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: thresholdPresets.load,
  tags: {
    test_type: 'load',
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

  sleep(0.5);
}
