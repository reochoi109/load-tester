import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { getMe, login, logout, updateMe } from "../../common/api/user.js";
import { buildUserUpdatePayload } from "../../common/payloads/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

// 로그인 -> 정보조회 -> 정보수정 -> 로그아웃
export default function userJourneyFlow() {
  if (authMode === "none") {
    getMe(cfg.baseUrl, null, authMode, authCfg);
    updateMe(cfg.baseUrl, null, buildUserUpdatePayload(), authMode, authCfg);
    thinkTime(1, 2);
    return;
  }

  const user = randomItem(users);
  const token = login(
    cfg.baseUrl,
    user.email,
    user.password,
    authMode,
    authCfg,
  );

  if (authMode === "cookie" || token) {
    getMe(cfg.baseUrl, token, authMode, authCfg);
    updateMe(cfg.baseUrl, token, buildUserUpdatePayload(), authMode, authCfg);
    logout(cfg.baseUrl, token, authMode, authCfg);
  }

  thinkTime(1, 2);
}
