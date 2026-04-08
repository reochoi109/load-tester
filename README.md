# Load-Test Playground (k6 + Go)

k6 성능 테스트를 위한 예제와 테스트용 Go 서버를 모아둔 미니 프로젝트입니다.

구성 요소:

- `load-tester/`: k6 Load-Test Kit (시나리오 + Flow + config 템플릿)
- `server/`: k6 시나리오를 바로 테스트할 수 있는 Go 테스트 서버

## Prerequisites

- `k6` 설치 (tested: `k6 v1.7.1`)
- `go` 설치 (Go 서버 실행용, tested: `go1.21.5`, 권장: `>= 1.21`)
- `make` 사용 가능해야 함

## Install

별도의 패키지 설치는 없습니다.

설치 예시 (macOS + Homebrew):

```bash
brew install k6
brew install go
```

## Run

1. Go 서버 실행 (터미널 1)

```bash
cd server
go run ./cmd
```

2. k6 실행 (터미널 2)

```bash
make smoke
make load
```

환경(config) 선택:

```bash
make load ENV=staging
make load ENV=prod
```

Flow를 지정해 특정 흐름만 실행:

```bash
make load FLOW=user-journey
make load FLOW=post-read
make load FLOW=error-mix
```

추가 k6 플래그:

```bash
make load K6_ARGS="--no-thresholds"
```

## Makefile 인터페이스

`make load`는 내부적으로 아래 환경변수들을 k6에 전달합니다.

- `ENV`: 실행 환경 선택 (Default = `staging`)
- `CONFIG`: config 파일 경로(직접 지정 가능)
- `FLOW`: 실행할 Flow 이름
- `K6_ARGS`: `k6 run`에 추가로 넘길 플래그

## 이 레포를 “실전”에서 쓰는 방식

- 신규/변경 API가 생기면: `load-tester/flows/`에 Flow 추가 → `flows/index.js` 등록
- 운영에 가까운 부하 검증은: `user-mix`처럼 “행동 비율(가중치)로” Mix 테스트를 구성
- 배포 직후에는: `smoke`로 빠르게 확인 → `regression/load`로 성능 회귀 확인

## License

MIT (see `LICENSE`).
