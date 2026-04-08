import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

// JSON 아닌 응답 유도
export default function nonJsonFlow() {
  const path = (cfg.errorPaths && cfg.errorPaths.nonJson) || "/__non_json__";

  http.get(`${cfg.baseUrl}${path}`, {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: { name: "ErrorNonJson_API" },
  });

  thinkTime(0.5, 1.5);
}
