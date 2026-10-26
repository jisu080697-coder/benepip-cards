// 칸 글자 한도 재기 (실제 렌더 기준): 틀마다 각 칸에 한글 글(띄어쓰기 포함)을 늘려 가며 그려
// 시안 칸을 넘지 않는 최대 길이(한글 1 · 그 밖 0.6 으로 센 값)와 줄 수를 fixed/limits.json 에 저장 → catalog.py 가 씀
// 사용: node fixed/calibrate.mjs   (ONLY="틀 이름,틀 이름" 이면 그 틀만 다시 재서 기존 limits.json 에 합침)
import { chromium } from 'playwright-core';
import { readdirSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FIG, figCard } from './figma.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(x => x.trim()) : null;
const names = readdirSync(FIG).filter(n => !n.startsWith('.') && (!ONLY || ONLY.includes(n)));
const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : { channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
const out = ONLY && existsSync(join(here, 'limits.json')) ? JSON.parse(readFileSync(join(here, 'limits.json'), 'utf8')) : {};
for (const n of names) {
  const tmp = join(FIG, n, '_cal.html');
  writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,sans-serif}</style></head><body>${figCard(n)}</body></html>`);
  await p.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  out[n] = await p.evaluate(() => {
    const W = '거래 비용 확인 조건 비교 수수료 스프레드 출금 입금 계좌 페이백 적립 연결 발표 시간 예상 이전 지표 환율 증거금 '.repeat(4);
    const wlen = t => [...t].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2E80 ? 1 : 0.6), 0);
    const cut = n => { let t = '', w = 0; for (const ch of W) { const d = ch.charCodeAt(0) > 0x2E80 ? 1 : 0.6; if (w + d > n) break; t += ch; w += d; } return t.trim(); };
    const res = {};
    (window.__SLOTS || []).forEach(sl => {
      const box = document.querySelector(`.ft[data-id="${sl.id}"]`); if (!box) return;
      const inner = box.firstElementChild, keep = inner.innerHTML, span = inner.querySelector('span'), st = span ? span.getAttribute('style') : '';
      const cs = getComputedStyle(box), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2, maxL = Math.max(1, Math.round(sl.h / lh)), nw = box.dataset.nw === '1';
      // 한 줄에 넘치지 않고 들어가는가 (너비 자동 칸: 쓸 수 있는 너비 · 너비 정해진 칸: 줄바꿈 없이)
      const fits = n => { inner.innerHTML = `<span style="${st}">${cut(n)}</span>`; return nw ? inner.offsetWidth <= sl.aw + 2 : inner.offsetHeight <= lh * 1.3; };
      let lo = 1, hi = 60; if (!fits(lo)) { res[sl.id] = { lim: 1, lines: maxL }; inner.innerHTML = keep; return; }
      while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (fits(m)) lo = m; else hi = m - 1; }
      // 숫자 값으로도 잼 ($·쉼표·숫자는 한글보다 폭이 달라서): 0.6 으로 센 길이
      const D = '$1,234,567,890,123', cutN = n => { let t = '', w = 0; for (const ch of D) { if (w + 0.6 > n + 1e-6) break; t += ch; w += 0.6; } return t; };
      const fitsN = n => { inner.innerHTML = `<span style="${st}">${cutN(n)}</span>`; return nw ? inner.offsetWidth <= sl.aw + 2 : inner.offsetHeight <= lh * 1.3; };
      let a = 0.6; for (let k = 2; k <= D.length; k++) { if (fitsN(k * 0.6)) a = k * 0.6; else break; }
      res[sl.id] = { lim: lo, limNum: +a.toFixed(1), lines: maxL };
      inner.innerHTML = keep;
    });
    return res;
  });
  rmSync(tmp);
}
await b.close();
writeFileSync(join(here, 'limits.json'), JSON.stringify(out, null, 1));
console.log('ok', Object.keys(out).length);
