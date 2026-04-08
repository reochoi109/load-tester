# Go Test Server

`server/`는 `load-tester/`의 k6 시나리오를 로컬에서 바로 실행해볼 수 있도록 만든 테스트용 API 서버입니다.

## Prerequisites

- `go` (tested: `go1.21.5`, 권장: `>= 1.21`)

## Run

```bash
cd server
go run ./cmd
```

기본 주소:
- `http://localhost:8080`

## Endpoints (k6용)

- `GET /health`
- `POST /auth/login`
- `POST /auth/logout`
- `GET|PUT /users/me`
- `GET /users/{id}`
- `GET /posts/{id}`
- `GET /__server_error__`
- `GET /__non_json__`
- `GET /__timeout__`
- `GET /ws/echo/gorilla` (WebSocket)
- `GET /ws/echo/coder` (WebSocket)
- `GET /ws/chat/gorilla` (WebSocket)
- `GET /ws/chat/coder` (WebSocket)
