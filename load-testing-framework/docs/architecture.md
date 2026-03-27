# Architecture Overview

## Component Diagram

```
+---------------------------------------------------+
|                  EKS Cluster                       |
|                                                    |
|  +----------------------------------------------+ |
|  |          load-testing namespace               | |
|  |                                               | |
|  |  +--------------+    +--------------------+   | |
|  |  | k6-operator  |    | Prometheus Server  |   | |
|  |  | (Helm chart) |    | (Helm sub-chart)   |   | |
|  |  +------+-------+    +--------+-----------+   | |
|  |         |                     ^               | |
|  |         | creates             | remote-write  | |
|  |         v                     |               | |
|  |  +--------------+            |               | |
|  |  | k6 Runner    +------------+               | |
|  |  | Pods (Jobs)  |                            | |
|  |  +------+-------+                            | |
|  |         |                                     | |
|  |         | reads scripts from                  | |
|  |         v                                     | |
|  |  +--------------+    +--------------------+   | |
|  |  | ConfigMaps   |    | Grafana            |   | |
|  |  | (k6 scripts) |    | (Helm sub-chart)   |   | |
|  |  +--------------+    +--------+-----------+   | |
|  |                               |               | |
|  |                               | queries       | |
|  |                               v               | |
|  |                      +--------+-----------+   | |
|  |                      | Prometheus Server  |   | |
|  |                      | (PromQL data src)  |   | |
|  |                      +--------------------+   | |
|  +----------------------------------------------+ |
+---------------------------------------------------+
```

## Data Flow

1. Operator triggers a k6 TestRun (via kubectl apply or helm template)
2. k6-operator creates k6 runner pods based on the TestRun spec
3. Runner pods read test scripts from ConfigMaps
4. During execution, k6 pushes metrics to Prometheus via remote-write
5. Grafana queries Prometheus and displays dashboards

## Helm Chart Structure

```
load-testing-framework/
  charts/load-testing/           # Umbrella chart
    Chart.yaml                   # Dependencies: k6-operator, grafana, prometheus
    values.yaml                  # Base defaults
    values-staging.yaml          # Staging overrides
    values-production.yaml       # Production overrides
    templates/
      _helpers.tpl               # Shared template helpers
      namespace.yaml             # Namespace creation
      configmap-scripts.yaml     # k6 scripts as ConfigMaps
      testrun.yaml               # k6 TestRun CRD template
      grafana-dashboards-configmap.yaml  # Dashboard provisioning
    dashboards/
      k6-overview.json           # Overview dashboard
      k6-test-detail.json        # Detail dashboard
    scripts/                     # k6 test scripts (source of truth)
      lib/helpers.js             # Shared k6 utilities
      smoke/                     # Smoke test scripts
      load/                      # Load test scripts
      stress/                    # Stress test scripts
      spike/                     # Spike test scripts
    grafana/
      grafana-common-values.yaml     # Platform Grafana settings
      grafana-loadtest-values.yaml   # Load-testing Grafana settings
    prometheus/
      prometheus-common-values.yaml     # Platform Prometheus settings
      prometheus-loadtest-values.yaml   # Load-testing Prometheus settings
  docs/
    runbook.md                   # Operational runbook
    adding-scripts.md            # Script authoring guide
    architecture.md              # This file
  README.md                      # Project README
```

## Configuration Layers

| Layer | Purpose | Files |
|---|---|---|
| Base defaults | Sane defaults for all environments | `values.yaml` |
| Environment overrides | Per-environment tuning | `values-staging.yaml`, `values-production.yaml` |
| Grafana common | Platform-level Grafana config | `grafana/grafana-common-values.yaml` |
| Grafana load-testing | Workflow-specific dashboards and data sources | `grafana/grafana-loadtest-values.yaml` |
| Prometheus common | Platform-level Prometheus config | `prometheus/prometheus-common-values.yaml` |
| Prometheus load-testing | k6 remote-write and scrape configs | `prometheus/prometheus-loadtest-values.yaml` |

## Reusing Existing Grafana or Prometheus

If your cluster already has Grafana or Prometheus:

1. Set `grafana.enabled=false` and/or `prometheus.enabled=false` in values.yaml
2. Update `k6.prometheus.remoteWriteUrl` to point to your existing Prometheus
3. Import the dashboard JSON files from `dashboards/` into your existing Grafana
4. Configure a Prometheus data source in your existing Grafana pointing to your Prometheus instance
