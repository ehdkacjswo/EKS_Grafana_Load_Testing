# 아키텍처 개요

## 구성 요소 다이어그램

```
+---------------------------------------------------+
|                  EKS 클러스터                        |
|                                                    |
|  +----------------------------------------------+ |
|  |          load-testing 네임스페이스               | |
|  |                                               | |
|  |  +--------------+    +--------------------+   | |
|  |  | k6-operator  |    | Prometheus 서버     |   | |
|  |  | (Helm 차트)   |    | (Helm 서브 차트)    |   | |
|  |  +------+-------+    +--------+-----------+   | |
|  |         |                     ^               | |
|  |         | 생성                 | remote-write  | |
|  |         v                     |               | |
|  |  +--------------+            |               | |
|  |  | k6 러너      +------------+               | |
|  |  | Pod (Jobs)   |                            | |
|  |  +------+-------+                            | |
|  |         |                                     | |
|  |         | 스크립트 읽기                         | |
|  |         v                                     | |
|  |  +--------------+    +--------------------+   | |
|  |  | ConfigMaps   |    | Grafana            |   | |
|  |  | (k6 스크립트) |    | (Helm 서브 차트)    |   | |
|  |  +--------------+    +--------+-----------+   | |
|  |                               |               | |
|  |                               | 쿼리           | |
|  |                               v               | |
|  |                      +--------+-----------+   | |
|  |                      | Prometheus 서버     |   | |
|  |                      | (PromQL 데이터 소스) |   | |
|  |                      +--------------------+   | |
|  +----------------------------------------------+ |
+---------------------------------------------------+
```

## 데이터 흐름

1. Operator가 k6 TestRun을 트리거 (kubectl apply 또는 helm template 사용)
2. k6-operator가 TestRun 스펙에 따라 k6 러너 Pod를 생성
3. 러너 Pod가 ConfigMap에서 테스트 스크립트를 읽음
4. 실행 중 k6가 remote-write를 통해 Prometheus에 메트릭 전송
5. Grafana가 Prometheus를 쿼리하여 대시보드에 표시

## Helm 차트 구조

```
load-testing-framework/
  charts/load-testing/           # 우산 차트
    Chart.yaml                   # 의존성: k6-operator, grafana, prometheus
    values.yaml                  # 기본 설정값
    values-staging.yaml          # 스테이징 환경 오버라이드
    values-production.yaml       # 프로덕션 환경 오버라이드
    templates/
      _helpers.tpl               # 공용 템플릿 헬퍼
      namespace.yaml             # 네임스페이스 생성
      configmap-scripts.yaml     # k6 스크립트를 ConfigMap으로 배포
      testrun.yaml               # k6 TestRun CRD 템플릿
      grafana-dashboards-configmap.yaml  # 대시보드 프로비저닝
    dashboards/
      k6-overview.json           # 개요 대시보드
      k6-test-detail.json        # 상세 대시보드
    scripts/                     # k6 테스트 스크립트 (원본)
      lib/helpers.js             # 공용 k6 유틸리티
      smoke/                     # Smoke 테스트 스크립트
      load/                      # Load 테스트 스크립트
      stress/                    # Stress 테스트 스크립트
      spike/                     # Spike 테스트 스크립트
    grafana/
      grafana-common-values.yaml     # 플랫폼 Grafana 설정
      grafana-loadtest-values.yaml   # 부하 테스트 Grafana 설정
    prometheus/
      prometheus-common-values.yaml     # 플랫폼 Prometheus 설정
      prometheus-loadtest-values.yaml   # 부하 테스트 Prometheus 설정
  docs/
    runbook.md                   # 운영 런북
    adding-scripts.md            # 스크립트 작성 가이드
    architecture.md              # 이 문서
  README.md                      # 프로젝트 README
```

## 설정 계층

| 계층 | 용도 | 파일 |
|---|---|---|
| 기본 설정 | 모든 환경의 기본값 | `values.yaml` |
| 환경별 오버라이드 | 환경별 세부 조정 | `values-staging.yaml`, `values-production.yaml` |
| Grafana 공통 | 플랫폼 수준 Grafana 설정 | `grafana/grafana-common-values.yaml` |
| Grafana 부하 테스트 | 워크플로우별 대시보드 및 데이터 소스 | `grafana/grafana-loadtest-values.yaml` |
| Prometheus 공통 | 플랫폼 수준 Prometheus 설정 | `prometheus/prometheus-common-values.yaml` |
| Prometheus 부하 테스트 | k6 remote-write 및 스크레이프 설정 | `prometheus/prometheus-loadtest-values.yaml` |

## 기존 Grafana 또는 Prometheus 재사용

클러스터에 이미 Grafana 또는 Prometheus가 있는 경우:

1. values.yaml에서 `grafana.enabled=false` 및/또는 `prometheus.enabled=false` 설정
2. `k6.prometheus.remoteWriteUrl`을 기존 Prometheus를 가리키도록 업데이트
3. `dashboards/`의 대시보드 JSON 파일을 기존 Grafana에 가져오기
4. 기존 Grafana에서 Prometheus 인스턴스를 가리키는 데이터 소스 설정
