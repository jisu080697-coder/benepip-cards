// BenePip 글래스 아이콘 팩 · 반투명 유리 원판 + 부드러운 평면 아이콘 + 포인트 점 하나
// glassIcon(name, size) → HTML (원판 뒤 흐릿한 파랑 빛 포함) · 아이콘 몸체: 하늘 그라데이션 / 받침: 메인 파랑 / 포인트: 빨강(알림) · 노랑(돈)
const LB = 'url(#gb)', DB = '#2455f5', W = '#ffffff', R = '#ff5a5f', Y = '#ffc83d';
const defs = `<defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c6ff"/><stop offset="1" stop-color="#6b97ff"/></linearGradient>
  <linearGradient id="gy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe28a"/><stop offset="1" stop-color="#ffbe2e"/></linearGradient></defs>`;
const P = {
  bell: `<path d="M100 32c-32 0-54 25-54 58v32l-14 22h136l-14-22V90c0-33-22-58-54-58z" fill="${LB}"/><ellipse cx="100" cy="158" rx="22" ry="15" fill="${DB}"/><circle cx="148" cy="46" r="14" fill="${R}"/>`,
  coin: `<circle cx="100" cy="106" r="66" fill="#e3a21c"/><circle cx="100" cy="98" r="66" fill="url(#gy)"/><circle cx="100" cy="98" r="46" fill="none" stroke="${W}" stroke-opacity=".6" stroke-width="7"/><text x="100" y="119" text-anchor="middle" font-size="60" font-weight="800" fill="${W}" font-family="Wanted Sans Variable,sans-serif">$</text>`,
  calendar: `<rect x="32" y="46" width="136" height="124" rx="24" fill="${LB}"/><path d="M32 70a24 24 0 0 1 24-24h88a24 24 0 0 1 24 24v12H32z" fill="${DB}"/><rect x="62" y="32" width="12" height="28" rx="6" fill="${DB}"/><rect x="126" y="32" width="12" height="28" rx="6" fill="${DB}"/>
    ${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<rect x="${50 + c * 27}" y="${96 + r * 23}" width="17" height="13" rx="4" fill="${r === 1 && c === 2 ? DB : W}" opacity="${r === 1 && c === 2 ? 1 : .85}"/>`).join('')).join('')}`,
  wallet: `<rect x="44" y="50" width="104" height="70" rx="14" fill="${W}" opacity=".9" transform="rotate(-8 96 85)"/><rect x="30" y="70" width="140" height="100" rx="24" fill="${LB}"/><rect x="118" y="100" width="52" height="38" rx="14" fill="${DB}"/><circle cx="136" cy="119" r="7" fill="${Y}"/>`,
  chart: `<rect x="34" y="104" width="30" height="62" rx="10" fill="${LB}"/><rect x="76" y="76" width="30" height="90" rx="10" fill="${LB}"/><rect x="118" y="44" width="30" height="122" rx="10" fill="${DB}"/>`,
  shield: `<path d="M100 28l62 22v46c0 42-28 68-62 82-34-14-62-40-62-82V50z" fill="${LB}"/><path d="M72 100l20 20 38-40" stroke="${W}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  lock: `<path d="M68 90V70a32 32 0 0 1 64 0v20" stroke="${DB}" stroke-width="16" fill="none" stroke-linecap="round"/><rect x="44" y="84" width="112" height="88" rx="24" fill="${LB}"/><circle cx="100" cy="120" r="12" fill="${W}"/><rect x="94" y="122" width="12" height="26" rx="6" fill="${W}"/>`,
  search: `<rect x="122" y="120" width="22" height="58" rx="11" transform="rotate(-45 133 149)" fill="${DB}"/><circle cx="88" cy="88" r="54" fill="${LB}"/><circle cx="88" cy="88" r="34" fill="${W}" opacity=".85"/><path d="M68 76a26 26 0 0 1 20-14" stroke="${LB}" stroke-width="9" stroke-linecap="round" fill="none"/>`,
  gift: `<rect x="40" y="86" width="120" height="84" rx="18" fill="${LB}"/><rect x="32" y="64" width="136" height="34" rx="14" fill="${DB}"/><rect x="92" y="64" width="16" height="106" fill="${W}" opacity=".9"/><path d="M100 64c-14-30-50-32-50-12 0 12 26 12 50 12zM100 64c14-30 50-32 50-12 0 12-26 12-50 12z" fill="#8fb4ff"/>`,
  clock: `<circle cx="100" cy="104" r="68" fill="${LB}"/><circle cx="100" cy="104" r="50" fill="${W}" opacity=".9"/><path d="M100 104V72" stroke="${DB}" stroke-width="10" stroke-linecap="round"/><path d="M100 104l26 16" stroke="${DB}" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="104" r="8" fill="${DB}"/>`,
  target: `<circle cx="94" cy="108" r="64" fill="${LB}"/><circle cx="94" cy="108" r="42" fill="${W}" opacity=".9"/><circle cx="94" cy="108" r="22" fill="${LB}"/><circle cx="94" cy="108" r="9" fill="${DB}"/><path d="M98 104l58-58" stroke="${DB}" stroke-width="9" stroke-linecap="round"/><path d="M148 36l18 4 4 18-16-6z" fill="${DB}"/>`,
  card: `<rect x="30" y="56" width="140" height="96" rx="20" fill="${LB}"/><rect x="30" y="76" width="140" height="18" fill="${DB}"/><rect x="48" y="112" width="44" height="12" rx="6" fill="${W}" opacity=".9"/><circle cx="150" cy="126" r="11" fill="${Y}" opacity=".9"/>`,
  calculator: `<rect x="50" y="30" width="100" height="144" rx="22" fill="${LB}"/><rect x="64" y="46" width="72" height="30" rx="8" fill="${DB}"/>${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect x="${64 + c * 26}" y="${90 + r * 26}" width="18" height="18" rx="6" fill="${r === 2 && c === 2 ? DB : W}" opacity="${r === 2 && c === 2 ? 1 : .9}"/>`).join('')).join('')}`,
  check: `<circle cx="100" cy="100" r="68" fill="${LB}"/><path d="M68 102l22 22 44-46" stroke="${W}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  doc: `<path d="M50 30h70l32 32v100a14 14 0 0 1-14 14H50a14 14 0 0 1-14-14V44a14 14 0 0 1 14-14z" fill="${LB}"/><path d="M120 30v26a8 8 0 0 0 8 8h24z" fill="${DB}"/>${[0, 1, 2].map(r => `<rect x="58" y="${88 + r * 24}" width="${r === 2 ? 46 : 74}" height="12" rx="6" fill="${W}" opacity=".9"/>`).join('')}`,
  megaphone: `<path d="M40 86h26l70-38v104l-70-38H40a10 10 0 0 1-10-10v-8a10 10 0 0 1 10-10z" fill="${LB}"/><rect x="56" y="114" width="22" height="46" rx="10" fill="${DB}"/><path d="M152 78c10 6 14 14 14 22s-4 16-14 22" stroke="${DB}" stroke-width="9" stroke-linecap="round" fill="none"/>`,
  key: `<circle cx="70" cy="100" r="34" fill="${LB}"/><circle cx="70" cy="100" r="13" fill="${W}"/><rect x="96" y="92" width="76" height="16" rx="8" fill="${DB}"/><rect x="138" y="100" width="14" height="26" rx="5" fill="${DB}"/><rect x="158" y="100" width="12" height="18" rx="5" fill="${DB}"/>`,
  bulb: `<path d="M100 30a48 48 0 0 0-28 87c6 5 8 12 8 20h40c0-8 2-15 8-20a48 48 0 0 0-28-87z" fill="${LB}"/><rect x="80" y="142" width="40" height="12" rx="6" fill="${DB}"/><rect x="84" y="158" width="32" height="12" rx="6" fill="${DB}"/>`,
  chat: `<path d="M44 42h96a20 20 0 0 1 20 20v50a20 20 0 0 1-20 20H86l-30 24v-24H44a20 20 0 0 1-20-20V62a20 20 0 0 1 20-20z" fill="${LB}"/>${[0, 1, 2].map(i => `<circle cx="${68 + i * 24}" cy="87" r="8" fill="${W}"/>`).join('')}`,
  globe: `<circle cx="100" cy="100" r="68" fill="${LB}"/><ellipse cx="100" cy="100" rx="30" ry="68" fill="none" stroke="${W}" stroke-opacity=".8" stroke-width="7"/><path d="M34 100h132M44 66h112M44 134h112" stroke="${W}" stroke-opacity=".8" stroke-width="7"/>`,
  exchange: `<circle cx="100" cy="100" r="68" fill="${LB}"/><path d="M62 84h70l-18-18M138 116H68l18 18" stroke="${W}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
  percent: `<rect x="34" y="34" width="132" height="132" rx="36" fill="${LB}"/><circle cx="76" cy="76" r="15" fill="none" stroke="${W}" stroke-width="10"/><circle cx="124" cy="124" r="15" fill="none" stroke="${W}" stroke-width="10"/><path d="M130 70l-60 60" stroke="${W}" stroke-width="10" stroke-linecap="round"/>`,
  warning: `<path d="M100 30c8 0 14 4 18 11l54 96c8 14-2 31-18 31H46c-16 0-26-17-18-31l54-96c4-7 10-11 18-11z" fill="${LB}"/><rect x="92" y="74" width="16" height="54" rx="8" fill="${W}"/><circle cx="100" cy="146" r="10" fill="${R}"/>`,
  money: `<rect x="28" y="62" width="144" height="86" rx="18" fill="#e3a21c" transform="rotate(-6 100 105)"/><rect x="28" y="56" width="144" height="86" rx="18" fill="url(#gy)"/><circle cx="100" cy="99" r="22" fill="${W}" opacity=".7"/><text x="100" y="110" text-anchor="middle" font-size="30" font-weight="800" fill="#e3a21c" font-family="Wanted Sans Variable,sans-serif">$</text>`,
};
export const GLASS_NAMES = Object.keys(P);
export const GLASS_CSS = `.gi{position:relative;display:grid;place-items:center}
.gi .blob{position:absolute;width:62%;height:62%;left:46%;top:44%;border-radius:50%;background:radial-gradient(circle,#5b8cff 0%,rgba(91,140,255,.55) 45%,rgba(91,140,255,0) 72%);filter:blur(6px)}
.gi .disc{position:relative;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.75),rgba(255,255,255,.32) 55%,rgba(255,255,255,.22));backdrop-filter:blur(16px) saturate(1.3);-webkit-backdrop-filter:blur(16px) saturate(1.3);
  box-shadow:inset 0 0 0 3px rgba(255,255,255,.7),inset 0 -18px 40px rgba(36,85,245,.10),0 28px 60px rgba(36,85,245,.18);display:grid;place-items:center}
.gi.dark .blob{background:radial-gradient(circle,#9fbcff 0%,rgba(159,188,255,.45) 45%,rgba(159,188,255,0) 72%)}
.gi.dark .disc{background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.45),rgba(255,255,255,.14) 60%,rgba(255,255,255,.08));box-shadow:inset 0 0 0 3px rgba(255,255,255,.55),0 28px 60px rgba(10,20,60,.25)}
.gi.solo svg{width:100%;height:100%;filter:drop-shadow(0 18px 22px rgba(36,85,245,.22))}
.gi.solo.dark svg{filter:drop-shadow(0 18px 22px rgba(8,18,60,.30))}
.gi.solo::after{content:'';position:absolute;left:18%;right:18%;bottom:-4%;height:9%;border-radius:50%;background:radial-gradient(ellipse,rgba(19,33,59,.22),rgba(19,33,59,0) 70%);filter:blur(4px)}
.gi.solo.dark::after{background:radial-gradient(ellipse,rgba(5,12,40,.35),rgba(5,12,40,0) 70%)}
.gi.solo.glass svg{filter:drop-shadow(0 16px 26px rgba(36,85,245,.20))}
.gi .disc svg{width:58%;height:58%;filter:drop-shadow(0 10px 14px rgba(36,85,245,.22))}`;
// dark: 메인 파랑·남색 바탕용 (아이콘 몸체를 흰색으로)
const defsW = `<defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d6e2ff"/></linearGradient></defs>`;
// disc: true 일 때만 유리 원판 (기본은 아이콘만)
const defsG = `<defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".92"/><stop offset=".55" stop-color="#dbe6ff" stop-opacity=".62"/><stop offset="1" stop-color="#9fbcff" stop-opacity=".5"/></linearGradient></defs>`;
// opt: { dark, disc, glass } · glass = 반투명 유리 몸체
export function glassIconX(name, opt) { opt = opt || {};
  if (!opt.glass) return glassIcon(name, opt.dark, opt.disc);
  let body = (P[name] || P.bell).split('fill="url(#gb)"').join('fill="url(#gg)" stroke="#ffffff" stroke-opacity=".85" stroke-width="3"');
  return `<div class="gi solo glass${opt.dark ? ' dark' : ''}"><svg viewBox="0 0 200 200">${defs}${defsG}${body}</svg></div>`;
}
export function glassIcon(name, dark, disc) {
  let body = P[name] || P.bell;
  // 어두운 바탕: 몸체는 흰색, 흰 디테일(체크·열쇠 구멍 등)은 파랑으로 (노란 돈 아이콘은 그대로)
  if (dark) { body = body.split('url(#gb)').join('url(#gw)'); body = body.split('"#2455f5"').join('"#a9c6ff"'); if (!/url\(#gy\)/.test(body)) body = body.split('"#ffffff"').join('"#2455f5"'); }
  const svg = `<svg viewBox="0 0 200 200">${defs}${dark ? defsW : ''}${body}</svg>`;
  return disc ? `<div class="gi${dark ? ' dark' : ''}"><div class="blob"></div><div class="disc">${svg}</div></div>` : `<div class="gi solo${dark ? ' dark' : ''}">${svg}</div>`;
}
