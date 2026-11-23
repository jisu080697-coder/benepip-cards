// 사이트별 거래소 배너 (2026-11-23 · 10/27 XM 가이드 배너와 같은 디자인 · 문구만 일반용)
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
const B = process.argv[2] || 'XM';
const T = { mid: `${B} 계좌, 지금 바로 시작해 보세요`, sub: `${B} 공식 홈페이지에서 간편하게 가입할 수 있습니다.`, sub2: '실거래 계좌와 데모 계좌 모두 바로 개설할 수 있습니다.' };
const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Pretendard,sans-serif;background:#fff;width:1400px}`;
const D = {
  allthatfx: `<div style="margin:2px;width:1396px;height:400px;border-radius:22px;background:#f7f9fc;border:2px solid #e4e9f2;border-left:10px solid #2f6bff;padding:56px 66px;position:relative">
    <div style="font-size:21px;font-weight:700;color:#2f6bff">${B} 거래소 회원가입</div>
    <div style="font-size:38px;font-weight:800;color:#111827;margin-top:26px;letter-spacing:-0.5px">${T.mid}</div>
    <div style="font-size:22px;color:#4b5563;margin-top:22px">${T.sub}</div>
    <div style="display:inline-block;margin-top:44px;padding:26px 58px;border-radius:18px;background:linear-gradient(135deg,#3a7bff,#1d4ed8);color:#fff;font-size:25px;font-weight:800;box-shadow:0 14px 30px rgba(37,99,235,.28)">회원가입 바로가기 →</div></div>`,
  fxlantern: `<div style="width:1400px;height:277px;border-radius:28px;background:linear-gradient(135deg,#c2f24a,#acdf2c);padding:56px 68px;position:relative">
    <div style="display:inline-block;padding:10px 22px;border-radius:30px;background:rgba(90,130,0,.16);font-size:20px;font-weight:700;color:#2f4a00">${B} 거래소 회원가입</div>
    <div style="font-size:36px;font-weight:800;color:#121a05;margin-top:20px;font-family:'Noto Serif KR',Pretendard,serif">${T.mid}</div>
    <div style="font-size:21px;color:#2b3a10;margin-top:14px">${T.sub2}</div>
    <div style="position:absolute;right:68px;top:94px;padding:30px 46px;border-radius:20px;background:#0f150c;color:#d4ff4f;font-size:25px;font-weight:800;box-shadow:0 12px 26px rgba(0,0,0,.25)">회원가입 하러 가기 →</div></div>`,
  brokertally: `<div style="width:1400px;height:482px;background:#fff;padding:10px 24px 40px"><div style="height:430px;border-radius:24px;background:radial-gradient(ellipse at 50% 0%,#1d2a40,#141a24 70%);text-align:center;padding-top:70px;box-shadow:0 18px 34px rgba(0,0,0,.18)">
    <div style="font-size:21px;font-weight:700;color:#6aa3ff">지금 시작하기</div>
    <div style="font-size:42px;font-weight:800;color:#fff;margin-top:16px">${T.mid}</div>
    <div style="font-size:22px;color:#a8b3c4;margin-top:24px">원하는 계좌 유형으로 바로 가입할 수 있습니다.</div>
    <div style="display:inline-block;margin-top:44px;padding:26px 62px;border-radius:16px;background:#2f6fe8;color:#fff;font-size:27px;font-weight:800;box-shadow:0 0 34px rgba(47,111,232,.45)">지금 회원가입하기 →</div></div></div>`
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 600 }, deviceScaleFactor: 1 });
mkdirSync('banners/out', { recursive: true });
for (const [site, html] of Object.entries(D)) {
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@800&display=swap"><style>${css}</style></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const el = await page.$('body > div');
  await el.screenshot({ path: `banners/out/${B.toLowerCase()}_${site}_mid.jpg`, type: 'jpeg', quality: 92 });
}
await browser.close(); console.log('ok');
