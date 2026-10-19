// 카드뉴스 렌더러: 초안 JSON → 실제 크롬으로 카드별 PNG
// 사용: node render.mjs samples/d1.json [출력폴더]
// 로컬에서는 설치된 Edge, GitHub Actions에서는 Playwright 크롬 사용
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tplDir = join(here, 'templates');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 따옴표('…' "…" “…”) 구간을 그라데이션 강조, 없으면 첫 숫자 강조 (화면 시안과 같은 규칙)
const hl = t => { const s = String(t ?? '').replace(/'([^'\n]{1,24})'|"([^"\n]{1,24})"/, (m, a, b) => '“' + (a || b) + '”'); const m = s.match(/“[^”]+”/) || s.match(/\$?\d[\d,.]*%?/); if (!m) return esc(s); return esc(s.slice(0, m.index)) + '<em>' + esc(m[0]) + '</em>' + esc(s.slice(m.index + m[0].length)); };

// 본문 텍스트 → 템플릿별 구조 (화면 시안 cardParts 와 같은 규칙)
const lines = b => String(b ?? '').split('\n').map(x => x.trim()).filter(Boolean);
const items = b => lines(b).map(x => x.replace(/^([-•·✓✔]|\d+[.)])\s*/, ''));
const rows = b => lines(b).map(x => x.split('|').map(y => y.trim()));
const hd = d => `<div class="hd"><img src="benepip-logo.png"><span class="tag">${esc(d.group)}</span></div>`;

const LAYOUT = {
  stat: (c, d) => { const l = lines(c.b); return `<div class="card body stat">${hd(d)}<div class="bar"></div><h2>${esc(c.t)}</h2><div class="num">${esc(l[0] || '')}</div><p>${esc(l.slice(1).join('\n'))}</p>`; },
  check: (c, d) => `<div class="card body check">${hd(d)}<div class="bar"></div><h2>${esc(c.t)}</h2><ul class="list">${items(c.b).map(x => `<li><span class="ic">✓</span><span>${esc(x)}</span></li>`).join('')}</ul>`,
  steps: (c, d) => `<div class="card body steps">${hd(d)}<div class="bar"></div><h2>${esc(c.t)}</h2><ul class="list">${items(c.b).map((x, i) => `<li><span class="ic">${i + 1}</span><span>${esc(x)}</span></li>`).join('')}</ul>`,
  compare: (c, d) => { const r = rows(c.b), head = r.length && r[0][0] === '' ? r.shift() : null;
    return `<div class="card body compare">${hd(d)}<div class="bar"></div><h2>${esc(c.t)}</h2><table class="cmp">${head ? `<tr>${head.map(x => `<th>${esc(x)}</th>`).join('')}</tr>` : ''}${r.map(x => `<tr>${x.map(y => `<td>${esc(y)}</td>`).join('')}</tr>`).join('')}</table>`; },
  cover: (c, d) => `<div class="card cover"><div class="hd"><img src="benepip-logo.png"><span class="tag">${esc(d.group)}</span></div>
    <h1>${hl(c.t)}</h1><div class="sub">${esc(c.b)}</div><div class="swipe">넘겨서 보기 →</div>`,
  body: (c, d) => `<div class="card body"><div class="hd"><img src="benepip-logo.png"><span class="tag">${esc(d.group)}</span></div>
    <div class="bar"></div><h2>${esc(c.t)}</h2><p>${esc(c.b)}</p>`,
  last: (c, d) => `<div class="card body last"><div class="hd"><img src="benepip-logo.png"><span class="tag">${esc(d.group)}</span></div>
    <div class="bar"></div><h2>${esc(c.t)}</h2><p>${esc(c.b)}</p><span class="cta">${esc(d.cta || '18개 브로커 조건 비교 · 프로필 링크')}</span><div class="risk">${esc(d.disclaimer)}</div>`,
};
const pageHtml = inner => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tplDir).href}/"><link rel="stylesheet" href="card.css"></head><body>${inner}</body></html>`;

const [, , input, outArg] = process.argv;
const draft = JSON.parse(readFileSync(input, 'utf8'));
const outDir = resolve(outArg || join(here, 'out', draft.id));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
// 인스타가 그대로 쓰는 최대 크기(1440×1800) · JPEG(인스타 API는 JPEG만 받음)
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
const files = [];
for (let i = 0; i < draft.cards.length; i++) {
  const c = draft.cards[i], n = draft.cards.length;
  // 표지·마지막 장은 고정, 가운데 장만 템플릿 선택 (없거나 모르는 값이면 기본 본문)
  const kind = i === 0 ? 'cover' : i === n - 1 ? 'last' : (LAYOUT[c.layout] && !['cover', 'last'].includes(c.layout) ? c.layout : 'body');
  const html = pageHtml(LAYOUT[kind](c, draft) + `<div class="pg">${i + 1} / ${n}</div></div>`);
  const tmp = join(tplDir, `_tmp_${i}.html`);
  writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  files.push(file);
  rmSync(tmp);
}
await browser.close();
console.log(JSON.stringify({ id: draft.id, files }, null, 2));
