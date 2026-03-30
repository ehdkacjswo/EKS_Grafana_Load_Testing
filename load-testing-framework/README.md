# 부하 테스트 프레임워크

Amazon EKS용 Helm 기반 k6 부하 테스트 프레임워크. Grafana 대시보드와 Prometheus 메트릭을 포함합니다.

## 빠른 시작

```bash
# 1. Helm 의존성 업데이트
helm dependency update ./load-testing-framework/charts/load-testing

# 2. 배포 (스테이징)
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml \
  --set grafana.adminPassword=<비밀번호>

# 3. Smoke 테스트 실행
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  | kubectl apply -n load-testing -f -

# 4. Grafana에서 결과 확인
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
# http://localhost:3000 접속 → "Load Testing" 폴더
```

## 사전 요구 사항

- Amazon EKS 클러스터 (실행 중이며 접근 가능)
- 클러스터에 연결된 `kubectl`
- `helm` v3.x

## 구성 요소

| 구성 요소 | 용도 | Helm 차트 |
|---|---|---|
| k6-operator | Kubernetes CRD로 k6 테스트 실행 관리 | grafana/k6-operator |
| Grafana | 대시보드 시각화 | grafana/grafana |
| Prometheus | 메트릭 저장소 (k6 remote-write 대상) | prometheus-community/prometheus |

모든 구성 요소는 선택 사항입니다. 클러스터에 이미 존재하는 경우 해당 서브 차트를 비활성화하세요.

## 문서

- [운영 런북](docs/runbook.md) — 배포, 테스트 실행, 결과 확인, 업그레이드
- [스크립트 추가](docs/adding-scripts.md) — 새 k6 테스트 스크립트 추가 방법
- [아키텍처](docs/architecture.md) — 구성 요소 다이어그램, 데이터 흐름, 설정 계층

## 테스트 유형

| 유형 | 목적 | VU 수 | 소요 시간 |
|---|---|---|---|
| Smoke | 서비스 정상 여부 확인 | 1-2 | ~1분 |
| Load | 성능 기준선 측정 | 20-50 | ~7분 |
| Stress | 한계점 탐색 | 50-200 | ~14분 |
| Spike | 급격한 트래픽 급증 | 5-200 | ~8분 |

## 프로젝트 구조

```
load-testing-framework/
  charts/load-testing/       # Helm 우산 차트 (scripts/ 포함)
  docs/                      # 운영 문서
```
