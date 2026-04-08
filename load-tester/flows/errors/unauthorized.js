import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

// 401/403 유도 (잘못된 토큰 또는 인증 없음)
export default function unauthorizedFlow() {
  const path = (cfg.errorPaths && cfg.errorPaths.unauthorized) || "/users/me";
  const badToken = "invalid-token";

  http.get(`${cfg.baseUrl}${path}`, {
    headers: buildAuthHeaders(authMode, badToken, authCfg),
    tags: { name: "Error401_API" },
  });

  thinkTime(0.5, 1.5);
}
