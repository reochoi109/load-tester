import ws from "k6/ws";
import { check } from "k6";

import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";

const cfg = loadConfig(
  __ENV.K6_CONFIG || "load-tester/config/env.staging.json",
);
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

function toWsBaseUrl(baseUrl) {
  return baseUrl.replace(/^http/, "ws");
}

export default function wsSoakGorillaFlow() {
  const wsCfg = cfg.ws || {};
  const soakMs = wsCfg.soakMs || 10 * 60 * 1000; // default 10m
  const intervalMs = wsCfg.messageIntervalMs || 10000; // default 10s

  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/echo/gorilla`;
  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_Soak_Gorilla"),
  };

  let gotAnyMessage = false;

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      const iv = socket.setInterval(() => {
        socket.send(`soak:${__VU}:${Date.now()}`);
      }, intervalMs);

      socket.setTimeout(() => {
        clearInterval(iv);
        socket.close();
      }, soakMs);
    });

    socket.on("message", () => {
      gotAnyMessage = true;
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  check(gotAnyMessage, {
    "received at least 1 echo": (v) => v === true,
  });
}
