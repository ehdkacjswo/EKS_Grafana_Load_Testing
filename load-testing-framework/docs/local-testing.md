# 로컬 테스트 가이드

EKS에 배포하기 전에 kind를 사용하여 부하 테스트 프레임워크를 로컬에서 검증합니다.

## 사전 요구 사항

- [Docker](https://docs.docker.com/get-docker/) 설치 및 실행 중
- `docker` 그룹에 사용자 추가 (`sudo usermod -aG docker $USER` 후 로그아웃/로그인 또는 `newgrp docker`)
- [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) 설치
- [Helm](https://helm.sh/docs/intro/install/) v3.x 설치
- [kubectl](https://kubernetes.io/docs/tasks/tools/) 설치

## 1. 로컬 클러스터 생성

```bash
kind create cluster --name load-test-validation
```

확인:

```bash
kubectl cluster-info --context kind-load-test-validation
```

## 2. 프레임워크 배포

```bash
# 서브 차트 의존성 가져오기
helm dependency update ./load-testing-framework/charts/load-testing

# 차트 설치
helm install load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing --create-namespace \
  -f load-testing-framework/charts/load-testing/values.yaml \
  --set grafana.adminPassword=admin123
```

모든 Pod가 준비될 때까지 대기:

```bash
kubectl get pods -n load-testing -w
```

## 3. 모의 대상 서비스 배포

k6가 요청을 보낼 대상이 필요합니다. 간단한 nginx echo 서버를 배포합니다:

```bash
kubectl run echo-server --image=nginx:1.27-alpine --port=80 -n load-testing
kubectl expose pod echo-server --port=80 --name=echo-server -n load-testing
```

실행 확인:

```bash
kubectl get pod echo-server -n load-testing
```

## 4. Smoke 테스트 실행

```bash
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=smoke \
  --set testrun.scriptName=smoke-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -
```

테스트 모니터링:

```bash
# TestRun 상태 확인
kubectl get testrun -n load-testing -w

# k6 러너 로그 확인 (Pod가 생성된 후)
kubectl logs -n load-testing -l app=k6 -f
```

## 5. Grafana에서 결과 확인

```bash
kubectl port-forward -n load-testing svc/load-testing-grafana 3000:80
```

브라우저에서 http://localhost:3000 접속
- 사용자명: `admin`
- 비밀번호: `admin123` (또는 2단계에서 설정한 값)
- "Load Testing" 폴더에서 대시보드 확인

## 6. 다른 테스트 유형 실행

```bash
# Load 테스트
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=load \
  --set testrun.scriptName=load-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -

# Stress 테스트
helm template load-testing ./load-testing-framework/charts/load-testing \
  --show-only templates/testrun.yaml \
  --set testrun.enabled=true \
  --set testrun.scriptType=stress \
  --set testrun.scriptName=stress-example.js \
  --set targets.default.baseUrl=http://echo-server.load-testing.svc.cluster.local \
  | kubectl apply -n load-testing -f -
```

## 7. 코드 변경 후 업데이트

스크립트, 템플릿 또는 values를 수정한 경우:

```bash
helm upgrade load-testing ./load-testing-framework/charts/load-testing \
  -n load-testing \
  -f load-testing-framework/charts/load-testing/values.yaml \
  --set grafana.adminPassword=admin123
```

## 8. 정리

```bash
# Helm 릴리스 제거
helm uninstall load-testing -n load-testing

# kind 클러스터 삭제
kind delete cluster --name load-test-validation
```

## 문제 해결

| 증상 | 해결 방법 |
|---|---|
| Docker 소켓 `permission denied` | `sudo usermod -aG docker $USER` 후 `newgrp docker` |
| `kubectl: command not found` | kubectl 설치: `curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && chmod +x kubectl && sudo mv kubectl /usr/local/bin/` |
| TestRun이 "created" 상태에서 멈춤 | k6-operator 로그 확인: `kubectl logs -n load-testing -l app.kubernetes.io/name=k6-operator -f` |
| k6 Pod CrashLoopBackOff | 스크립트 오류 확인: `kubectl logs -n load-testing -l app=k6` |
| Grafana 대시보드에 데이터 없음 | Prometheus 실행 확인: `kubectl get pods -n load-testing -l app.kubernetes.io/name=prometheus` |
| Pod가 Pending 상태에서 멈춤 | kind 노드 리소스 부족 가능. `kubectl describe pod <이름> -n load-testing`으로 이벤트 확인 |
