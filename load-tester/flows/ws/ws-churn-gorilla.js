import ws from "k6/ws";
import { check } from "k6";

import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(
  __ENV.K6_CONFIG || "load-tester/config/env.staging.json",
);
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

function toWsBaseUrl(baseUrl) {
  return baseUrl.replace(/^http/, "ws");
}

export default function wsChurnGorillaFlow() {
  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/echo/gorilla`;

  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_Churn_Gorilla"),
  };

  let gotEcho = false;

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      socket.send(`churn:${__VU}:${Date.now()}`);
      socket.setTimeout(() => socket.close(), 250);
    });

    socket.on("message", () => {
      gotEcho = true;
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  check(gotEcho, {
    "received echo (best-effort)": (v) => v === true,
  });

  thinkTime(0.1, 0.3);
}
