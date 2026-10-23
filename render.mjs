// 카드뉴스 렌더러: 초안 JSON → 실제 크롬으로 카드별 JPEG
// 사용: node render.mjs samples/d1.json [출력폴더]
// 로컬에서는 설치된 Edge, GitHub Actions에서는 Playwright 크롬 사용
// 카드 디자인은 templates/cards.bundle.js (관리 화면 미리보기와 같은 코드)
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tplDir = join(here, 'templates');
await import('./templates/cards.bundle.js');
const BP = globalThis.BPCards;
const FX = await import('./fixed/compose.mjs');
const FG = await import('./fixed/figma.mjs');
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const pageHtml = inner => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tplDir).href}/"><link rel="stylesheet" href="${FONT}"><style>${BP.css}</style><script src="cards.bundle.js"></script></head><body>${inner}</body></html>`;

const [, , input, outArg] = process.argv;
const draft = JSON.parse(readFileSync(input, 'utf8'));
const outDir = resolve(outArg || join(here, 'out', draft.id));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
// 인스타가 그대로 쓰는 최대 크기(1440×1800) · JPEG(인스타 API는 JPEG만 받음)
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
const files = [], metrics = [];
for (let i = 0; i < draft.cards.length; i++) {
  const tmp = join(tplDir, `_tmp_${i}.html`);
  // 피그마 틀 카드 (fig): 피그마에서 받은 배경 위 같은 자리·같은 글씨로 글자만 바꿈
  if (draft.cards[i].fig && FG.hasFig(draft.cards[i].fig)) {
    const c = draft.cards[i], v = Object.assign({}, c.v || {});
    FG.figOf(c.fig).slots.forEach(x => { if (v[x.id] == null && /^\d+ \/ \d+$/.test(x.text)) v[x.id] = (i + 1) + ' / ' + draft.cards.length; });
    writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>${FG.figCard(c.fig, v)}</body></html>`);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(`(${FG.figFit.toString()})()`);
    // 피그마 칸보다 넓어지거나 줄이 늘어난 칸 (품질 관문이 글을 줄이게)
    const over = await page.evaluate((slots) => slots.map(s => { const e = document.querySelector(`.ft[data-id="${s.id}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return (r.width > s.w + 6 && Math.abs(s.rot) < 0.5) || r.height > s.h + 6 ? s.id : null; }).filter(Boolean), FG.figOf(c.fig).slots);
    const shrunk = await page.evaluate(() => window.__SHRUNK || []);
    metrics.push({ n: i + 1, fig: c.fig, zoom: Math.min(1, ...shrunk.map(x => x.z)), empty: 0, clipped: 0, tiny: 0, over: shrunk.map(x => x.id), wide: over });
    const file = join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    files.push(file); rmSync(tmp); continue;
  }
  // 고정 틀 카드 (tpl): 피그마·틀 배경 위에 글자만 · 크기 변화 없음
  if (draft.cards[i].tpl && FX.hasTpl(draft.cards[i].tpl)) {
    writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>${FX.fixedCard(draft, i)}</body></html>`);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const fit = await page.evaluate(`(${FX.fitFixed.toString()})()`);
    const over = fit.filter(x => x.z < 1 || x.clipped).map(x => x.slot), miss = fit.filter(x => x.empty && !/^(risk)$/.test(x.slot)).map(x => x.slot);
    metrics.push({ n: i + 1, tpl: draft.cards[i].tpl, zoom: Math.min(1, ...fit.map(x => x.z)), empty: 0, clipped: fit.filter(x => x.clipped).length, tiny: 0, over, miss });
    const file = join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    files.push(file); rmSync(tmp); continue;
  }
  writeFileSync(tmp, pageHtml(BP.card(draft, i)));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { const k = document.querySelector('.k.P'); if (window.BPCards && k) { window.BPCards.fit(k); window.BPCards.arrowFit(k); } });
  // 품질 측정 (하네스용): 글씨 축소 · 아래 빈 공간 · 잘린 글자 · 너무 작은 글씨
  metrics.push(await page.evaluate((n) => {
    const k = document.querySelector('.k'), box = k.getBoundingClientRect();
    const kids = [...k.children].filter(e => getComputedStyle(e).position !== 'absolute');
    const zoom = Math.min(1, ...kids.map(e => parseFloat(e.style.zoom || 1)));
    const bottom = Math.max(0, ...kids.filter(e => !/^(pg|src|risk)$/.test(e.className)).map(e => e.getBoundingClientRect().bottom - box.top));
    const empty = k.classList.contains('P') ? Math.max(0, Math.round((1350 - 120 - bottom) / 1350 * 100)) : null;
    const BLEED = /(^|\s)(ui|uic|calc|art|obj|bign|corner|rcpt|st|spot)(\s|$)/;
    let clipped = 0, tiny = 0;
    k.querySelectorAll('*').forEach(e => {
      if (!e.childNodes.length || ![...e.childNodes].some(t => t.nodeType === 3 && t.textContent.trim())) return;
      const r = e.getBoundingClientRect(); if (!r.width) return;
      let p = e, bleed = false; while (p && p !== k) { if (BLEED.test(p.className && p.className.baseVal == null ? p.className : '')) { bleed = true; break; } p = p.parentElement; }
      if (!bleed && (r.right - box.left > 1080 + 2 || e.scrollWidth > e.clientWidth + 4 && getComputedStyle(e).overflow === 'hidden')) clipped++;
      let z = 1; p = e; while (p && p !== k) { z *= parseFloat(p.style && p.style.zoom || 1); p = p.parentElement; }
      const fs = parseFloat(getComputedStyle(e).fontSize) * z;
      if (fs < 27 && !/^(pg|risk|src|cap|d)$/.test(e.className)) tiny++;
    });
    return { n: n, zoom: +zoom.toFixed(2), empty: empty, clipped: clipped, tiny: tiny };
  }, i + 1));
  const file = join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  files.push(file);
  rmSync(tmp);
}
await browser.close();
writeFileSync(join(outDir, 'metrics.json'), JSON.stringify(metrics));
writeFileSync(join(outDir, 'info.json'), JSON.stringify({ fig: draft.cards.filter(c => c.fig).length, figErr: draft.figErr || '' }));
console.log(JSON.stringify({ id: draft.id, files, metrics }, null, 2));
