import http from "k6/http";
import { buildAuthHeaders } from "../http/headers.js";
import { tag } from "../http/tags.js";
import { checkStatus } from "../checks/http.js";

// 게시물 단건 조회
export function getPost(baseUrl, postId, token, mode = "token", authCfg = {}) {
  const res = http.get(`${baseUrl}/posts/${postId}`, {
    headers: buildAuthHeaders(mode, token, authCfg),
    tags: tag("PostRead_API"),
  });

  checkStatus(res, 200);
  return res;
}
