import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

// 404 유도 (존재하지 않는 경로)
export default function notFoundFlow() {
  const path = (cfg.errorPaths && cfg.errorPaths.notFound) || "/__not_found__";

  http.get(`${cfg.baseUrl}${path}`, {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: { name: "Error404_API" },
  });

  thinkTime(0.5, 1.5);
}
