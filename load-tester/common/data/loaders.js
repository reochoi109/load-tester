// 사용자 목록 JSON 로드
export function loadUsers(path = "load-test/data/users.json") {
  const root = __ENV.K6_ROOT || ".";
  return JSON.parse(open(`${root}/${path}`));
}

// 게시물 ID 목록 JSON 로드
export function loadPosts(path = "load-test/data/posts.json") {
  const root = __ENV.K6_ROOT || ".";
  return JSON.parse(open(`${root}/${path}`));
}
