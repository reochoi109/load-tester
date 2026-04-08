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

export default function wsChatGorillaFlow() {
  const wsCfg = cfg.ws || {};
  const intervalMs = wsCfg.messageIntervalMs || 200;
  const sessionMs = wsCfg.sessionMs || 5000;
  const payloadBytes = wsCfg.payloadBytes || 64;
  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/chat/gorilla?room=lobby`;

  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_Chat_Gorilla"),
  };

  let received = 0;
  let sent = 0;

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      const payload = "x".repeat(payloadBytes);
      // Send messages for sessionMs duration.
      const iv = socket.setInterval(() => {
        sent += 1;
        socket.send(`msg:${__VU}:${sent}:${payload}`);
      }, intervalMs);

      socket.setTimeout(() => {
        clearInterval(iv);
        socket.close();
      }, sessionMs);
    });

    socket.on("message", (data) => {
      received += 1;
      check(data, {
        // We expect actual broadcast payloads (non-empty).
        "ws chat message is non-empty": (d) => d && String(d).length > 0,
      });
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  // Minimal sanity: if we're alone we may still receive our own echo via broadcast.
  check(received, {
    "received >= 1 message": (n) => n >= 1,
  });

  thinkTime(0.5, 1.5);
}
