// 헬스 체크용 요청 흐름
import http from "k6/http";
import {
  checkBodyIncludes,
  checkResponseTime,
  checkStatus,
} from "../../common/checks/http.js";
import { loadConfig } from "../../common/config/load-config.js";
import { buildHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";
import { thinkTime } from "../../common/utils/time.js";

// 실행 시 사용할 환경 설정 로드 (기본: staging)
const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");

// 헬스 체크 요청 흐름
export default function healthFlow() {
  const headers = buildHeaders(cfg.token);

  const res = http.get(`${cfg.baseUrl}/health`, {
    headers,
    tags: tag("HealthCheck_API"),
  });

  checkStatus(res, 200);
  checkBodyIncludes(res, "OK");
  checkResponseTime(res, 500);

  thinkTime(1, 2);
}
