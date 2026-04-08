import http from "k6/http";
import { buildAuthHeaders } from "../http/headers.js";
import { tag } from "../http/tags.js";
import { checkStatus } from "../checks/http.js";

// 로그인: 토큰 반환
export function login(baseUrl, email, password, mode = "token", authCfg = {}) {
  const res = http.post(
    `${baseUrl}${authCfg.loginPath || "/auth/login"}`,
    JSON.stringify({ email, password }),
    { headers: buildAuthHeaders("none"), tags: tag("AuthLogin_API") },
  );

  // 200만 인정 (필요시 201 등 추가 가능)
  checkStatus(res, 200);

  if (mode !== "token") return null;
  if (res.status !== 200) return null;

  try {
    const body = res.json();
    return (body && (body.token || body.accessToken)) || null;
  } catch (e) {
    return null;
  }
}

// 로그아웃
export function logout(baseUrl, token, mode = "token", authCfg = {}) {
  const res = http.post(
    `${baseUrl}${authCfg.logoutPath || "/auth/logout"}`,
    null,
    {
      headers: buildAuthHeaders(mode, token, authCfg),
      tags: tag("AuthLogout_API"),
    },
  );

  // 200 또는 204 허용
  return res.status === 200 || res.status === 204;
}

// 내 정보 조회
export function getMe(baseUrl, token, mode = "token", authCfg = {}) {
  const res = http.get(`${baseUrl}/users/me`, {
    headers: buildAuthHeaders(mode, token, authCfg),
    tags: tag("UserMe_API"),
  });

  checkStatus(res, 200);
  return res;
}

// 내 정보 수정
export function updateMe(
  baseUrl,
  token,
  payload,
  mode = "token",
  authCfg = {},
) {
  const res = http.put(`${baseUrl}/users/me`, JSON.stringify(payload), {
    headers: buildAuthHeaders(mode, token, authCfg),
    tags: tag("UserUpdate_API"),
  });

  checkStatus(res, 200);
  return res;
}
