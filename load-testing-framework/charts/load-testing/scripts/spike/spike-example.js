import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultHeaders, responseChecks, thresholdPresets, getBaseUrl } from '../lib/helpers.js';

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
    { duration: '30s', target: 5 },     // baseline
    { duration: '30s', target: 200 },   // spike up
    { duration: '1m', target: 200 },    // hold spike
    { duration: '30s', target: 5 },     // drop back
    { duration: '3m', target: 5 },      // observe recovery
    { duration: '2m', target: 0 },      // ramp down
  ],
  thresholds: thresholdPresets.spike,
  tags: {
    test_type: 'spike',
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

  sleep(0.2);
}
