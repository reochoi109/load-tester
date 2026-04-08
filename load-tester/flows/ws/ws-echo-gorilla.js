import ws from "k6/ws";
import { check } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

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
  // http -> ws, https -> wss
  return baseUrl.replace(/^http/, "ws");
}

const ws_sent = new Counter("ws_echo_sent"); // 보낸 수
const ws_recv = new Counter("ws_echo_recv"); // 받은 수
const ws_ack_ok = new Rate("ws_echo_ack_ok"); // 성공률
const ws_parse_error = new Rate("ws_echo_parse_error"); // 수신 메세지 파싱 실패율
const ws_rtt_ms = new Trend("ws_echo_rtt_ms", true); // round-trip time

// WebSocket echo flow (Go server: gorilla implementation).
// Purpose:
// - measure RTT based on 1:1 echo (send -> receive same id)
// - treat "pending without echo" as missing acks (drop/timeout)
export default function wsEchoGorillaFlow() {
  const wsCfg = cfg.ws || {};
  const intervalMs = wsCfg.messageIntervalMs || 200;
  const sessionMs = wsCfg.sessionMs || 5000;
  const payloadBytes = wsCfg.payloadBytes || 64;

  const url = `${toWsBaseUrl(cfg.baseUrl)}/ws/echo/gorilla`;

  const params = {
    headers: buildAuthHeaders(authMode, cfg.token, authCfg),
    tags: tag("WS_Echo_Gorilla"),
  };

  const metricTags = { impl: "gorilla" };
  const pending = new Map(); // id -> sentAt(ms)

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      const payload = "x".repeat(payloadBytes);
      const iv = socket.setInterval(() => {
        const id = `${__VU}-${Date.now()}-${Math.random()}`;
        const sentAt = Date.now();
        pending.set(id, sentAt);
        ws_sent.add(1, metricTags);
        socket.send(JSON.stringify({ id, sentAt, payload }));
      }, intervalMs);

      socket.setTimeout(() => {
        clearInterval(iv);
        socket.close();
      }, sessionMs);
    });

    socket.on("message", (data) => {
      ws_recv.add(1, metricTags);
      try {
        const msg = JSON.parse(String(data));
        ws_parse_error.add(false, metricTags);

        const t0 = pending.get(msg.id);
        if (t0) {
          pending.delete(msg.id);
          ws_ack_ok.add(true, metricTags);
          ws_rtt_ms.add(Date.now() - t0, metricTags);
        }
      } catch (e) {
        ws_parse_error.add(true, metricTags);
      }
    });

    socket.on("close", () => {
      // Anything left in pending never came back (missing ack/echo).
      for (const _ of pending.keys()) {
        ws_ack_ok.add(false, metricTags);
      }
      pending.clear();
    });
  });

  check(res, {
    "ws upgrade status is 101": (r) => r && r.status === 101,
  });

  thinkTime(0.5, 1.5);
}
