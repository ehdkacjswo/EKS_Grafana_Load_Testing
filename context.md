Project context: Build a Helm-managed load-testing framework inside an already operational EKS cluster

Objective
Build a reusable, Helm-managed load-testing framework inside an existing Amazon EKS cluster. The cluster itself is already fully configured and healthy, so infrastructure provisioning, cluster bootstrap, networking foundations, IAM foundations, and baseline EKS operations are out of scope. The work should focus on deploying and organizing the load-testing components, their configuration, and the operational workflow for running and observing tests.

Scope assumptions

* The EKS cluster already exists and is functioning correctly.
* Core cluster infrastructure is already handled outside this project.
* Helm is the required package management and deployment method for all desired components.
* k6 is the primary load-generation tool.
* Grafana is required for dashboards and result visualization.
* Prometheus is optional and should be treated as a recommended observability component, not an unconditional requirement.
* Grafana may already be installed and partially configured in the cluster.
* The framework should make test script management easy for end users and operators.
* The framework should be designed for repeatable use, not as a one-off test deployment.

Primary goals

1. Deploy a Kubernetes-native load-testing capability in the existing EKS cluster.
2. Standardize deployment and lifecycle management through Helm charts.
3. Support easy authoring, storage, update, and execution of k6 test scripts.
4. Provide clear observability for load tests through Grafana.
5. Support Prometheus-based metrics collection when Prometheus is available or when adopting it adds clear value.
6. Separate default Grafana setup assumptions from custom Grafana configuration needed specifically for the load-testing workflow.
7. Minimize operational friction for users who need to run or update tests.

Non-goals

* Do not redesign or recreate the EKS cluster.
* Do not solve foundational infrastructure concerns such as VPC, node bootstrap, cluster creation, or cluster security baseline.
* Do not assume the need to build a custom observability platform from scratch if existing Grafana or Prometheus components are already present.
* Do not require users to manually edit Kubernetes resources for every test run unless no better workflow is practical.

Desired solution characteristics

* Fully manageable through Helm.
* Modular and upgrade-friendly.
* Compatible with an existing EKS environment.
* Usable by operators and developers with minimal Kubernetes YAML editing.
* Clear separation between platform configuration and test content.
* Easy onboarding for new test authors.
* Supports repeatable execution patterns such as smoke, baseline, stress, and regression tests.
* Suitable for future CI/CD integration, even if CI/CD is not the initial delivery scope.

Preferred architecture direction

* Use k6 as the primary load-generation engine.
* Use Grafana as the visualization and dashboard layer.
* Use Prometheus if needed for metrics scraping, time-series storage, and richer observability around load tests and target services.
* Prefer a Kubernetes-native execution model for k6 workloads.
* Prefer Helm charts for installation, upgrades, values management, and environment-specific overrides.
* Treat the load-testing capability as an internal platform feature within the cluster.

Prometheus position
Prometheus is optional but likely beneficial. If included, it should serve as the metrics collection and query backend for load-test-related observability and for correlation with application or platform metrics. If Prometheus is already present in the cluster, the design should reuse it rather than introduce a parallel stack. If Prometheus is not present, the workflow should evaluate whether it is necessary for the desired Grafana dashboards and operational insight. Prometheus should not be assumed as mandatory if Grafana already has a sufficient data source strategy for the expected workflow.

Grafana requirements

A. Default Grafana settings
These are the baseline assumptions or shared platform-level settings that may already exist:

* Grafana deployment may already be installed in the cluster.
* Existing authentication, ingress, persistence, admin controls, and organization-level settings may already be managed elsewhere.
* Existing data sources may already be configured.
* Existing dashboard folder structure and user permissions may already be defined.
* Existing alerting configuration may already be present.
* Existing Grafana should be reused where practical instead of duplicated.

B. Custom Grafana settings for this load-testing workflow
These are the load-testing-specific additions or adjustments:

* Dedicated dashboard folder or namespace for load-testing dashboards.
* Data source configuration or reuse plan for k6-related metrics and, if applicable, Prometheus.
* Dashboards tailored for test execution visibility, including request rate, latency, error rate, VU behavior, and test status.
* Dashboards that correlate load-test signals with service or platform metrics where available.
* Naming conventions for dashboards, folders, and data sources tied to the load-testing domain.
* Optional alerting rules relevant to test execution or abnormal system behavior during tests.
* Variables and filters to select environment, service, test type, scenario, or release version.
* A clear distinction between shared Grafana platform configuration and load-testing-specific dashboard assets.

Test script management requirements
Easy script management is a major requirement. The solution should prioritize a workflow that makes it simple to create, store, update, version, review, and execute k6 scripts. The design should evaluate and recommend the best script management model for this environment, such as:

* Git-based script storage as the source of truth.
* Helm values or chart-driven references to script bundles.
* ConfigMap-based script delivery for smaller scripts.
* Mounted volumes or artifact packaging if script sets become large or structured.
* Clear separation between reusable common libraries and individual scenario files.
* A user-friendly method to add new test scenarios without rebuilding the entire framework manually.
* Simple conventions for organizing scripts by target service, environment, and test type.

User experience requirements
The framework should be easy for end users to operate. The desired user experience includes:

* A clear way to discover available test scenarios.
* A clear way to run a scenario with minimal manual steps.
* A simple way to update or add scripts.
* A predictable naming and folder structure.
* Minimal need to understand low-level Kubernetes internals.
* Sane defaults for common test execution patterns.
* Documentation artifacts that explain where scripts live, how they are packaged, how they are deployed, and how they are run.

Operational requirements

* Helm must be the primary deployment interface.
* The framework should support environment-specific values through Helm values files.
* The framework should support upgrades and rollback using normal Helm practices.
* The framework should avoid unnecessary duplication if Grafana or Prometheus already exists.
* The framework should clearly document required configuration values versus optional overrides.
* The framework should be maintainable by platform engineers over time.

Design questions the workflow should resolve

1. What is the best Helm-managed deployment pattern for k6 in this cluster?
2. Should Prometheus be required, optional, or reused from an existing deployment?
3. How should Grafana integration be split between default/shared settings and workflow-specific customization?
4. What is the best script management strategy for ease of use and maintainability?
5. How should users trigger tests: manually, through Helm-driven resources, through Kubernetes custom resources, or through a lightweight operational interface?
6. How should test assets, dashboard assets, and environment-specific configuration be organized in the repository?
7. What should be the minimum viable implementation versus the recommended production-ready implementation?

Expected outputs from the workflow
The workflow should produce a practical implementation plan and delivery structure for:

* Helm-managed deployment of k6-based load testing components.
* Optional or integrated Prometheus usage strategy.
* Grafana integration plan with a split between default settings and custom workflow settings.
* Script management model and repository organization.
* Example values structure for different environments.
* Operational runbook for adding scripts, deploying changes, and executing tests.
* Dashboard strategy for load-testing observability.
* Recommended conventions and guardrails for maintainability.

Implementation preference
Prefer a solution that is simple, reusable, and easy for users to operate over one that is maximally feature-rich but operationally heavy. Reuse existing in-cluster Grafana and Prometheus capabilities where possible. Optimize for Helm-based manageability and script authoring simplicity.

Success criteria
The solution is successful if:

* It can be deployed and managed through Helm.
* Users can add and manage k6 scripts without excessive Kubernetes complexity.
* Grafana cleanly supports the load-testing workflow with clear separation between shared defaults and custom load-testing configuration.
* Prometheus integration is handled pragmatically based on whether it already exists and whether it adds value.
* The framework feels like a maintainable internal platform capability rather than a one-time experiment.
