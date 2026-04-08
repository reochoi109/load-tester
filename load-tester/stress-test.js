import { loadConfig } from "./common/config/load-config.js";
import { runFlow } from "./common/runner.js";

// 실행 환경 설정 로드
const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");

const flowName = __ENV.FLOW || "user-mix";

export const options = {
  scenarios: {
    default: {
      executor: "ramping-vus",
      stages: [
        { duration: "2m", target: 100 },
        { duration: "5m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "5m", target: 200 },
        { duration: "2m", target: 400 },
        { duration: "5m", target: 400 },
        { duration: "10m", target: 0 },
      ],
      gracefulRampDown: "1m",
      gracefulStop: "30s",
    },
  },
  thresholds: cfg.thresholds,
  tags: {
    app_env: __ENV.APP_ENV || "unknown",
    flow: flowName,
  },
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  summaryTimeUnit: "ms",
  insecureSkipTLSVerify: cfg.insecureSkipTLSVerify === true,
};

export default function () {
  return runFlow(flowName);
}
