// 공통 헤더 생성 (토큰이 있으면 Authorization 추가)
export function buildHeaders(token = __ENV.TOKEN) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// 인증 모드에 따른 헤더 생성
export function buildAuthHeaders(mode, token, authCfg = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (mode !== "token" || !token) return headers;

  const headerName = authCfg.tokenHeader || "Authorization";
  const prefix =
    typeof authCfg.tokenPrefix === "string" ? authCfg.tokenPrefix : "Bearer ";
  headers[headerName] = `${prefix}${token}`;

  return headers;
}
