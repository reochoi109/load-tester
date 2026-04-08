import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { login } from "../../common/api/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

// 사용자 로그인 흐름
export default function userLoginFlow() {
  if (authMode === "none") return;
  const user = randomItem(users);
  const token = login(
    cfg.baseUrl,
    user.email,
    user.password,
    authMode,
    authCfg,
  );
  void token;
  thinkTime(1, 2);
}
