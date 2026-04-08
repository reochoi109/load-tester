import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { login, logout } from "../../common/api/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

let authToken = null;

// 사용자 로그아웃 흐름
export default function userLogoutFlow() {
  if (authMode === "none") return;
  if (!authToken) {
    const user = randomItem(users);
    authToken = login(
      cfg.baseUrl,
      user.email,
      user.password,
      authMode,
      authCfg,
    );
  }

  if (authToken || authMode === "cookie") {
    logout(cfg.baseUrl, authToken, authMode, authCfg);
    authToken = null;
  }

  thinkTime(1, 2);
}
