// 고정 틀 만들기: fixed/src/<id>.html (디자인 + 예시 글) → fixed/out/<id>/bg.png (글자 칸 비운 배경) + slots.json (칸 위치·글씨) + preview.jpg
// 사용: node fixed/build.mjs [id ...]   (피그마에서 내보낸 틀은 fixed/out/<id>/ 에 같은 모양으로 들어옴)
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), src = join(here, 'src'), out = join(here, 'out');
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const ids = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(src).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5));
const base = readFileSync(join(src, 'base.css'), 'utf8');
const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
for (const id of ids) {
  const dir = join(out, id); mkdirSync(dir, { recursive: true });
  const tmp = join(src, `_b_${id}.html`);
  writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>${base}</style></head><body>${readFileSync(join(src, id + '.html'), 'utf8').replace(/^﻿/, '')}</body></html>`);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(dir, 'preview.jpg'), type: 'jpeg', quality: 90 });
  const slots = await page.evaluate(() => [...document.querySelectorAll('[data-slot]')].map(e => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e), hi = getComputedStyle(e.querySelector('b') || e).color;
    e.style.visibility = 'hidden';
    return { name: e.dataset.slot, lines: +(e.dataset.lines || 1), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      size: parseFloat(s.fontSize), weight: +s.fontWeight, color: s.color, hi, lh: parseFloat(s.lineHeight), ls: s.letterSpacing, align: s.textAlign, nums: s.fontVariantNumeric, sample: e.innerHTML.replace(/<br\s*\/?>/g, '\n').replace(/<b>(.*?)<\/b>/g, '“$1”').replace(/<[^>]+>/g, '') };
  }));
  await page.screenshot({ path: join(dir, 'bg.png'), type: 'png' });
  writeFileSync(join(dir, 'slots.json'), JSON.stringify({ id, w: 1080, h: 1350, slots }, null, 1));
  rmSync(tmp);
  console.log(id, slots.length + '칸');
}
await browser.close();
