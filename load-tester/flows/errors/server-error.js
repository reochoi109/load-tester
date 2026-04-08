import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

// 500 유도 (서버 에러 경로)
export default function serverErrorFlow() {
  const path = (cfg.errorPaths && cfg.errorPaths.serverError) || "/__server_error__";

  http.get(`${cfg.baseUrl}${path}`, {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: { name: "Error500_API" },
  });

  thinkTime(0.5, 1.5);
}
