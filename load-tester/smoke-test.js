import { loadConfig } from "./common/config/load-config.js";
import { runFlow } from "./common/runner.js";

// 실행 환경 설정 로드
const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");

const flowName = __ENV.FLOW || "user-journey";

export const options = {
  scenarios: {
    default: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      gracefulStop: "10s",
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

// 공통 요청 흐름 실행
export default function () {
  return runFlow(flowName);
}
