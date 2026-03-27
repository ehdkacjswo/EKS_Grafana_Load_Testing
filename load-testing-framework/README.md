# Load-Testing Framework

Helm-managed k6 load-testing framework for Amazon EKS with Grafana dashboards and Prometheus metrics.

## Quick Start

```bash
# 1. Update Helm dependencies
helm dependency update ./load-testing-framework/charts/load-testing

# 2. Deploy (staging)
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml \
  --set grafana.adminPassword=<your-password>

# 3. Run a smoke test
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  | kubectl apply -n load-testing -f -

# 4. View results in Grafana
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
# Open http://localhost:3000 → "Load Testing" folder
```

## Prerequisites

- Amazon EKS cluster (running and accessible)
- `kubectl` configured for the cluster
- `helm` v3.x

## Components

| Component | Purpose | Helm Chart |
|---|---|---|
| k6-operator | Manages k6 test runs as Kubernetes CRDs | grafana/k6-operator |
| Grafana | Dashboard visualization | grafana/grafana |
| Prometheus | Metrics storage (k6 remote-write target) | prometheus-community/prometheus |

All components are optional — disable any sub-chart if already present in your cluster.

## Documentation

- [Operational Runbook](docs/runbook.md) — deploy, run tests, view results, upgrade
- [Adding Scripts](docs/adding-scripts.md) — how to add new k6 test scripts
- [Architecture](docs/architecture.md) — component diagram, data flow, config layers

## Test Types

| Type | Purpose | VUs | Duration |
|---|---|---|---|
| Smoke | Health check | 1-2 | ~1 min |
| Load | Performance baseline | 20-50 | ~7 min |
| Stress | Breaking point | 50-200 | ~14 min |
| Spike | Sudden surge | 5-200 | ~8 min |

## Project Structure

```
load-testing-framework/
  charts/load-testing/       # Helm umbrella chart (includes scripts/)
  docs/                      # Operational documentation
```
