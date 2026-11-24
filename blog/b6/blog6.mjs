// 네이버 블로그 카드 v6 (2026-11-24)
// - 진행 방식 = 오르비스 (사용자 선택): 글 종류별 고정 구성 · 실제 시세 데이터(Yahoo) · GitHub에서 PNG 찍기
// - 디자인 = 사용자가 고른 미리캔버스 템플릿 b4b27e11 배치 (시안 G · renderer/blog/v5/concept_g.mjs) · 표지 >>>>·붓 자국 없음
// 1080×1080 · Pretendard · 흰 글 400 + 주황 강조 800 · 장마다 배경 사진 (PC 도우미 photo 방)
// 사용: node blog/b6/blog6.mjs req.json outDir  →  outDir/p1.jpg … pN.jpg
// 글 속 *낱말* = 주황 굵게 (사선 장 가운데 줄은 검정 굵게)
// req = { kind:'stock'|'market'|'sched'|'term', date:'11.24', ph:{cover,chart,bubble,split,diag,list,bars,sum}(사진 경로·주소),
//   cover:{t:'3줄'}, chart:{t, name, unit, src, d:[[MM.DD,종가]]}, bubble:{b1,b2,t}, split:{t,x}, diag:{t,x}, list:{t,items:[4]},
//   bars:{t, rows:[[이름,등락%]], src}, sum:{x} }
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const O = '#F26B1D', W = '#fff';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ac = (s, cls) => esc(s).replace(/\*([^*\n]+)\*/g, `<b class="${cls || 'o'}">$1</b>`).replace(/\n/g, '<br>');
const src = p => !p ? '' : /^(https?|file|data):/.test(p) ? p : pathToFileURL(resolve(here, '..', '..', p)).href;
const base = (body, bg = '#000') => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><style>
*{margin:0;padding:0;box-sizing:border-box}html,body{width:1080px;height:1080px;overflow:hidden}
body{position:relative;background:${bg};font-family:'Pretendard Variable',Pretendard,sans-serif;-webkit-font-smoothing:antialiased;word-break:keep-all;text-wrap:balance;letter-spacing:-.03em;color:${W}}
.a{position:absolute}.ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.big{font-size:93px;line-height:1.24;font-weight:400}.big b{font-weight:800}
b.o{color:${O};font-weight:800}b.k{color:#111;font-weight:800}
.num{position:absolute;font-size:107px;line-height:1;font-weight:700;color:${O};letter-spacing:-.02em;font-feature-settings:'tnum'}
.bar{position:absolute;height:5px;width:104px;background:${W}}
.brand{position:absolute;right:54px;top:14px;font-size:24px;font-weight:500;letter-spacing:.02em}
.frame{position:absolute;left:56px;top:56px;width:967px;height:967px;border:3px solid ${W}}
.body32{font-size:32px;line-height:1.45;font-weight:400}
</style><script>
window.addEventListener('load', () => { document.querySelectorAll('[data-max]').forEach(el => { const mx = +el.dataset.max, mn = +el.dataset.min || 24; let fs = parseFloat(getComputedStyle(el).fontSize); while (el.scrollHeight > mx && fs > mn) { fs -= 2; el.style.fontSize = fs + 'px'; } });
  document.querySelectorAll('[data-fitw]').forEach(el => { const mn = +el.dataset.fitw || 20; let fs = parseFloat(getComputedStyle(el).fontSize); while (el.scrollWidth > el.clientWidth + 1 && fs > mn) { fs -= 2; el.style.fontSize = fs + 'px'; } }); document.body.dataset.ready = '1'; });
</script></head><body>${body}</body></html>`;
const img = (p, extra) => p ? `<img class="ph" src="${esc(src(p))}"${extra ? ` style="${extra}"` : ''}>` : '';
const numAt = (x, y, k) => `<div class="bar" style="left:${x + 19}px;top:${y - 26}px"></div><div class="num" style="left:${x}px;top:${y}px">${String(k).padStart(2, '0')}</div>`;
const bubble = (x, y, txt) => `<div class="a" style="left:${x}px;top:${y}px;width:765px;height:215px;border-radius:40px;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;text-align:center;padding:0 70px;color:#111"><div class="body32" data-max="180" data-min="24">${ac(txt)}</div></div>
  <svg class="a" style="left:${x + 70}px;top:${y + 213}px" width="44" height="34" viewBox="0 0 44 34"><path d="M0 0 H44 L6 34 Z" fill="rgba(255,255,255,.88)"/></svg>`;
const pct = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
const fmt = v => Number(v).toLocaleString('en-US', { maximumFractionDigits: v >= 1000 ? 0 : 2 });

// 표지: 사진 전체 · 오른쪽 정렬 큰 제목 3줄 · 오른쪽 아래 영문 부제
const cover = r => base(`${img(r.ph.cover)}<div class="a" style="inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55) 55%,rgba(0,0,0,.72))"></div>
  <div class="a big" data-max="400" data-min="70" style="left:63px;top:584px;width:948px;height:400px;display:flex;align-items:flex-end;justify-content:flex-end;text-align:right;font-size:107px;line-height:1.22"><div>${ac(r.cover.t)}</div></div>
  <div class="a" style="right:72px;top:1000px;font-size:25px;font-weight:600;color:${O}">Momantic Issue Brief · ${esc(r.date || '')}</div>`);
// 차트 (실제 종가): 검정 바탕 · 주황 테두리 · 위 제목 · 가운데 선 그래프 · 왼쪽 아래 번호
function chart(r, k) {
  const x = r.chart, D = x.d.slice(-30), P = D.map(d => d[1]), mx = Math.max(...P), mn = Math.min(...P), L = 130, R = 950, T = 460, B = 740;
  const X = i => L + i * (R - L) / Math.max(1, D.length - 1), Y = v => T + (mx - v) / ((mx - mn) || 1) * (B - T);
  const last = P[P.length - 1], prev = P[P.length - 2], ch = prev ? (last / prev - 1) * 100 : 0, line = P.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  return base(`<div class="a" style="left:56px;top:56px;width:967px;height:967px;border:3px solid ${O}"></div><div class="brand">MOMANTIC</div>
  <div class="a big" data-max="240" data-min="60" style="left:112px;top:106px;width:860px">${ac(x.t)}</div>
  <div class="a" style="left:112px;top:380px;font-size:30px;font-weight:500;opacity:.75">${esc(x.name || '')}</div>
  <div class="a" style="right:112px;top:368px;font-size:44px;font-weight:800;font-feature-settings:'tnum'">${fmt(last)}<span style="font-size:24px;font-weight:500;opacity:.6"> ${esc(x.unit || '')}</span> <span style="color:${O}">${pct(ch)}</span></div>
  <svg class="a" style="left:0;top:0" width="1080" height="1080"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${O}" stop-opacity=".35"/><stop offset="1" stop-color="${O}" stop-opacity="0"/></linearGradient></defs>
    ${[0, 1, 2, 3].map(q => `<line x1="${L}" x2="${R}" y1="${T + q * (B - T) / 3}" y2="${T + q * (B - T) / 3}" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>`).join('')}
    <path d="${line} L${X(P.length - 1)} ${B} L${L} ${B} Z" fill="url(#g)"/><path d="${line}" fill="none" stroke="${O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(P.length - 1)}" cy="${Y(last)}" r="12" fill="${O}" stroke="#fff" stroke-width="5"/></svg>
  <div class="a" style="left:${L}px;top:756px;font-size:24px;opacity:.55">${esc(D[0][0])}</div><div class="a" style="left:${R - 200}px;width:200px;text-align:right;top:756px;font-size:24px;opacity:.55">${esc(D[D.length - 1][0])}</div>
  <div class="a" style="left:330px;top:930px;width:640px;text-align:right;font-size:22px;opacity:.5">${esc(x.src || '자료: Yahoo Finance 종가')}</div>
  ${numAt(108, 866, k)}`);
}
// 말풍선 2개 (핵심 사실)
const bub = (r, k) => base(`${img(r.ph.bubble)}<div class="a" style="inset:0;background:rgba(0,0,0,.35)"></div><div class="frame"></div><div class="brand">MOMANTIC</div>
  ${bubble(156, 128, r.bubble.b1)}${bubble(158, 428, r.bubble.b2)}
  <div class="a big" data-max="240" data-min="60" style="left:112px;top:770px;width:700px">${ac(r.bubble.t)}</div>${numAt(848, 868, k)}`);
// 좌우 나눔 (왜·배경)
const split = (r, k) => base(`<div class="a" style="left:0;top:0;width:617px;height:1080px;overflow:hidden">${img(r.ph.split)}<div class="a" style="inset:0;background:rgba(0,0,0,.35)"></div></div>
  <div class="a" style="left:617px;top:0;width:463px;height:1080px;background:${O}"></div><div class="brand">MOMANTIC</div>
  ${numAt(112, 105, k)}<div class="a" style="left:1019px;top:242px;width:4px;height:473px;background:${W}"></div>
  <div class="a big" data-max="240" data-min="60" style="left:112px;top:770px;width:490px">${ac(r.split.t)}</div>
  <div class="a" data-max="290" data-min="22" style="left:669px;top:740px;width:339px;text-align:right;font-size:30px;line-height:1.5">${ac(r.split.x, 'k')}</div>`, O);
// 사선 (독자에게 생기는 일)
const diag = (r, k) => base(`${img(r.ph.diag)}<div class="a" style="inset:0;background:rgba(40,20,0,.35)"></div>
  <svg class="a" style="left:0;top:0" width="1080" height="1080"><path d="M0 300 L1080 1080 L0 1080 Z" fill="${O}"/></svg><div class="brand">MOMANTIC</div>
  <div class="a" style="left:954px;top:57px;width:68px;height:4px;background:${W}"></div><div class="a" style="left:1019px;top:57px;width:4px;height:470px;background:${W}"></div>
  ${numAt(818, 144, k)}
  <div class="a" style="left:59px;top:548px;width:4px;height:475px;background:${W}"></div><div class="a" style="left:59px;top:1019px;width:68px;height:4px;background:${W}"></div>
  <div class="a big" data-max="345" data-min="60" style="left:112px;top:540px;width:700px">${ac(r.diag.t, 'k')}</div>
  <div class="a body32" data-max="100" data-min="24" style="left:112px;top:895px;width:500px">${ac(r.diag.x)}</div>`);
// 목록 4개 + 원형 사진
const list = (r, k) => base(`<div class="a" style="left:56px;top:56px;width:967px;height:967px;border:3px solid ${O}"></div><div class="brand">MOMANTIC</div>
  <div class="a big" data-max="240" data-min="60" style="left:112px;top:106px;width:860px">${ac(r.list.t)}</div>
  ${(r.list.items || []).slice(0, 4).map((t, i) => `<div class="a" style="left:128px;top:${386 + i * 62}px;width:9px;height:9px;border-radius:50%;background:${W}"></div><div class="a body32" data-fitw="22" style="left:158px;top:${367 + i * 62}px;width:290px;white-space:nowrap">${ac(t)}</div>`).join('')}
  <div class="a" style="left:430px;top:391px;width:558px;height:558px;border-radius:50%;overflow:hidden">${img(r.ph.list)}</div>
  ${numAt(108, 866, k)}`);
// 함께 움직인 지수·종목 (실제 등락)
function bars(r, k) {
  const x = r.bars, R = (x.rows || []).slice(0, 5), M = Math.max(...R.map(q => Math.abs(q[1])), .1), C = 540, HW = 300;
  return base(`<div class="a" style="left:56px;top:56px;width:967px;height:967px;border:3px solid ${O}"></div><div class="brand">MOMANTIC</div>
  <div class="a big" data-max="240" data-min="60" style="left:112px;top:106px;width:860px">${ac(x.t)}</div>
  <div class="a" style="left:${C}px;top:380px;width:2px;height:${R.length * 84}px;background:#fff;opacity:.2"></div>
  ${R.map((q, i) => { const Y = 384 + i * 84, v = q[1], w = Math.max(6, Math.abs(v) / M * HW), up = v >= 0;
    return `<div class="a" data-fitw="20" style="left:${up ? 112 : C + 26}px;top:${Y + 14}px;width:${C - 150}px;${up ? 'text-align:right;' : ''}font-size:30px;white-space:nowrap">${esc(q[0])}</div>
    <div class="a" style="left:${up ? C + 2 : C - w}px;top:${Y + 12}px;width:${w}px;height:40px;border-radius:6px;background:${up ? O : '#fff'};opacity:${up ? 1 : .55}"></div>
    <div class="a" style="left:${up ? C + w + 14 : C - w - 150}px;width:136px;${up ? '' : 'text-align:right;'}top:${Y + 14}px;font-size:30px;font-weight:800;color:${up ? O : '#fff'}">${pct(v)}</div>`; }).join('')}
  <div class="a" style="left:330px;top:930px;width:640px;text-align:right;font-size:22px;opacity:.5">${esc(x.src || '자료: Yahoo Finance · 전날 대비')}</div>
  ${numAt(108, 866, k)}`);
}
// 정리: 흐린 사진 · 한 줄로 정리하면?
const sum = r => base(`${img(r.ph.sum, 'filter:blur(8px) brightness(.5);transform:scale(1.05)')}
  <div class="frame" style="border-color:rgba(255,255,255,.55)"></div>
  <div class="a big" style="left:324px;top:106px;width:637px;text-align:right">한 줄로<br><b class="o">정리하면?</b></div>
  ${[0, 1, 2].map(i => `<div class="a" style="left:906px;top:${364 + i * 22}px;width:9px;height:9px;border-radius:50%;background:${W}"></div>`).join('')}
  <div class="a" style="left:135px;top:800px;width:104px;height:5px;background:${O}"></div>
  <div class="a body32" data-max="110" data-min="24" style="left:134px;top:830px;width:830px">${ac(r.sum.x)}</div>
  <div class="a" style="left:134px;top:958px;font-size:24px;opacity:.6">투자 판단과 그 결과는 본인 책임이에요</div>
  <div class="a" style="right:54px;top:1030px;font-size:24px;font-weight:500;color:${O}">MOMANTIC</div>`);

// 글 종류별 고정 순서 (오르비스 방식) · 표지·정리 사이 본문 최대 4장 · 데이터 없는 장(차트·막대)은 빠짐
export const ORDER_ = {
  stock: ['chart', 'bubble', 'split', 'diag', 'list'],    // 종목 사건: 주가 → 핵심 사실 → 배경 → 주주에게 생기는 일 → 체크
  market: ['chart', 'bars', 'split', 'diag', 'bubble'],   // 시장 이슈: 지수 → 함께 움직인 것 → 이유 → 영향
  sched: ['bubble', 'list', 'diag', 'split'],             // 일정형: 핵심 일정 → 체크 → 주의
  term: ['bubble', 'split', 'diag', 'list']               // 용어: 뜻 → 왜 하나 → 내 주식은 → 체크
};
const F = { chart, bubble: bub, split, diag, list, bars };
const ok = (r, k) => k === 'chart' ? r.chart && (r.chart.d || []).length >= 5 : k === 'bars' ? r.bars && (r.bars.rows || []).length >= 3 : !!r[k];
export const blogLayouts = r => (Array.isArray(r.L) && r.L.length ? r.L : (ORDER_[r.kind] || ORDER_.stock)).filter(k => F[k] && ok(r, k)).slice(0, 4);   // 서버(NbV6.gs)가 정한 순서 r.L 그대로
export const blogPages = r => { r.ph = r.ph || {}; return [cover(r)].concat(blogLayouts(r).map((k, i) => F[k](r, i + 1)), [sum(r)]); };

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { chromium } = await import('playwright-core');
  const r = JSON.parse(readFileSync(process.argv[2], 'utf8')), out = process.argv[3] || join(here, 'out'); mkdirSync(out, { recursive: true });
  const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : { channel: process.env.PW_CHANNEL || 'chrome' });
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  for (const [i, html] of blogPages(r).entries()) {
    const tmp = join(out, '_p.html'); writeFileSync(tmp, html); await pg.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready); await pg.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 15000 }).catch(() => { });
    await pg.screenshot({ path: join(out, `p${i + 1}.jpg`), type: 'jpeg', quality: 90 });
  }
  try { rmSync(join(out, '_p.html')); } catch (e) { }
  await browser.close(); console.log('ok', out);
}
