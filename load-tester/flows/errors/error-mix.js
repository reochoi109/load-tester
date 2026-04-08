import { loadConfig } from "../../common/config/load-config.js";
import { pickWeighted } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import notFound from "./not-found.js";
import nonJson from "./non-json.js";
import serverError from "./server-error.js";
import timeout from "./timeout.js";
import unauthorized from "./unauthorized.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const enabled = cfg.errorMixEnabled !== false;

// 오류 케이스를 가중치로 섞어 실행
export default function errorMixFlow() {
  if (!enabled) {
    thinkTime(0.5, 1.5);
    return;
  }

  const weights = cfg.errorMixWeights || {
    notFound: 40,
    unauthorized: 20,
    serverError: 15,
    nonJson: 15,
    timeout: 10,
  };

  const action = pickWeighted([
    { value: "notFound", weight: weights.notFound || 0 },
    { value: "unauthorized", weight: weights.unauthorized || 0 },
    { value: "serverError", weight: weights.serverError || 0 },
    { value: "nonJson", weight: weights.nonJson || 0 },
    { value: "timeout", weight: weights.timeout || 0 },
  ]);

  switch (action) {
    case "unauthorized":
      unauthorized();
      break;
    case "serverError":
      serverError();
      break;
    case "nonJson":
      nonJson();
      break;
    case "timeout":
      timeout();
      break;
    case "notFound":
    default:
      notFound();
      break;
  }
}
