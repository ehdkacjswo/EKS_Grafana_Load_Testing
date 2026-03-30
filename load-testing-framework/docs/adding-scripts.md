# k6 테스트 스크립트 추가

## 스크립트 구조

```
load-testing-framework/charts/load-testing/scripts/
  lib/           # 공용 유틸리티 (모든 스크립트에서 import)
    helpers.js
  smoke/         # 빠른 상태 확인 (1-2 VU, ~1분)
  load/          # 기준선 성능 테스트 (VU 점진 증가, ~7분)
  stress/        # 한계점 테스트 (높은 VU, ~14분)
  spike/         # 급증 테스트 (스파이크 패턴, ~8분)
```

## 새 스크립트 추가

### 1. 스크립트 파일 생성

적절한 유형 디렉토리에 `.js` 파일을 생성합니다:

```bash
# 예시: 결제 서비스용 새 smoke 테스트
touch load-testing-framework/charts/load-testing/scripts/smoke/smoke-payments.js
```

### 2. 스크립트 작성

공용 헬퍼를 사용하고 기존 패턴을 따릅니다:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { defaultHeaders, responseChecks, thresholdPresets, getBaseUrl } from '../lib/helpers.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: thresholdPresets.smoke,
  tags: {
    test_type: 'smoke',
    environment: __ENV.ENVIRONMENT || 'staging',
    service: 'payments',
  },
};

const BASE_URL = getBaseUrl();

export default function () {
  const res = http.get(`${BASE_URL}/health`, {
    headers: defaultHeaders,
  });
  check(res, responseChecks(res, 200));
  sleep(1);
}
```

### 3. values.yaml에 스크립트 등록

`load-testing-framework/charts/load-testing/values.yaml`의 해당 목록에 파일명을 추가합니다:

```yaml
scripts:
  smoke:
    - smoke-example.js
    - smoke-payments.js    # <-- 여기에 추가
```

### 4. 배포

```bash
helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml
```

### 5. 실행

```bash
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-payments.js \
  | kubectl apply -n load-testing -f -
```

## 규칙

- 스크립트 이름은 `<유형>-<서비스 또는 시나리오>.js` 형식으로 지정
- options에 항상 `tags.test_type`, `tags.environment`, `tags.service` 설정
- 대상 URL은 `getBaseUrl()` 사용 (`BASE_URL` 환경 변수 참조)
- 표준 임계값은 `thresholdPresets.<유형>` 사용
- 공용 헬퍼는 `../lib/helpers.js`에서 import
- 스크립트는 하나의 시나리오에 집중 — 파일당 하나의 시나리오

## 새 대상 서비스 추가

1. `values.yaml`의 `targets`에 서비스를 추가합니다:

```yaml
targets:
  default:
    baseUrl: "http://my-service.default.svc.cluster.local"
  payments:
    baseUrl: "http://payments.default.svc.cluster.local"
```

2. 테스트 실행 시 참조합니다:

```bash
--set testrun.target=payments
```
