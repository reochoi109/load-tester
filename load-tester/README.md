# k6 Load-Test Kit

`load-tester/`는 k6 시나리오/Flow/config를 재사용할 수 있게 정리한 테스트 키트입니다.

## Prerequisites

- `k6` 설치 (tested: `k6 v1.7.1`)
- `load-tester/config/env.*.json`의 `baseUrl`에 테스트 대상 서버가 실행 중이어야 합니다.

## Run

```bash
make smoke
make regression
make load
make stress
make spike
```

환경 선택:

```bash
make load ENV=staging
make load ENV=prod
```

Flow 선택:

```bash
make load FLOW=user-journey
make load FLOW=user-mix
make load FLOW=post-read
make load FLOW=error-mix
make load FLOW=ws-echo-gorilla
make load FLOW=ws-echo-coder
```

Config 문서:
- `config/CONFIG.md`
