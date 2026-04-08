import { check } from "k6";

// 응답 상태코드가 기대값인지 검사
export function checkStatus(res, expected = 200) {
  return check(res, {
    [`status is ${expected}`]: (r) => r.status === expected,
  });
}

// 응답 바디에 특정 문자열이 포함되는지 검사
export function checkBodyIncludes(res, text) {
  return check(res, {
    [`body includes ${text}`]: (r) => r.body && r.body.includes(text),
  });
}

// 응답 시간이 특정 ms 이하인지 검사
export function checkResponseTime(res, maxMs) {
  return check(res, {
    [`response time < ${maxMs}ms`]: (r) => r.timings.duration < maxMs,
  });
}
