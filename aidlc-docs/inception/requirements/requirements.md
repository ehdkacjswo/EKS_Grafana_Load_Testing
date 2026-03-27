# Requirements Document — Helm-Managed Load-Testing Framework

## Intent Analysis

| Attribute | Value |
|---|---|
| User Request | Build a reusable, Helm-managed load-testing framework inside an existing Amazon EKS cluster using k6, Grafana, and optionally Prometheus |
| Request Type | New Project (Greenfield) |
| Scope Estimate | Multiple Components — Helm charts, k6 operator, Grafana dashboards, Prometheus integration, test scripts, operational docs |
| Complexity Estimate | Complex — multiple interacting components, conditional dependencies, multi-environment support, clear separation of platform vs workflow config |

---

## 1. Functional Requirements

### FR-01: k6 Load Test Execution

- FR-01.1: The framework MUST deploy k6 as a Kubernetes-native workload using the k6-operator (Grafana's official Kubernetes operator for k6).
  - Rationale: The k6-operator provides CRD-based test management, parallelism support, and native Kubernetes lifecycle integration. This is the recommended approach for Kubernetes-native k6 execution.
- FR-01.2: The k6-operator MUST be deployed and managed via its official Helm chart.
- FR-01.3: Test runs MUST be defined as Kubernetes custom resources (TestRun CRDs) managed through the k6-operator.
- FR-01.4: The framework MUST support manual test execution triggered by operators on demand.
- FR-01.5: The framework MUST be designed so that CI/CD-driven execution can be added later without structural changes.

### FR-02: Test Script Management

- FR-02.1: k6 test scripts MUST be stored in the same Git repository as the Helm charts.
- FR-02.2: Scripts MUST be deployed to the cluster as Kubernetes ConfigMaps generated from files during Helm install/upgrade.
- FR-02.3: The repository MUST organize scripts by target service and test type using a predictable folder structure.
- FR-02.4: The framework MUST include example scripts for common load-testing patterns: smoke, load, stress, and spike tests.
- FR-02.5: Reusable common libraries (shared k6 utilities, helper functions) MUST be separated from individual scenario files.
- FR-02.6: Adding a new test scenario MUST NOT require modifying the Helm chart templates — only adding a script file and optionally updating values.

### FR-03: Grafana Dashboard Integration

- FR-03.1: The framework MUST deploy Grafana via Helm, assuming Grafana is not already installed.
- FR-03.2: Grafana configuration MUST be split into two clearly separated layers:
  - (a) Common/platform Grafana settings (deployment, persistence, auth, ingress) — in separate files or clearly commented sections.
  - (b) Load-testing-specific settings (dashboards, data sources, folders) — in separate files or clearly commented sections.
- FR-03.3: Pre-built Grafana dashboards MUST be provisioned via Helm for k6 metrics including: request rate, latency percentiles (p50, p90, p95, p99), error rate, virtual user (VU) count, and test status.
- FR-03.4: Dashboards MUST include template variables for filtering by environment, service, test type, and scenario.
- FR-03.5: Dashboards MUST be organized in a dedicated folder (e.g., "Load Testing") within Grafana.
- FR-03.6: Dashboard JSON files MUST be stored in the repository and provisioned automatically during Helm deployment.

### FR-04: Prometheus Integration

- FR-04.1: The framework MUST deploy Prometheus via Helm, assuming Prometheus is not already installed.
- FR-04.2: Prometheus configuration MUST be split into two clearly separated layers:
  - (a) Common/platform Prometheus settings (deployment, retention, storage, scrape defaults) — in separate files or clearly commented sections.
  - (b) Load-testing-specific settings (scrape configs for k6 metrics, recording rules) — in separate files or clearly commented sections.
- FR-04.3: k6 MUST emit metrics to Prometheus using the built-in Prometheus remote-write output.
  - Rationale: This aligns with the Prometheus-optional strategy — when Prometheus is present, k6 writes directly to it. This avoids introducing additional dependencies like InfluxDB.
- FR-04.4: Grafana MUST be configured with Prometheus as a data source for k6 load-testing dashboards.

### FR-05: Namespace and Resource Organization

- FR-05.1: All load-testing components MUST be deployed into a dedicated Kubernetes namespace (e.g., `load-testing`).
- FR-05.2: The namespace MUST be created by the Helm chart if it does not already exist.

### FR-06: Multi-Environment Support

- FR-06.1: The framework MUST support at least 2 environments (staging and production) through Helm values files.
- FR-06.2: Environment-specific configuration (target URLs, thresholds, VU counts, Prometheus endpoints) MUST be managed through separate Helm values files (e.g., `values-staging.yaml`, `values-production.yaml`).
- FR-06.3: A base `values.yaml` MUST define sane defaults that work without environment-specific overrides.

### FR-07: Operational Workflow

- FR-07.1: The framework MUST provide clear documentation on how to: discover available test scenarios, run a test, add or update scripts, and view results.
- FR-07.2: Running a test MUST require minimal manual steps (ideally a single kubectl apply or helm command).
- FR-07.3: The framework MUST include an operational runbook as a documentation artifact.

---

## 2. Non-Functional Requirements

### NFR-01: Helm Manageability

- NFR-01.1: All components (k6-operator, Grafana, Prometheus) MUST be deployable and upgradeable through Helm.
- NFR-01.2: The framework MUST support standard Helm practices: install, upgrade, rollback, uninstall.
- NFR-01.3: Required configuration values MUST be clearly documented and separated from optional overrides.

### NFR-02: Modularity

- NFR-02.1: The Helm chart structure MUST be modular — Prometheus, Grafana, and k6-operator should be manageable as sub-charts or dependencies that can be individually enabled/disabled.
- NFR-02.2: If Grafana or Prometheus already exists in the cluster, the framework MUST support disabling those sub-charts and pointing to existing instances instead.

### NFR-03: Maintainability

- NFR-03.1: The framework MUST be maintainable by platform engineers over time.
- NFR-03.2: Naming conventions for Helm releases, Kubernetes resources, dashboards, and folders MUST be consistent and documented.
- NFR-03.3: The repository structure MUST be predictable and well-documented.

### NFR-04: Usability

- NFR-04.1: Operators and developers MUST be able to use the framework with minimal Kubernetes YAML editing.
- NFR-04.2: New test authors MUST be able to onboard by following documentation without deep Kubernetes knowledge.
- NFR-04.3: The framework MUST provide sane defaults for common test execution patterns.

### NFR-05: Scalability

- NFR-05.1: The script management structure MUST scale to support multiple target services without restructuring.
- NFR-05.2: The framework MUST support adding new services and test types through convention, not chart modification.

### NFR-06: Security (Extension Enabled)

- NFR-06.1: All SECURITY rules (SECURITY-01 through SECURITY-15) are enforced as blocking constraints.
- NFR-06.2: Helm charts MUST NOT contain hardcoded credentials or secrets (SECURITY-12).
- NFR-06.3: Container images MUST use pinned versions, not `latest` tags (SECURITY-10).
- NFR-06.4: Network policies SHOULD restrict traffic to/from load-testing namespace where practical (SECURITY-07).
- NFR-06.5: Grafana and Prometheus deployments MUST follow security hardening baselines (SECURITY-09).

### NFR-07: Testing (Extension Enabled)

- NFR-07.1: All PBT rules (PBT-01 through PBT-10) are enforced as blocking constraints.
- NFR-07.2: Any helper libraries or utility functions in the framework that have identifiable properties MUST have property-based tests.
- NFR-07.3: A PBT framework MUST be selected and documented in tech stack decisions.

---

## 3. Architectural Decisions

### AD-01: k6-operator as Execution Engine

The k6-operator (Grafana's official Kubernetes operator) is selected over plain Kubernetes Jobs because:
- It provides CRD-based test lifecycle management (create, run, stop, cleanup).
- It supports parallelized test execution across multiple pods.
- It integrates natively with Kubernetes and Helm.
- It is actively maintained by Grafana Labs.

### AD-02: Prometheus Remote-Write for Metrics

k6's built-in Prometheus remote-write output is selected because:
- It avoids introducing additional dependencies (no InfluxDB needed).
- It aligns with the Prometheus-optional strategy — if Prometheus exists, k6 writes to it directly.
- It provides native Grafana compatibility via PromQL.
- It supports the common/workflow-specific separation — Prometheus is the metrics backend, Grafana reads from it.

### AD-03: ConfigMap-Based Script Delivery

Scripts stored in Git and deployed as ConfigMaps via Helm is selected because:
- It keeps scripts versioned alongside infrastructure code.
- It uses native Kubernetes primitives (no external artifact stores needed).
- It supports the "add a file, run helm upgrade" workflow for simplicity.
- It works well for small-to-medium script sets (ConfigMap 1MB limit per object).

### AD-04: Umbrella Helm Chart with Sub-Charts

An umbrella chart pattern with k6-operator, Grafana, and Prometheus as sub-chart dependencies is selected because:
- It allows single-command deployment of the entire stack.
- It supports enabling/disabling individual components (e.g., skip Grafana if already installed).
- It follows Helm best practices for multi-component deployments.
- It supports environment-specific overrides through values files.

---

## 4. Scope Boundaries

### In Scope
- Helm chart development (umbrella chart + sub-chart configuration)
- k6-operator deployment and configuration
- Grafana deployment with common/workflow-specific separation
- Prometheus deployment with common/workflow-specific separation
- Pre-built Grafana dashboards for k6 metrics
- Example k6 test scripts (smoke, load, stress, spike)
- Multi-environment values files (staging, production)
- Operational runbook and documentation
- Repository structure and conventions

### Out of Scope
- EKS cluster creation or management
- VPC, networking, or node group configuration
- IAM roles and policies for EKS
- CI/CD pipeline implementation (designed for future integration)
- RBAC restrictions for test execution
- Custom alerting rules (optional future enhancement)
- Ingress configuration for Grafana (documented as optional)

---

## 5. Success Criteria

1. The entire framework can be deployed with a single `helm install` command.
2. Users can add a new k6 test script by adding a file to the scripts directory and running `helm upgrade`.
3. Grafana dashboards show k6 metrics immediately after a test run completes.
4. Common Grafana/Prometheus settings are clearly separated from load-testing-specific settings.
5. The framework supports staging and production environments through values file overrides.
6. Documentation enables a new user to run their first test within 15 minutes of deployment.
