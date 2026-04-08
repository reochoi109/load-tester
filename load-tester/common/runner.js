import { getFlow } from "../flows/index.js";

export function runFlow(name = "health") {
  if (__VU === 1 && __ITER === 0) {
    const envName = __ENV.APP_ENV || "unknown";
    const configPath = __ENV.K6_CONFIG || "unknown";
    console.log(`[k6] env=${envName} config=${configPath} flow=${name}`);
  }

  const flow = getFlow(name);
  if (!flow) {
    throw new Error(`Unknown flow: ${name}`);
  }
  return flow();
}
