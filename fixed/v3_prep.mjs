// 틀 만들 때 공통 (v3_build · fig_nodes): 화면 안에서 배치 변형 끄기 → 크기 맞춤 → 아래까지 채우기
export const prep = () => {
  const k = document.querySelector('.k');
  if (k.classList.contains('P')) { k.className = k.className.replace(/\bcmp-(center|right|bottom|ev2)\b/g, ''); BPCards.fit(k); BPCards.arrowFit(k); }
  if (!k.classList.contains('P')) return;
  const box = k.getBoundingClientRect(), lim = 1350 - (k.classList.contains('has-risk') ? 215 : 150);
  const kids = [...k.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.tagName !== 'H2' && e.tagName !== 'IMG' && !/^(logo|head|pg|src|risk|desc)$/.test(String(e.className).split(' ')[0]));
  if (!kids.length) return;
  const bottom = () => Math.max(...[...k.children].filter(e => getComputedStyle(e).position !== 'absolute').map(e => e.getBoundingClientRect().bottom - box.top));
  const main = kids.slice().sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  let rows = [...main.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height > 20);
  if (rows.length < 2) rows = [main];
  // 나란한 칸(왼쪽·오른쪽 열)이면 열 안의 줄들을 늘림
  if (rows.length > 1 && new Set(rows.map(e => Math.round(e.getBoundingClientRect().top))).size === 1) { const inner = rows.flatMap(r => [...r.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height > 20)); if (inner.length > rows.length) rows = inner; }
  const tops = new Set(rows.map(e => Math.round(e.getBoundingClientRect().top))).size || 1, free = lim - bottom();
  if (free < 30) return;
  const per = Math.min(free * 0.9 / tops, rows.length > 1 ? 64 : 160);
  rows.forEach(e => { const cs = getComputedStyle(e); e.style.paddingTop = (parseFloat(cs.paddingTop) + per / 2) + 'px'; e.style.paddingBottom = (parseFloat(cs.paddingBottom) + per / 2) + 'px'; });
  if (bottom() > lim + 4) rows.forEach(e => { e.style.paddingTop = e.style.paddingBottom = ''; });
};
