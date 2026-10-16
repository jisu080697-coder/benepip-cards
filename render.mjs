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
// “따옴표” 구간을 그라데이션 강조, 없으면 첫 숫자 강조
const hl = t => { const e = esc(t); return /“[^”]+”/.test(e) ? e.replace(/(“[^”]+”)/, '<em>$1</em>') : e.replace(/(\$?\d[\d,.]*%?)/, '<em>$1</em>'); };

const LAYOUT = {
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
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
const files = [];
for (let i = 0; i < draft.cards.length; i++) {
  const c = draft.cards[i], n = draft.cards.length;
  const kind = c.layout || (i === 0 ? 'cover' : i === n - 1 ? 'last' : 'body');
  const html = pageHtml(LAYOUT[kind](c, draft) + `<div class="pg">${i + 1} / ${n}</div></div>`);
  const tmp = join(tplDir, `_tmp_${i}.html`);
  writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = join(outDir, `${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  files.push(file);
  rmSync(tmp);
}
await browser.close();
console.log(JSON.stringify({ id: draft.id, files }, null, 2));
