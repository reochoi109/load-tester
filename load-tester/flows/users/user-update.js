import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { login, updateMe } from "../../common/api/user.js";
import { buildUserUpdatePayload } from "../../common/payloads/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

let authToken = null;

// 사용자 정보 수정 흐름
export default function userUpdateFlow() {
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
    updateMe(
      cfg.baseUrl,
      authToken,
      buildUserUpdatePayload(),
      authMode,
      authCfg,
    );
  }

  thinkTime(1, 2);
}
