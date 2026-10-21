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
const FONT = 'https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.min.css';
const pageHtml = inner => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tplDir).href}/"><link rel="stylesheet" href="${FONT}"><style>${BP.css}</style><script src="cards.bundle.js"></script></head><body>${inner}</body></html>`;

const [, , input, outArg] = process.argv;
const draft = JSON.parse(readFileSync(input, 'utf8'));
const outDir = resolve(outArg || join(here, 'out', draft.id));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
// 인스타가 그대로 쓰는 최대 크기(1440×1800) · JPEG(인스타 API는 JPEG만 받음)
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
const files = [];
for (let i = 0; i < draft.cards.length; i++) {
  const tmp = join(tplDir, `_tmp_${i}.html`);
  writeFileSync(tmp, pageHtml(BP.card(draft, i)));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => { const k = document.querySelector('.k.P'); if (window.BPCards && k) { window.BPCards.fit(k); window.BPCards.arrowFit(k); } });
  const file = join(outDir, `${String(i + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  files.push(file);
  rmSync(tmp);
}
await browser.close();
console.log(JSON.stringify({ id: draft.id, files }, null, 2));
