# Config (env.\*.json)

`load-tester/config/env.*.json`은 k6가 사용할 **환경 설정 파일**입니다.

## 사용

```bash
make load ENV=staging
make load ENV=prod
make load CONFIG=load-tester/config/env.staging.json
```

> JSON에는 주석을 넣을 수 없습니다. 설명은 이 문서에만 둡니다.

## Templates

### Development (예시)

```json
{
  "baseUrl": "http://localhost:8080",
  "token": "DEV_TOKEN",
  "authMode": "token",
  "auth": {
    "loginPath": "/auth/login",
    "logoutPath": "/auth/logout",
    "tokenHeader": "Authorization",
    "tokenPrefix": "Bearer "
  },
  "minPostBytes": 3000,
  "errorMixEnabled": true,
  "errorMixWeights": {
    "notFound": 40,
    "unauthorized": 20,
    "serverError": 15,
    "nonJson": 15,
    "timeout": 10
  },
  "errorPaths": {
    "notFound": "/__not_found__",
    "unauthorized": "/users/me",
    "serverError": "/__server_error__",
    "nonJson": "/__non_json__",
    "timeout": "/__timeout__"
  },
  "errorTimeout": {
    "request": "1s"
  },
  "thresholds": {
    "http_req_failed": ["rate<0.03"],
    "http_req_duration": ["p(95)<600"]
  }
}
```

### Production (예시)

```json
{
  "baseUrl": "https://api.example.com",
  "token": "PROD_TOKEN",
  "authMode": "token",
  "auth": {
    "loginPath": "/auth/login",
    "logoutPath": "/auth/logout",
    "tokenHeader": "Authorization",
    "tokenPrefix": "Bearer "
  },
  "minPostBytes": 10000,
  "errorMixEnabled": false,
  "errorMixWeights": {
    "notFound": 40,
    "unauthorized": 20,
    "serverError": 15,
    "nonJson": 15,
    "timeout": 10
  },
  "errorPaths": {
    "notFound": "/__not_found__",
    "unauthorized": "/users/me",
    "serverError": "/__server_error__",
    "nonJson": "/__non_json__",
    "timeout": "/__timeout__"
  },
  "errorTimeout": {
    "request": "1s"
  },
  "thresholds": {
    "http_req_failed": ["rate<0.01"],
    "http_req_duration": ["p(95)<300"]
  }
}
```

## Options (Quick)

- `baseUrl`: 대상 서버 주소
- `token`: 고정 토큰(테스트용). `authMode=token`에서 사용
- `authMode`: `token | cookie | none`
- `auth.loginPath`: 로그인 API path (기본 `/auth/login`)
- `auth.logoutPath`: 로그아웃 API path (기본 `/auth/logout`)
- `auth.tokenHeader`: 토큰 헤더 이름 (기본 `Authorization`)
- `auth.tokenPrefix`: 토큰 접두사 (기본 `Bearer `)
- `minPostBytes`: 게시물 조회 응답(body) 최소 길이(긴 본문 가정)
- `errorMixEnabled`: 오류 mix flow 활성화 여부
- `errorMixWeights`: 오류 mix 가중치(상대 비율)
- `errorPaths`: 오류 유도 경로들
- `errorTimeout.request`: timeout 유도 시 요청 timeout 값 (예: `1s`)
- `thresholds`: k6 thresholds 규칙

## thresholds (필수만)

기본 형태:

```json
{
  "thresholds": {
    "http_req_failed": ["rate<0.01"],
    "http_req_duration": ["p(95)<300", "p(99)<800"]
  }
}
```

특정 API만 thresholds를 걸고 싶으면 태그 필터를 사용합니다.

```json
{
  "thresholds": {
    "http_req_duration{name:PostRead_API}": ["p(95)<800"]
  }
}
```

실패 시 중단 옵션(선택):

```json
{
  "thresholds": {
    "http_req_failed": [
      { "threshold": "rate<0.01", "abortOnFail": true, "delayAbortEval": "30s" }
    ]
  }
}
```

`error-mix` 주의:

- `error-mix`는 의도적으로 실패(401/404/500/timeout)를 만들기 때문에 `http_req_failed` thresholds를 그대로 두면 거의 항상 실패합니다.
- 권장: `error-mix`는 별도로 실행하고, 필요하면 `K6_ARGS="--no-thresholds"`로 분리 실행합니다.
