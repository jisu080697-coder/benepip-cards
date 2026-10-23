// 스타일 시안 9장 → 카드별 jpg
import { chromium } from 'playwright-core';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
await p.goto(pathToFileURL(join(here, 'styles.html')).href, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const id of ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']) await p.locator('#' + id).screenshot({ path: join(here, id + '.jpg'), type: 'jpeg', quality: 88 });
await b.close(); console.log('ok');
