import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { pickWeighted, randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { getMe, login, logout, updateMe } from "../../common/api/user.js";
import { buildUserUpdatePayload } from "../../common/payloads/user.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-test/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();

let authToken = null;

function ensureLogin() {
  if (authMode === "none") return null;
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
  return authToken;
}

// CRUD 섞어서 실행하는 혼합 흐름
export default function userMixFlow() {
  const action = pickWeighted(
    authMode === "none"
      ? [
          { value: "get", weight: 70 },
          { value: "update", weight: 30 },
        ]
      : [
          { value: "get", weight: 60 },
          { value: "update", weight: 20 },
          { value: "login", weight: 10 },
          { value: "logout", weight: 10 },
        ],
  );

  switch (action) {
    case "login": {
      if (authMode === "none") break;
      const user = randomItem(users);
      authToken = login(
        cfg.baseUrl,
        user.email,
        user.password,
        authMode,
        authCfg,
      );
      break;
    }
    case "logout": {
      if (authMode === "none") break;
      if (ensureLogin() || authMode === "cookie") {
        logout(cfg.baseUrl, authToken, authMode, authCfg);
        authToken = null;
      }
      break;
    }
    case "update": {
      if (authMode === "none" || ensureLogin() || authMode === "cookie") {
        updateMe(
          cfg.baseUrl,
          authToken,
          buildUserUpdatePayload(),
          authMode,
          authCfg,
        );
      }
      break;
    }
    case "get":
    default: {
      if (authMode === "none" || ensureLogin() || authMode === "cookie") {
        getMe(cfg.baseUrl, authToken, authMode, authCfg);
      }
      break;
    }
  }

  thinkTime(1, 2);
}
