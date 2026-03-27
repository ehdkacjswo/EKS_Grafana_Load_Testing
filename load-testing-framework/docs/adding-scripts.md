# Adding k6 Test Scripts

## Script Organization

```
load-testing-framework/charts/load-testing/scripts/
  lib/           # Shared utilities (imported by all scripts)
    helpers.js
  smoke/         # Quick health checks (1-2 VUs, ~1 min)
  load/          # Baseline performance tests (ramping VUs, ~7 min)
  stress/        # Breaking point tests (high VUs, ~14 min)
  spike/         # Sudden surge tests (spike pattern, ~8 min)
```

## Adding a New Script

### 1. Create the script file

Place your `.js` file in the appropriate type directory:

```bash
# Example: new smoke test for the payments service
touch load-testing-framework/charts/load-testing/scripts/smoke/smoke-payments.js
```

### 2. Write the script

Use the shared helpers and follow the existing pattern:

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

### 3. Register the script in values.yaml

Add the filename to the appropriate list in `load-testing-framework/charts/load-testing/values.yaml`:

```yaml
scripts:
  smoke:
    - smoke-example.js
    - smoke-payments.js    # <-- add here
```

### 4. Deploy

```bash
helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml
```

### 5. Run

```bash
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-payments.js \
  | kubectl apply -n load-testing -f -
```

## Conventions

- Name scripts as `<type>-<service-or-scenario>.js`
- Always set `tags.test_type`, `tags.environment`, and `tags.service` in options
- Use `getBaseUrl()` for the target URL (reads `BASE_URL` env var)
- Use `thresholdPresets.<type>` for standard thresholds
- Import shared helpers from `../lib/helpers.js`
- Keep scripts focused — one scenario per file

## Adding a New Target Service

1. Add the service to `targets` in `values.yaml`:

```yaml
targets:
  default:
    baseUrl: "http://my-service.default.svc.cluster.local"
  payments:
    baseUrl: "http://payments.default.svc.cluster.local"
```

2. Reference it when running a test:

```bash
--set testrun.target=payments
```
