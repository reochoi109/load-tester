import { check } from "k6";
import { loadConfig } from "../../common/config/load-config.js";
import { loadPosts, loadUsers } from "../../common/data/loaders.js";
import { randomItem } from "../../common/utils/random.js";
import { thinkTime } from "../../common/utils/time.js";
import { login } from "../../common/api/user.js";
import { getPost } from "../../common/api/post.js";

const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const authMode = (cfg.authMode || "token").toLowerCase();
const authCfg = cfg.auth || {};
const users = loadUsers();
const posts = loadPosts();

const MIN_POST_BYTES = cfg.minPostBytes || 10000; // 긴 본문 가정
let authToken = null;

function ensureLogin() {
  if (authMode === "none") return null;
  if (!authToken) {
    const user = randomItem(users);
    authToken = login(cfg.baseUrl, user.email, user.password, authMode, authCfg);
  }
  return authToken;
}

// 게시물 조회 흐름 (긴 본문 가정)
export default function postReadFlow() {
  const post = randomItem(posts);

  if (authMode !== "none") {
    ensureLogin();
  }

  const res = getPost(cfg.baseUrl, post.id, authToken, authMode, authCfg);

  check(res, {
    [`post body >= ${MIN_POST_BYTES} bytes`]: (r) =>
      r.body && r.body.length >= MIN_POST_BYTES,
  });

  thinkTime(1, 2);
}
