# Code Generation Plan — Load-Testing Framework

## Unit Context
- **Unit**: load-testing-framework (single unit)
- **Project Type**: Greenfield, infrastructure-as-code (Helm charts + k6 scripts)
- **Workspace Root**: /home/aidan/load-testing
- **Code Location**: Workspace root (`charts/`, `scripts/`, `docs/`)
- **Documentation Location**: `aidlc-docs/construction/load-testing-framework/code/`

## Dependencies
- k6-operator Helm chart (external dependency, pulled by Helm)
- Grafana Helm chart (external sub-chart dependency)
- Prometheus Helm chart (external sub-chart dependency)

## Security & PBT Compliance (Inline)
Security and PBT extension compliance will be assessed inline during generation:
- SECURITY-09 (Hardening): No default credentials, pinned image versions
- SECURITY-10 (Supply Chain): Pinned chart versions, no `latest` tags
- SECURITY-06 (Least Privilege): k6 ServiceAccount with minimal permissions
- PBT-09 (Framework Selection): Select PBT framework for Helm template testing
- Most other SECURITY/PBT rules: Expected N/A (no application auth, APIs, databases, or business logic)

---

## Generation Steps

### Step 1: Project Structure Setup
- [x] Create top-level directory structure: `charts/load-testing/`, `scripts/k6/`, `docs/`
- [x] Create sub-directories: `charts/load-testing/templates/`, `charts/load-testing/dashboards/`, `charts/load-testing/grafana/`, `charts/load-testing/prometheus/`
- [x] Create script sub-directories: `scripts/k6/lib/`, `scripts/k6/smoke/`, `scripts/k6/load/`, `scripts/k6/stress/`, `scripts/k6/spike/`

### Step 2: Umbrella Helm Chart — Chart.yaml and base values.yaml
- [x] Create `charts/load-testing/Chart.yaml` with chart metadata and sub-chart dependencies (k6-operator, grafana, prometheus)
- [x] Create `charts/load-testing/values.yaml` with base defaults: namespace, k6 operator config, Grafana common + load-testing settings, Prometheus common + load-testing settings, script references

### Step 3: Environment-Specific Values Files
- [x] Create `charts/load-testing/values-staging.yaml` with staging overrides (target URLs, VU counts, thresholds)
- [x] Create `charts/load-testing/values-production.yaml` with production overrides

### Step 4: Helm Templates — Namespace and Helpers
- [x] Create `charts/load-testing/templates/_helpers.tpl` with reusable template helpers (labels, names, selectors)
- [x] Create `charts/load-testing/templates/namespace.yaml` for dedicated load-testing namespace

### Step 5: Helm Templates — ConfigMap Script Delivery
- [x] Create `charts/load-testing/templates/configmap-scripts.yaml` that generates ConfigMaps from k6 script files
- [x] Support automatic discovery of scripts from the `scripts/k6/` directory structure via values references

### Step 6: Helm Templates — k6 TestRun CRD
- [x] Create `charts/load-testing/templates/testrun.yaml` with k6-operator TestRun custom resource template
- [x] Support configurable test script reference, parallelism, arguments, and Prometheus remote-write output

### Step 7: Grafana Configuration — Common vs Load-Testing Split
- [x] Create `charts/load-testing/grafana/grafana-common-values.yaml` with platform-level Grafana settings (persistence, auth placeholders, resource limits) — clearly commented as common/shared
- [x] Create `charts/load-testing/grafana/grafana-loadtest-values.yaml` with load-testing-specific settings (dashboard provisioning sidecar, data source for Prometheus, dashboard folder)

### Step 8: Prometheus Configuration — Common vs Load-Testing Split
- [x] Create `charts/load-testing/prometheus/prometheus-common-values.yaml` with platform-level Prometheus settings (retention, storage, resource limits) — clearly commented as common/shared
- [x] Create `charts/load-testing/prometheus/prometheus-loadtest-values.yaml` with load-testing-specific settings (remote-write receiver config, scrape configs for k6 metrics)

### Step 9: Grafana Dashboards — k6 Overview
- [x] Create `charts/load-testing/dashboards/k6-overview.json` — main dashboard with panels: request rate, latency percentiles (p50/p90/p95/p99), error rate, VU count, test status
- [x] Include template variables: environment, service, test_type, scenario

### Step 10: Grafana Dashboards — k6 Test Detail
- [x] Create `charts/load-testing/dashboards/k6-test-detail.json` — per-test detail dashboard with panels: HTTP request duration histogram, response time trends, throughput over time, error breakdown by status code, iteration rate
- [x] Include template variables: environment, service, test_type, scenario, testrun_id

### Step 11: Grafana Dashboard Provisioning Template
- [x] Create `charts/load-testing/templates/grafana-dashboards-configmap.yaml` — ConfigMap that provisions dashboard JSON files into Grafana via sidecar

### Step 12: k6 Shared Library
- [x] Create `scripts/k6/lib/helpers.js` with reusable k6 utilities: common HTTP headers, response validation helpers, threshold presets, environment config loader

### Step 13: k6 Example Scripts — Smoke Test
- [x] Create `scripts/k6/smoke/smoke-example.js` — lightweight smoke test (1-2 VUs, short duration, basic health check)

### Step 14: k6 Example Scripts — Load Test
- [x] Create `scripts/k6/load/load-example.js` — standard load test (ramping VUs, sustained duration, performance thresholds)

### Step 15: k6 Example Scripts — Stress Test
- [x] Create `scripts/k6/stress/stress-example.js` — stress test (high VU ramp, extended duration, breaking point detection)

### Step 16: k6 Example Scripts — Spike Test
- [x] Create `scripts/k6/spike/spike-example.js` — spike test (sudden VU surge, short peak, recovery observation)

### Step 17: Operational Documentation — Runbook
- [x] Create `docs/runbook.md` — operational runbook covering: deployment, running tests, viewing results, adding scripts, upgrading, troubleshooting

### Step 18: Operational Documentation — Adding Scripts Guide
- [x] Create `docs/adding-scripts.md` — guide for test authors: script conventions, folder structure, how to add/update/test scripts

### Step 19: Operational Documentation — Architecture Overview
- [x] Create `docs/architecture.md` — architecture overview: component diagram, data flow (k6 → Prometheus → Grafana), Helm chart structure, configuration layers

### Step 20: Project README
- [x] Create `README.md` (or update if exists) — project overview, quick start, prerequisites, deployment commands, links to docs

### Step 21: Code Generation Summary
- [x] Create `aidlc-docs/construction/load-testing-framework/code/code-summary.md` — summary of all generated files, security compliance assessment, PBT compliance assessment
