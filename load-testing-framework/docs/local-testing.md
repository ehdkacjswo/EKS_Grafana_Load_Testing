# Local Testing Guide

Validate the load-testing framework locally using kind before deploying to EKS.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- Your user in the `docker` group (`sudo usermod -aG docker $USER`, then log out/in or `newgrp docker`)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) installed
- [Helm](https://helm.sh/docs/intro/install/) v3.x installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed

## 1. Create a Local Cluster

```bash
kind create cluster --name load-test-validation
```

Verify:

```bash
kubectl cluster-info --context kind-load-test-validation
```

## 2. Deploy the Framework

```bash
# Pull sub-chart dependencies
helm dependency update ./load-testing-framework/charts/load-testing

# Install the chart
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  --set grafana.adminPassword=admin123
```

Wait for all pods to be ready:

```bash
kubectl get pods -n load-testing -w
```

## 3. Deploy a Mock Target Service

k6 needs something to hit. Deploy a simple nginx echo server:

```bash
kubectl run echo-server --image=nginx:1.27-alpine --port=80 -n load-testing
kubectl expose pod echo-server --port=80 --name=echo-server -n load-testing
```

Verify it's running:

```bash
kubectl get pod echo-server -n load-testing
```

## 4. Run a Smoke Test

```bash
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -
```

Monitor the test:

```bash
# Watch TestRun status
kubectl get testrun -n load-testing -w

# View k6 runner logs (once the pod appears)
kubectl logs -n load-testing -l app=k6 -f
```

## 5. View Results in Grafana

```bash
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
```

Open http://localhost:3000 in your browser.
- Username: `admin`
- Password: `admin123` (or whatever you set in step 2)
- Navigate to the "Load Testing" folder for dashboards

## 6. Run Other Test Types

```bash
# Load test
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=load \
  --set testrun.scriptName=load-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -

# Stress test
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=stress \
  --set testrun.scriptName=stress-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -
```

## 7. Update After Code Changes

If you modify scripts, templates, or values:

```bash
helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  --set grafana.adminPassword=admin123
```

## 8. Clean Up

```bash
# Remove the Helm release
helm uninstall load-testing -n load-testing

# Delete the kind cluster
kind delete cluster --name load-test-validation
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `permission denied` on Docker socket | `sudo usermod -aG docker $USER` then `newgrp docker` |
| `kubectl: command not found` | Install kubectl: `curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/` |
| TestRun stuck in "created" | Check k6-operator logs: `kubectl logs -n load-testing -l app.kubernetes.io/name=k6-operator -f` |
| k6 pod CrashLoopBackOff | Check script errors: `kubectl logs -n load-testing -l app=k6` |
| No data in Grafana dashboards | Verify Prometheus is running: `kubectl get pods -n load-testing -l app.kubernetes.io/name=prometheus` |
| Pods stuck in Pending | kind node may be out of resources. Try `kubectl describe pod <name> -n load-testing` to check events |
