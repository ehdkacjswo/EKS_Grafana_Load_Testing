# 운영 런북 — 부하 테스트 프레임워크

## 사전 요구 사항

- 대상 EKS 클러스터에 접근 가능한 `kubectl`
- `helm` v3.x 설치
- `load-testing` 클러스터 네임스페이스 (차트에서 자동 생성)

## 1. 프레임워크 배포

### 최초 설치 (스테이징)

```bash
# Helm 의존성 업데이트
helm dependency update ./load-testing-framework/charts/load-testing

# 스테이징 오버라이드로 설치
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml \
  --set grafana.adminPassword=<비밀번호>
```

### 최초 설치 (프로덕션)

```bash
helm dependency update ./load-testing-framework/charts/load-testing

helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-production.yaml \
  --set grafana.adminPassword=<비밀번호>
```

## 2. 부하 테스트 실행

### 방법 A: TestRun 렌더링 후 적용

```bash
# Smoke 테스트용 TestRun 템플릿 렌더링
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  | kubectl apply -n load-testing -f -
```

### 방법 B: TestRun 직접 적용

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

### 실행 중인 테스트 모니터링

```bash
# TestRun 상태 확인
kubectl get testrun -n load-testing -w

# k6 러너 Pod 로그 확인
kubectl logs -n load-testing -l app=k6 -f
```

## 3. Grafana에서 결과 확인

```bash
# Grafana 포트 포워딩
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
```

http://localhost:3000 접속 후 "Load Testing" 폴더로 이동
- k6 개요: 요청 속도, 지연시간 백분위수, 오류율, VU 수
- k6 테스트 상세: 테스트별 분석, 히스토그램, 오류 코드

## 4. 프레임워크 업그레이드

```bash
helm dependency update ./load-testing-framework/charts/load-testing

helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  -f load-testing-framework/charts/load-testing/values-staging.yaml
```

## 5. 롤백

```bash
# 리비전 목록 확인
helm history load-testing -n load-testing

# 이전 리비전으로 롤백
helm rollback load-testing <리비전> -n load-testing
```

## 6. 제거

```bash
helm uninstall load-testing -n load-testing
kubectl delete namespace load-testing
```

## 7. 문제 해결

| 증상 | 확인 방법 |
|---|---|
| TestRun이 "created" 상태에서 멈춤 | `kubectl describe testrun <이름> -n load-testing` — k6-operator 로그 확인 |
| Grafana에 메트릭 없음 | Prometheus 실행 확인: `kubectl get pods -n load-testing` |
| k6 Pod CrashLoopBackOff | 스크립트 구문 확인: `kubectl logs <Pod> -n load-testing` |
| 대시보드에 데이터 없음 | Grafana의 데이터 소스 URL이 Prometheus 서비스와 일치하는지 확인 |
