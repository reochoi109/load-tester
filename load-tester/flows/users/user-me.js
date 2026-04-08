import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { getMe, login } from "../../common/api/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

let authToken = null;

// 사용자 정보 조회 흐름
export default function userMeFlow() {
  if (authMode !== "none" && !authToken) {
    const user = randomItem(users);
    authToken = login(
      cfg.baseUrl,
      user.email,
      user.password,
      authMode,
      authCfg,
    );
  }

  if (authMode === "none" || authToken || authMode === "cookie") {
    getMe(cfg.baseUrl, authToken, authMode, authCfg);
  }

  thinkTime(1, 2);
}
