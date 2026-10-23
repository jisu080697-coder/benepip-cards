// 28개 틀 자동 검증 (틀·렌더러를 바꿀 때마다): 틀마다 시안 글 · 짧은 글 · 보통 글 · 긴 글(칸 한도까지)로 그려
//  1) 칸 넘침·줄 수 (실제 렌더 측정)  2) 시안 글 렌더 = 피그마 원본(full.png) 픽셀 비교  3) 글씨 크기·칸 위치가 시안 값 그대로인지
// 결과: fixed/verify_out/report.json + 틀별 이미지 · 하나라도 실패하면 종료 코드 1
// 사용: node fixed/verify.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FIG, figCard, figFit, figMeasure, figOf } from './figma.mjs';

const here = dirname(fileURLToPath(import.meta.url)), OUT = join(here, 'verify_out');
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const CAT = JSON.parse(readFileSync(join(here, 'catalog.json'), 'utf8'));
const DIFF_MAX = 4;   // 시안 글 렌더와 피그마 원본의 평균 밝기 차이 상한 (0~255 · 압축 잡음 1~2)
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });

// 글 만들기: 한글 1 · 그 밖 0.6 으로 센 길이 n 까지
const WORDS = '거래 비용 확인 조건 비교 수수료 스프레드 출금 입금 계좌 페이백 적립 연결 발표 시간 예상 이전 지표 환율 증거금 '.repeat(6);
const wl = ch => ch.charCodeAt(0) > 0x2E80 ? 1 : 0.6;
const cut = (n, src = WORDS) => { let t = '', w = 0; for (const ch of src) { if (w + wl(ch) > n) break; t += ch; w += wl(ch); } return t.trim(); };
const KIND = { digit: () => '9', time: () => '23:59', date: () => '12/31 수', day: () => '수' };
const num = n => '$1,234,567,890,123'.slice(0, Math.max(2, Math.floor(n / 0.6 + 1e-6)));   // calibrate.mjs 숫자 재기와 같은 글
const variant = (t, how) => Object.fromEntries(t.s.map(([id, role, ex, lines, lim, kind]) => {
  if (KIND[kind]) return [id, KIND[kind]()];
  const sl = String(ex).replace(/[“”]/g, '').split('\n'), tg = Math.max(...sl.map(l => [...l].reduce((a, c) => a + wl(c), 0)));
  if (kind === 'num' || kind === 'numq') return [id, how === 'long' ? num(lim) : how === 'short' ? num(Math.max(1.8, tg * 0.6)) : num(tg)];
  const n = how === 'long' ? lim : how === 'short' ? Math.max(2, Math.round(tg * 0.5)) : Math.round(tg);
  const ls = Array.from({ length: lines }, (_, i) => cut(n, WORDS.slice(i * 7)));
  if (/제목/.test(role)) ls[ls.length - 1] = '“' + ls[ls.length - 1].slice(0, 3) + '”' + ls[ls.length - 1].slice(3);
  return [id, ls.join('\n')];
}));

const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
const report = [], fail = [];
for (const t of CAT) {
  const raw = figOf(t.n);
  for (const how of ['sample', 'short', 'normal', 'long']) {
    const vals = how === 'sample' ? null : variant(t, how), tmp = join(FIG, t.n, '_v.html');
    writeFileSync(tmp, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Pretendard Variable',Pretendard,sans-serif;-webkit-font-smoothing:antialiased}</style></head><body>${figCard(t.n, vals)}</body></html>`);
    await p.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(`(${figFit.toString()})()`);
    const meas = await p.evaluate(`(${figMeasure.toString()})()`);
    // 글씨 크기·칸 위치가 시안 값 그대로인지 (렌더러가 바꾸면 안 됨)
    const moved = await p.evaluate(slots => slots.filter(s => { const e = document.querySelector(`.ft[data-id="${s.id}"]`); return e && Math.abs(parseFloat(getComputedStyle(e).fontSize) - s.segs[0].size) > 0.5; }).map(s => s.id), raw.slots.filter(s => !s.segs.every(g => !g.t.trim())));
    const shot = join(OUT, `${t.n} · ${how}.jpg`);
    await p.screenshot({ path: shot, type: 'jpeg', quality: 80 });
    let diff = null;
    if (how === 'sample' && existsSync(join(FIG, t.n, 'full.png'))) {
      diff = await p.evaluate(async ([a, c]) => {
        const load = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
        const [x, y] = await Promise.all([load(a), load(c)]), W = 270, H = 337, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
        g.drawImage(x, 0, 0, W, H); const A = g.getImageData(0, 0, W, H).data; g.drawImage(y, 0, 0, W, H); const C = g.getImageData(0, 0, W, H).data;
        let s = 0; for (let i = 0; i < A.length; i += 4) s += (Math.abs(A[i] - C[i]) + Math.abs(A[i + 1] - C[i + 1]) + Math.abs(A[i + 2] - C[i + 2])) / 3; return +(s / (W * H)).toFixed(2);
      }, ['data:image/jpeg;base64,' + readFileSync(shot).toString('base64'), 'data:image/png;base64,' + readFileSync(join(FIG, t.n, 'full.png')).toString('base64')]);   // 파일 주소는 캔버스에서 막혀서 데이터로
    }
    // long(모든 칸을 한도까지)은 칸마다 따로 잰 한도라 옆 칸끼리 겹칠 수 있음 → 겹침은 실제 글에서 잡아 다시 쓰게 하고, 여기서는 칸 자체 넘침만 봄
    const over = meas.filter(x => x.over && (how === 'sample' || t.s.some(s => s[0] === x.id)) && !(how === 'long' && x.why === '옆 글과 겹침'));
    const ok = !over.length && !moved.length && (diff == null || diff <= DIFF_MAX);
    report.push({ tpl: t.n, how, ok, over: over.map(x => x.id + ' ' + x.why), moved, diff });
    if (!ok) fail.push(`${t.n} · ${how}: ${[over.length ? '넘침 ' + over.map(x => x.id + ' ' + x.why).join(', ') : '', moved.length ? '글씨 크기 바뀜 ' + moved.join(',') : '', diff > DIFF_MAX ? '원본과 차이 ' + diff : ''].filter(Boolean).join(' / ')}`);
    rmSync(tmp);
  }
}
await b.close();
writeFileSync(join(OUT, 'report.json'), JSON.stringify({ at: new Date().toISOString(), total: report.length, fail: fail.length, fails: fail, report }, null, 1));
console.log(`검증 ${report.length}건 · 실패 ${fail.length}건`); fail.forEach(f => console.log((process.env.CI ? '::error title=틀 검증::' : '✗ ') + f));   // CI: 실행 화면에 오류 표시
process.exit(fail.length ? 1 : 0);
