import ws from "k6/ws";
import { check } from "k6";

import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";
import { thinkTime } from "../../common/utils/time.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

function toWsBaseUrl(baseUrl) {
  // http -> ws, https -> wss
  return baseUrl.replace(/^http/, "ws");
}

// WebSocket echo flow (Go server: gorilla implementation)
export default function wsEchoGorillaFlow() {
  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/echo/gorilla`;

  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_Echo_Gorilla"),
  };

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      socket.send("hello");
      socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
      socket.setTimeout(() => socket.close(), 1000);
    });

    socket.on("message", (data) => {
      check(data, {
        "ws echo message is non-empty": (d) => d && String(d).length > 0,
      });
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  thinkTime(0.5, 1.5);
}

