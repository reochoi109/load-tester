import ws from "k6/ws";
import { check } from "k6";

import { loadConfig } from "../../common/config/load-config.js";
import { buildAuthHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";
import { thinkTime } from "../../common/utils/time.js";
import { randomInt } from "../../common/utils/random.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};

function toWsBaseUrl(baseUrl) {
  return baseUrl.replace(/^http/, "ws");
}

export default function wsRoomChatCoderFlow() {
  const wsCfg = cfg.ws || {};
  const roomCount = wsCfg.roomCount || 5;
  const intervalMs = wsCfg.messageIntervalMs || 200;
  const sessionMs = wsCfg.sessionMs || 5000;
  const payloadBytes = wsCfg.payloadBytes || 64;

  const roomId = randomInt(1, roomCount);
  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/chat/coder?room=${roomId}`;

  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_RoomChat_Coder"),
  };

  let received = 0;
  let sent = 0;

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      const payload = "x".repeat(payloadBytes);
      const iv = socket.setInterval(() => {
        sent += 1;
        socket.send(`room:${roomId}:${__VU}:${sent}:${payload}`);
      }, intervalMs);

      socket.setTimeout(() => {
        clearInterval(iv);
        socket.close();
      }, sessionMs);
    });

    socket.on("message", (data) => {
      received += 1;
      check(data, {
        "ws room chat message is non-empty": (d) => d && String(d).length > 0,
      });
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  check(received, {
    "received >= 1 message": (n) => n >= 1,
  });

  thinkTime(0.5, 1.5);
}
