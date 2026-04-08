// JSON 설정 파일을 읽어 객체로 반환
export function loadConfig(path = "load-test/config/env.staging.json") {
  const root = __ENV.K6_ROOT || ".";
  const raw = open(`${root}/${path}`);
  return JSON.parse(raw);
}
