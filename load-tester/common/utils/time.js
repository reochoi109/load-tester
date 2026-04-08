import { sleep } from "k6";

// 사용자 사고시간(think time) 추가
export function thinkTime(min = 1, max = 2) {
  const t = Math.random() * (max - min) + min;
  sleep(t);
}
