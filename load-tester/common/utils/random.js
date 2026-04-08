// 배열에서 랜덤 1개 선택
export function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// 가중치 기반 선택 (items: [{ value, weight }])
export function pickWeighted(items) {
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}
