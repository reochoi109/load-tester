// 사용자 조회용 요청 흐름
import http from "k6/http";
import { loadConfig } from "../../common/config/load-config.js";
import { loadUsers } from "../../common/data/loaders.js";
import { buildHeaders } from "../../common/http/headers.js";
import { tag } from "../../common/http/tags.js";
import { thinkTime } from "../../common/utils/time.js";

// 실행 시 사용할 환경 설정 로드 (기본: staging)
const cfg = loadConfig(__ENV.K6_CONFIG || "load-tester/config/env.staging.json");
const users = loadUsers();

// 사용자 조회 요청 흐름
export default function getUserFlow() {
  const user = users[Math.floor(Math.random() * users.length)];

  const res = http.get(`${cfg.baseUrl}/users/${user.id}`, {
    headers: buildHeaders(cfg.token),
    tags: tag("GetUser_API"),
  });

  // 필요 시 체크 로직 추가 가능
  void res;

  thinkTime(1, 2);
}
