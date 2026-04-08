import { randomItem } from "../utils/random.js";

const names = ["Alex", "Casey", "Jamie", "Jordan", "Morgan"];

// 사용자 정보 수정용 페이로드 생성
export function buildUserUpdatePayload() {
  const name = randomItem(names);
  const suffix = Math.floor(Math.random() * 1000);
  return {
    name: `${name} ${suffix}`,
    phone: `010-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`,
  };
}
