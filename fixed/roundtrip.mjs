// 확인용: 피그마에서 받은 틀을 원래 글자 그대로 다시 그려 fixed/figma/<이름>/rt.jpg (피그마 full.png 와 같아야 함)
import { chromium } from 'playwright-core';
import { readdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FIG, figCard } from './figma.mjs';
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const names = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(FIG);
const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
for (const n of names) {
  const tmp = join(FIG, n, '_rt.html');
  writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>${figCard(n)}</body></html>`);
  await p.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(FIG, n, 'rt.jpg'), type: 'jpeg', quality: 90 }); rmSync(tmp);
}
await b.close(); console.log('ok', names.length);
