# Requirements Verification Questions

Please answer the following questions to help clarify the requirements for the Helm-managed load-testing framework. Fill in the letter choice after each [Answer]: tag.

---

## Question 1
What is the current state of Grafana in your EKS cluster?

A) Grafana is already installed and managed via Helm (e.g., kube-prometheus-stack or standalone Grafana Helm chart)
B) Grafana is installed but not managed via Helm (e.g., manually deployed or operator-managed)
C) Grafana is not currently installed in the cluster
D) Unsure — need to check
E) Other (please describe after [Answer]: tag below)

[Answer]: Assume that Grafana is not installed, but build seperate files or leave some comments so that I can distinguish the common Grafana setting and specific setting for current workflow.

---

## Question 2
What is the current state of Prometheus in your EKS cluster?

A) Prometheus is already installed and managed via Helm (e.g., kube-prometheus-stack or prometheus-community chart)
B) Prometheus is installed but not managed via Helm
C) Prometheus is not currently installed in the cluster
D) Unsure — need to check
E) Other (please describe after [Answer]: tag below)

[Answer]: Assume that Prometheus is not installed, but build seperate files or leave some comments so that I can distinguish the common Prometheus setting and specific setting for current workflow.

---

## Question 3
For k6 execution in Kubernetes, which deployment model do you prefer?

A) k6-operator (Grafana's official Kubernetes operator for k6) — uses CRDs to manage test runs as Kubernetes resources
B) Helm-managed Kubernetes Jobs — each test run creates a Job via Helm or templated manifests
C) No preference — recommend the best approach for this use case
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 4
How should k6 emit metrics for Grafana dashboards?

A) k6 outputs to Prometheus via Prometheus remote-write (k6 has built-in Prometheus remote-write output)
B) k6 outputs to InfluxDB, and Grafana reads from InfluxDB
C) k6 outputs to Grafana Cloud or Grafana Loki
D) No preference — recommend the best approach that aligns with the Prometheus-optional strategy
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 5
How many target services or applications will this framework initially test?

A) 1 service (single target to start)
B) 2-5 services
C) 6+ services
D) Unsure — want a flexible structure that scales
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 6
How many environments will this framework need to support (e.g., dev, staging, production)?

A) 1 environment only
B) 2 environments (e.g., staging + production)
C) 3+ environments (e.g., dev + staging + production)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7
What Kubernetes namespace strategy do you prefer for the load-testing components?

A) Dedicated namespace (e.g., `load-testing`) for all load-testing resources
B) Deploy into an existing shared namespace (e.g., `monitoring` or `tools`)
C) No preference — recommend the best approach
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
For test script management, what is your preferred source of truth?

A) Git repository — scripts stored in the same repo as the Helm charts, deployed via ConfigMaps generated from files
B) Git repository — scripts stored in a separate repo, packaged as a container image or artifact
C) ConfigMaps managed directly through Helm values (inline scripts in values.yaml)
D) No preference — recommend the simplest approach for a small-to-medium number of scripts
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
What test execution patterns are most important initially?

A) Manual execution only — operators trigger tests on demand
B) Manual execution with the option to integrate into CI/CD later
C) CI/CD-driven execution from the start (e.g., triggered by pipeline)
D) Scheduled/cron-based execution
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
Should the framework include example/starter k6 test scripts as part of the initial delivery?

A) Yes — include example scripts for common patterns (smoke, load, stress, spike)
B) Yes — include a minimal example script only
C) No — just provide the framework and documentation for writing scripts
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 11
What level of Grafana dashboard customization do you need at initial delivery?

A) Full dashboards — pre-built dashboards for k6 metrics (request rate, latency percentiles, error rate, VUs, test status) provisioned via Helm
B) Dashboard templates — JSON dashboard files included in the chart, users import manually
C) Dashboard guidance only — documentation on what to build, no pre-built dashboards
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12
Do you need RBAC (Role-Based Access Control) considerations for who can run load tests in the cluster?

A) Yes — restrict test execution to specific Kubernetes service accounts or roles
B) No — anyone with cluster access can run tests
C) Not initially, but design for it to be added later
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 13: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 14: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
D) Other (please describe after [Answer]: tag below)

[Answer]: A
