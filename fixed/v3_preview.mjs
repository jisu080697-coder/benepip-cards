// 틀 v3 미리보기: 시안 예시 글(samples/v3)을 지금 카드 코드 + v3 규칙으로 그림 → fixed/v3/<이름>.jpg
// v3 규칙: 배치 변형(가운데·아래 제목·오른쪽 정렬) 없이 모든 장 제목 왼쪽 위 같은 자리 · 본문 크게 · 아래까지 채움
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), tpl = join(root, 'templates'), out = join(here, 'v3');
await import('../templates/cards.bundle.js');
const BP = globalThis.BPCards;
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
export const SETS = [['pay', '거래비용·페이백'], ['benefit', '혜택·적용 조건'], ['guide', '브로커 이용 가이드'], ['bene', '베네핍 이용 안내'], ['platform', '플랫폼 활용'], ['cal', '경제 캘린더']];
export const V3CSS = readFileSync(join(here, 'v3.css'), 'utf8');
mkdirSync(out, { recursive: true });
// 채우기: 제목 아래 가장 큰 내용 묶음의 줄 간격을 늘려 아래 여백(쪽 번호·위험 고지 위)까지 고르게
export const fill = () => {
  const k = document.querySelector('.k'); if (!k.classList.contains('P')) return;
  const box = k.getBoundingClientRect(), lim = 1350 - (k.classList.contains('has-risk') ? 215 : 150);
  const kids = [...k.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.tagName !== 'H2' && e.tagName !== 'IMG' && !/^(logo|head|pg|src|risk|desc)$/.test(String(e.className).split(' ')[0]));
  if (!kids.length) return;
  const bottom = () => Math.max(...[...k.children].filter(e => getComputedStyle(e).position !== 'absolute').map(e => e.getBoundingClientRect().bottom - box.top));
  const main = kids.slice().sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  let rows = [...main.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height > 20);
  if (rows.length < 2) rows = [main];
  const tops = new Set(rows.map(e => Math.round(e.getBoundingClientRect().top))).size || 1;
  const free = lim - bottom(); if (free < 30) return;
  const per = Math.min(free * 0.9 / tops, rows.length > 1 ? 64 : 160);
  rows.forEach(e => { const cs = getComputedStyle(e); e.style.paddingTop = (parseFloat(cs.paddingTop) + per / 2) + 'px'; e.style.paddingBottom = (parseFloat(cs.paddingBottom) + per / 2) + 'px'; });
  if (bottom() > lim + 4) rows.forEach(e => { e.style.paddingTop = e.style.paddingBottom = ''; });
};
const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : { channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [id, name] of SETS) {
  const d = JSON.parse(readFileSync(join(root, 'samples', 'v3', id + '.json'), 'utf8'));
  for (let i = 0; i < d.cards.length; i++) {
    const f = join(tpl, `_v3_${i}.html`);
    writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tpl).href}/"><link rel="stylesheet" href="${FONT}"><style>${BP.css}\n${V3CSS}</style><script src="cards.bundle.js"></script></head><body>${BP.card(d, i)}</body></html>`);
    await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { const k = document.querySelector('.k'); if (k.classList.contains('P')) { k.className = k.className.replace(/\bcmp-(center|right|bottom|ev2)\b/g, ''); BPCards.fit(k); BPCards.arrowFit(k); } });
    await p.evaluate(fill);
    await p.screenshot({ path: join(out, `${name} ${i + 1}.jpg`), type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    rmSync(f);
  }
}
await b.close();
console.log('ok');
