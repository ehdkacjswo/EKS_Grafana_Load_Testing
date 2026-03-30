import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 공용 헬퍼 라이브러리 (직접 실행 가능)
 *
 * 테스트 스크립트용 공통 유틸리티 (헤더, 응답 검증, 임계값, URL, 태깅).
 * 이 파일 자체를 smoke 테스트로 실행하면 모든 헬퍼의 동작을 검증할 수 있습니다.
 *
 * 라이브러리로 사용:
 *   import { defaultHeaders, responseChecks, thresholdPresets, stagePresets, sleepPresets, getBaseUrl, buildTags } from '../lib/helpers.js';
 *
 * 직접 실행 (헬퍼 검증용 smoke 테스트):
 *   k6 run -e BASE_URL=http://localhost:8080 scripts/lib/helpers.js
 *
 * 환경 변수 (Helm values의 targets 설정으로 주입):
 *   BASE_URL      대상 서비스 URL     (기본값: http://localhost:8080)
 *   ENVIRONMENT   배포 환경 이름       (기본값: staging)
 *   SERVICE       태깅용 서비스 이름   (기본값: default)
 */

// ─── HTTP 헤더 ───────────────────────────────────────────────────────

/**
 * 기본 JSON 요청 헤더. 추가 헤더가 필요하면 스프레드로 확장하세요.
 * @example { ...defaultHeaders, 'Authorization': `Bearer ${__ENV.API_TOKEN}` }
 */
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ─── 응답 검증 ───────────────────────────────────────────────────────

/**
 * HTTP 응답에 대한 표준 k6 check 조건 세트를 생성합니다.
 * 상태 코드, 응답 시간(< 2초), 빈 응답 여부를 검증합니다.
 *
 * @param {object}  res - k6 HTTP 응답 객체 (향후 확장용, predicate는 check()에서 전달받음)
 * @param {number}  [expectedStatus=200] - 기대 HTTP 상태 코드 (201, 204 등)
 * @returns {object} k6 check()에 전달할 검증 객체
 *
 * @example check(res, responseChecks(res));
 * @example check(res, responseChecks(res, 201));
 * @example check(res, { ...responseChecks(res), 'has id': (r) => JSON.parse(r.body).id !== undefined });
 */
export function responseChecks(res, expectedStatus = 200) {
  return {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'response body is not empty': (r) => r.body && r.body.length > 0,
  };
}

// ─── 임계값 프리셋 ──────────────────────────────────────────────────

/**
 * 테스트 유형별 임계값 프리셋. 초과 시 k6가 비정상 종료하여 CI/CD 게이트로 활용 가능.
 *
 *   smoke  — p95 < 500ms,  오류율 < 1%   (서비스 정상 여부 확인)
 *   load   — p95 < 1s, p99 < 2s, 오류율 < 5%   (프로덕션 수준 검증)
 *   stress — p95 < 2s, p99 < 5s, 오류율 < 10%  (한계점 탐색)
 *   spike  — p95 < 3s, 오류율 < 15%  (급증 후 복구 능력 확인)
 *
 * @example thresholds: thresholdPresets.load
 * @example thresholds: { ...thresholdPresets.load, http_reqs: ['rate>100'] }
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

// ─── 스테이지 프리셋 (VU 램핑) ────────────────────────────────────────

/**
 * 테스트 유형별 VU 램핑 스테이지 프리셋.
 * k6의 stages 옵션에 전달하여 VU 수를 시간에 따라 점진적으로 증감시킵니다.
 * smoke는 고정 VU(stages 불필요)이므로 포함하지 않습니다.
 *
 * VU 변화 방식:
 *   각 스테이지는 이전 스테이지의 종료 VU 수에서 target까지 duration 동안
 *   선형 보간(linear interpolation)으로 점진 변화합니다.
 *   예: { duration: '3m', target: 50 } 이전 스테이지가 20 VU로 끝났다면,
 *   3분(180초) 동안 20→50으로 약 6초마다 1 VU씩 증가합니다.
 *
 *   VUs (load 프리셋)
 *   50 |            ┌────────┐
 *      |          ╱            ╲
 *   20 |        ╱                ╲
 *      |      ╱                    ╲
 *    0 |────╱                        ╲────
 *      └──────────────────────────────────→ time
 *       0   1m       4m    5m         7m
 *
 *   즉시 점프가 필요하면 duration을 '0s'로 설정하세요:
 *   { duration: '0s', target: 50 }  // 50 VU로 즉시 전환
 *
 *   load   — 0→20→50→50→0  (~7분, 점진적 증가 후 유지)
 *   stress — 0→50→100→200→200→50→0  (~14분, 한계점까지 단계적 증가)
 *   spike  — 0→5→200→200→5→5→0  (~8분, 급격한 급증 후 복구 관찰)
 *
 * @example stages: stagePresets.load
 * @example stages: [...stagePresets.load, { duration: '1m', target: 100 }]
 */
export const stagePresets = {
  load: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  stress: [
    { duration: '2m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  spike: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 5 },
    { duration: '3m', target: 5 },
    { duration: '2m', target: 0 },
  ],
};

// ─── 슬립 프리셋 (요청 간 대기 시간) ─────────────────────────────────

/**
 * 테스트 유형별 VU 반복 간 대기 시간(초).
 * 실제 사용자의 요청 간격을 시뮬레이션합니다.
 * 값이 작을수록 더 공격적인 부하를 생성합니다.
 *
 *   smoke  — 1초   (최소 부하, 느긋한 간격)
 *   load   — 0.5초 (일반적인 사용자 패턴)
 *   stress — 0.3초 (공격적인 요청 간격)
 *   spike  — 0.2초 (급증 시뮬레이션)
 *
 * @example sleep(sleepPresets.load)
 */
export const sleepPresets = {
  smoke: 1,
  load: 0.5,
  stress: 0.3,
  spike: 0.2,
};

// ─── Base URL ────────────────────────────────────────────────────────

/**
 * BASE_URL 환경 변수에서 대상 서비스 URL을 가져옵니다.
 * K8s에서는 Helm values의 targets.default.baseUrl이 자동 주입되므로
 * fallback은 로컬 개발 시에만 사용됩니다.
 *
 * @param {string} [fallback='http://localhost:8080'] - 환경 변수 미설정 시 사용할 URL
 * @returns {string} Base URL (후행 슬래시 없음)
 *
 * @example getBaseUrl()
 * @example getBaseUrl('http://localhost:3000')
 */
export function getBaseUrl(fallback = 'http://localhost:8080') {
  return __ENV.BASE_URL || fallback;
}

// ─── 태그 ────────────────────────────────────────────────────────────

/**
 * 테스트 실행용 표준 태그 세트를 생성합니다.
 * Prometheus/Grafana에서 테스트 유형·환경·서비스별 필터링에 사용됩니다.
 * ENVIRONMENT, SERVICE 환경 변수로 재정의 가능합니다.
 *
 * @param {string} testType - 'smoke' | 'load' | 'stress' | 'spike'
 * @returns {object} options.tags에 사용할 태그 객체
 *
 * @example tags: buildTags('load')
 */
export function buildTags(testType) {
  return {
    test_type: testType,
    environment: __ENV.ENVIRONMENT || 'staging',
    service: __ENV.SERVICE || 'default',
  };
}

// ─── 자체 실행 (헬퍼 검증용 smoke 테스트) ────────────────────────────

/** 직접 실행 시 smoke 프리셋으로 1 VU, 30초 동안 모든 헬퍼를 검증합니다. */
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: thresholdPresets.smoke,
  tags: buildTags('smoke'),
};

const BASE_URL = getBaseUrl();

/** GET / 요청 후 responseChecks로 응답을 검증합니다. */
export default function () {
  const res = http.get(`${BASE_URL}/`, { headers: defaultHeaders });
  check(res, responseChecks(res));
  sleep(sleepPresets.smoke);
}
