import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

// 지연 응답 유도 + 짧은 타임아웃
export default function timeoutFlow() {
  const path = (cfg.errorPaths && cfg.errorPaths.timeout) || "/__timeout__";
  const timeout = (cfg.errorTimeout && cfg.errorTimeout.request) || "1s";

  http.get(`${cfg.baseUrl}${path}`, {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    timeout,
    tags: { name: "ErrorTimeout_API" },
  });

  thinkTime(0.5, 1.5);
}
