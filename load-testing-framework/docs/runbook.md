# Operational Runbook — Load-Testing Framework

## Prerequisites

- `kubectl` configured with access to the target EKS cluster
- `helm` v3.x installed
- Cluster namespace `load-testing` (created automatically by the chart)

## 1. Deploy the Framework

### First-time installation (staging)

```bash
# Update Helm dependencies
helm dependency update ./load-testing-framework/charts/load-testing

# Install with staging overrides
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml \
  --set grafana.adminPassword=<your-password>
```

### First-time installation (production)

```bash
helm dependency update ./load-testing-framework/charts/load-testing

helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-production.yaml \
  --set grafana.adminPassword=<your-password>
```

## 2. Run a Load Test

### Option A: Render and apply a TestRun

```bash
# Render the TestRun template for a smoke test
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  | kubectl apply -n load-testing -f -
```

### Option B: Apply a TestRun directly

```yaml
apiVersion: k6.io/v1alpha1
kind: TestRun
metadata:
  name: smoke-test-run
  namespace: load-testing
spec:
  parallelism: 1
  script:
    configMap:
      name: load-testing-scripts-smoke
      file: smoke-example.js
  runner:
    image: grafana/k6:0.54.0
    env:
      - name: K6_PROMETHEUS_RW_SERVER_URL
        value: "http://load-testing-prometheus-server.load-testing.svc.cluster.local:80/api/v1/write"
      - name: K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM
        value: "true"
      - name: BASE_URL
        value: "http://my-service.staging.svc.cluster.local"
  arguments: --out experimental-prometheus-rw
```

### Monitor a running test

```bash
# Watch TestRun status
kubectl get testrun -n load-testing -w

# View k6 runner pod logs
kubectl logs -n load-testing -l app=k6 -f
```

## 3. View Results in Grafana

```bash
# Port-forward Grafana
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
```

Open http://localhost:3000 and navigate to the "Load Testing" folder.
- **k6 Overview**: request rate, latency percentiles, error rate, VUs
- **k6 Test Detail**: per-test breakdown, histogram, error codes

## 4. Upgrade the Framework

```bash
helm dependency update ./load-testing-framework/charts/load-testing

helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml
```

## 5. Rollback

```bash
# List revisions
helm history load-testing -n load-testing

# Rollback to previous revision
helm rollback load-testing <revision> -n load-testing
```

## 6. Uninstall

```bash
helm uninstall load-testing -n load-testing
kubectl delete namespace load-testing
```

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| TestRun stuck in "created" | `kubectl describe testrun <name> -n load-testing` — check k6-operator logs |
| No metrics in Grafana | Verify Prometheus is running: `kubectl get pods -n load-testing` |
| k6 pod CrashLoopBackOff | Check script syntax: `kubectl logs <pod> -n load-testing` |
| Dashboard shows no data | Verify data source URL in Grafana matches Prometheus service |
