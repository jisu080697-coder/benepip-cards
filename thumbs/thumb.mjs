// 포스트 대표 이미지 렌더러: 요청 JSON → 실제 크롬으로 1200×630(×1.5) JPEG
// 사용: node thumbs/thumb.mjs req.json 출력.jpg
// 사이트별 틀 (피그마 '포스트 대표 이미지' 확정안 · 2026-11-02)
//   allthatfx  = 보도 사진형 (사진 전체 + 아래 흰 굵은 제목)
//   brokertally = 스펙 시트 (검정 · 줄 · JetBrains Mono 정보 칸)
//   fxlantern  = 뉴스룸 금빛 명조 (TODAY'S MARKET / GLOBAL WATCH 배경)
import { chromium } from 'playwright-core';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FONTS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&family=Noto+Serif+KR:wght@500;700&family=JetBrains+Mono:wght@400;500;700&family=Montaga&display=block';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COMPASS = 'M17.5717 31.9831C17.5697 32.0292 17.447 31.9711 17.445 31.9265L17.2646 27.915C12.9378 27.8405 8.76997 25.9337 6.11807 22.5402C4.71465 20.7171 3.84899 18.5496 3.78388 16.2275L0.0878589 16.0612L0.00274407 15.9883C-0.0160832 15.9724 0.0670705 15.9301 0.0968803 15.9216L3.78506 15.7599C3.83291 13.6933 4.55815 11.7042 5.74035 9.99349C8.31694 6.29761 12.7374 4.18988 17.2673 4.09566L17.4466 0.0965678C17.4478 0.0725283 17.4733 -0.00889602 17.4921 0.000797349L17.5764 0.0430604L17.76 4.08946C22.0338 4.14684 26.2683 6.05178 28.883 9.41267C30.3017 11.2552 31.1862 13.4432 31.232 15.7595L34.9834 15.9258L34.9999 16.0232C35.0038 16.0468 34.9289 16.0635 34.8979 16.0646L31.2336 16.231C31.183 18.6373 30.2707 20.8024 28.8127 22.6852C26.1648 26.0248 22.0271 27.8308 17.76 27.9173L17.5717 31.9827V31.9831ZM13.9804 14.5734C15.5721 13.7844 16.4974 12.4347 16.8119 10.7096C16.9398 10.009 17.0257 9.33473 17.0583 8.6213L17.2356 4.72922C15.829 4.77885 14.6507 5.36549 13.6137 6.26155C11.8992 7.83304 10.8249 10.0664 10.3118 12.304C10.0706 13.3567 9.90862 14.378 9.89489 15.4671C11.3124 15.3714 12.7209 15.1973 13.9804 14.5734ZM25.1442 15.4532C25.1014 13.7642 24.8116 12.1931 24.2585 10.6523C23.8094 9.43244 23.2093 8.3115 22.4021 7.29447C21.2281 5.84628 19.7082 4.8025 17.7855 4.72573L17.9765 8.79035C18.0138 9.58056 18.124 10.3188 18.2966 11.0733C18.6637 12.6751 19.6984 13.9631 21.2081 14.642C22.4601 15.205 23.7612 15.3842 25.1442 15.4532ZM9.24575 15.5137C9.32066 13.5917 9.68936 11.7996 10.3707 10.0776C10.9261 8.75313 11.638 7.53138 12.6135 6.48023C13.1065 5.94865 13.6266 5.51749 14.2295 5.09951C11.9596 5.60822 9.90235 6.67565 8.20358 8.19983C7.08532 9.22694 6.162 10.415 5.5003 11.7716C4.88841 13.0202 4.55149 14.3326 4.52874 15.7227L9.24575 15.5137ZM30.4978 15.713C30.4676 14.2764 30.1185 12.9922 29.5203 11.7685C28.9002 10.4685 28.0393 9.33396 26.99 8.33399C25.2728 6.75048 23.165 5.60473 20.8159 5.10145C21.5344 5.61519 22.1605 6.13166 22.7178 6.78964C23.6274 7.86367 24.2973 9.07146 24.8045 10.3867C25.4176 12.0287 25.7329 13.7371 25.7843 15.5129L30.4982 15.713H30.4978ZM11.534 24.1574C10.7551 22.9632 10.1981 21.6818 9.829 20.3026C9.49403 19.0525 9.28418 17.8153 9.24771 16.4915L4.5303 16.2744C4.53619 17.5097 4.81977 18.7148 5.32654 19.8706C6.00589 21.3886 7.00491 22.7248 8.24241 23.8515C9.93176 25.3517 11.9745 26.4253 14.2318 26.9162C13.1034 26.1345 12.2754 25.2702 11.5344 24.1574H11.534ZM20.8049 26.9135C23.1155 26.4226 25.1893 25.3331 26.872 23.7949C28.0589 22.6879 29.0191 21.4026 29.6721 19.9288C30.1899 18.766 30.4762 17.5528 30.4982 16.2767L25.7874 16.4857C25.6702 19.6717 24.701 22.9935 22.539 25.397C22.0279 25.9934 21.4289 26.449 20.8045 26.9131L20.8049 26.9135ZM17.0967 23.9566L16.8876 21.7391C16.6076 19.733 15.6835 18.2515 13.8219 17.3647C12.5923 16.8056 11.2571 16.6327 9.88783 16.5385C9.94941 18.6586 10.4785 20.9885 11.4458 22.85C12.6197 25.1097 14.5244 27.1729 17.236 27.2865L17.0967 23.9562V23.9566ZM17.7863 27.29C18.8269 27.2461 19.7357 26.9239 20.5664 26.3947C21.3058 25.9236 21.9 25.3296 22.4491 24.6472C24.2444 22.3471 25.0422 19.4674 25.1465 16.5478C23.7219 16.6334 22.2554 16.8207 20.9904 17.4713C20.0898 17.9405 19.3403 18.6121 18.8508 19.5007C18.4982 20.1413 18.2448 20.8152 18.1675 21.5402L17.9655 23.4448L17.7863 27.29Z';
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 제목 줄: 요청에 줄바꿈(\n)이 있으면 그대로, 없으면 단어 단위 자동 줄바꿈 (keep-all)
const lines = t => esc(t).replace(/\n/g, '<br>');

const SITES = {
  allthatfx: r => {
    const [y, m, d] = r.date.split('-');
    const ph = r.photo && !/^(file|https?):/.test(r.photo) ? pathToFileURL(resolve(here, '..', r.photo)).href : r.photo;   // 저장소 안 경로(thumbs/…/photo.jpg)도 받음
    const bg = ph ? `<img class="ph" src="${esc(ph)}">` : '';
    return `<style>
      .f{background:linear-gradient(135deg,#0b1260,#000342)}
      .ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,3,40,.55) 0,rgba(0,3,40,0) 26%,rgba(0,3,40,0) 32%,rgba(0,3,51,.93) 100%)}
      .top{position:absolute;left:64px;right:64px;top:50px;display:flex;align-items:center;color:#fff}
      .top svg{width:26px;height:24px;margin-right:10px}.top b{font:700 20px 'Noto Sans KR';letter-spacing:.02em}.top em{margin-left:auto;font:500 15px 'Noto Sans KR';font-style:normal;opacity:.75}
      .bot{position:absolute;left:64px;right:110px;bottom:64px;color:#fff}
      .cat{display:flex;align-items:center;font:700 19px 'Noto Sans KR';margin-bottom:16px}.cat:before{content:'';width:4px;height:22px;background:#3D63FF;margin-right:10px}
      .t{font:900 56px/1.24 'Noto Sans KR';letter-spacing:-.03em;word-break:keep-all;text-shadow:0 2px 16px rgba(0,0,40,.35)}
    </style>${bg}<div class="sh"></div>
    <div class="top"><svg viewBox="0 0 35 32"><path fill="#fff" d="${COMPASS}"/></svg><b>ALL THAT FX</b><em>${y}. ${m}. ${d}</em></div>
    <div class="bot"><div class="cat">${esc(r.cat)}</div><div class="t fit" data-max="3">${lines(r.head)}</div></div>`;
  },
  brokertally: r => {
    const cols = [['CATEGORY', r.cat, 1], ['BROKER', r.broker || '—'], ['TOPIC', r.topic || '—', 1], ['DATE', r.date.replace(/-/g, '.')]];
    const [l1, ...rest] = String(r.head).split('\n');
    return `<style>
      .f{background:#0A0B0E;color:#fff}
      .top{position:absolute;left:72px;right:72px;top:58px;display:flex;align-items:center}
      .top svg{width:20px;height:24px;margin-right:12px}.top b{font:700 22px 'JetBrains Mono'}.top em{margin-left:auto;font:400 14px 'JetBrains Mono';font-style:normal;color:#7F7F8F;letter-spacing:.08em}
      .rule{position:absolute;left:72px;right:72px;height:1px;background:rgba(255,255,255,.16)}
      .t{position:absolute;left:72px;right:100px;top:150px;font:700 60px/1.26 'Noto Sans KR';letter-spacing:-.035em;word-break:keep-all}
      .t span{color:#A8C9FA}
      .cols{position:absolute;left:72px;right:72px;top:470px;height:92px;display:grid;grid-template-columns:repeat(4,1fr)}
      .cols div{padding:24px 0 0 24px;border-left:1px solid rgba(255,255,255,.16)}.cols div:first-child{padding-left:0;border-left:none}
      .cols small{display:block;font:400 13px 'JetBrains Mono';color:#7F7F8F;letter-spacing:.1em;margin-bottom:8px}
      .cols b{font:500 20px 'JetBrains Mono';color:#E6E8EC}.cols b.k{font-family:'Noto Sans KR'}
    </style>
    <div class="top"><svg viewBox="0 0 24 28"><path d="M2 0h20v8H10v4h10v8H10v8H2z" fill="#fff"/></svg><b>Brokertally</b><em>FX BROKER FINDER</em></div>
    <div class="rule" style="top:116px"></div>
    <div class="t fit" data-max="3">${esc(l1)}${rest.length ? '<br><span>' + lines(rest.join('\n')) + '</span>' : ''}</div>
    <div class="rule" style="top:470px"></div>
    <div class="cols">${cols.map(([k, v, ko]) => `<div><small>${k}</small><b class="${ko ? 'k' : ''}">${esc(v)}</b></div>`).join('')}</div>
    <div class="rule" style="top:562px"></div>`;
  },
  fxlantern: r => {
    const [y, m, d] = r.date.split('-'), img = /규제|해외거래소|브로커/.test(r.cat) ? 'fxl_global.jpg' : 'fxl_market.jpg';
    return `<style>
      .f{background:#0e0d0a}
      .bg{position:absolute;left:127.5px;top:0;width:945px;height:630px;object-fit:cover}
      .e{position:absolute;top:0;width:120px;height:630px}
      .sh{position:absolute;left:150px;top:150px;width:900px;height:300px;background:radial-gradient(closest-side,rgba(8,8,5,.75),rgba(8,8,5,0))}
      .box{position:absolute;left:120px;width:960px;top:${img === 'fxl_global.jpg' ? 150 : 186}px;height:${img === 'fxl_global.jpg' ? 200 : 230}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
      .cat{font:500 18px 'Noto Serif KR';letter-spacing:.12em;color:#D1F10B;margin-bottom:18px}
      .t{font:700 54px/1.36 'Noto Serif KR';letter-spacing:-.02em;word-break:keep-all;background:linear-gradient(180deg,#FAE8BD,#E3C27F 55%,#BD9454);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))}
      .ft{position:absolute;left:40px;bottom:24px;font:400 15px Montaga;color:rgba(232,207,153,.7)}
    </style>
    <img class="bg" src="${pathToFileURL(join(here, 'assets', img)).href}">
    <div class="e" style="left:127.5px;background:linear-gradient(90deg,#0e0d0a,rgba(14,13,10,0))"></div>
    <div class="e" style="left:952.5px;background:linear-gradient(270deg,#0e0d0a,rgba(14,13,10,0))"></div>
    <div class="sh"></div>
    <div class="box"><div class="cat">${esc(r.cat)}</div><div class="t fit" data-max="${img === 'fxl_global.jpg' ? 2 : 3}">${lines(r.head)}</div></div>
    <div class="ft">FXLantern  ·  ${MONTH[Number(m) - 1]} ${Number(d)}, ${y}</div>`;
  },
};

export async function renderThumb(req, out, browser) {
  const make = SITES[req.site];
  if (!make) throw new Error('대표 이미지 틀이 없는 사이트: ' + req.site);
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}"><style>*{margin:0;padding:0;box-sizing:border-box}body{width:1200px;height:630px;-webkit-font-smoothing:antialiased}.f{position:relative;width:1200px;height:630px;overflow:hidden}</style></head><body><div class="f">${make(req)}</div></body></html>`;
  const tmp = join(here, `_tmp_${process.pid}.html`); writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1.5 });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  // 제목이 정한 줄 수(data-max)를 넘으면 글씨를 조금씩 줄임 (최소 70%)
  const fit = await page.evaluate(() => {
    const t = document.querySelector('.fit'); if (!t) return 1;
    const max = Number(t.dataset.max || 3), base = parseFloat(getComputedStyle(t).fontSize); let s = base;
    const over = () => Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight)) > max;
    while (over() && s > base * 0.7) { s -= 2; t.style.fontSize = s + 'px'; }
    return s / base;
  });
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
  await page.close(); rmSync(tmp, { force: true });
  return { fit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , input, outArg] = process.argv;
  const req = JSON.parse(readFileSync(input, 'utf8'));
  const browser = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
  try {
    const r = await renderThumb(req, resolve(outArg || join(here, 'out', req.id + '.jpg')), browser);
    console.log('ok', JSON.stringify(r));
  } finally { await browser.close(); }
}
