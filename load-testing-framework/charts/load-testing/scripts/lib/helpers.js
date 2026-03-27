/**
 * k6 Shared Helper Library
 *
 * Reusable utilities for all k6 test scripts.
 * Import in your scripts:
 *   import { defaultHeaders, checkResponse, thresholds } from '../lib/helpers.js';
 */

/**
 * Default HTTP headers for all requests.
 * Override or extend in individual scripts as needed.
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Validate an HTTP response meets basic expectations.
 *
 * @param {object} res - k6 HTTP response object
 * @param {number} expectedStatus - expected HTTP status code (default: 200)
 * @returns {object} check results compatible with k6 check()
 */
export function responseChecks(res, expectedStatus = 200) {
  return {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'response body is not empty': (r) => r.body && r.body.length > 0,
  };
}

/**
 * Common threshold presets for different test types.
 * Use in your script's options.thresholds.
 */
export const thresholdPresets = {
  smoke: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  load: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  stress: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.10'],
  },
  spike: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],
  },
};

/**
 * Get the base URL from the BASE_URL environment variable.
 * Falls back to a default if not set.
 *
 * @param {string} fallback - fallback URL if env var is not set
 * @returns {string} base URL for the target service
 */
export function getBaseUrl(fallback = 'http://localhost:8080') {
  return __ENV.BASE_URL || fallback;
}
