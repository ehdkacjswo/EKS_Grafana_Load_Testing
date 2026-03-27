import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultHeaders, responseChecks, thresholdPresets, getBaseUrl } from '../lib/helpers.js';

/**
 * Smoke Test — Basic health check
 *
 * Purpose: Verify the target service is alive and responding correctly
 *          under minimal load. Run this before any heavier tests.
 *
 * VUs: 1-2 | Duration: 1 minute | Expected: zero errors
 */
export const options = {
  vus: 1,
  duration: '1m',
  thresholds: thresholdPresets.smoke,
  tags: {
    test_type: 'smoke',
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

  sleep(1);
}
