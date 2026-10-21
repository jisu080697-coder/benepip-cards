// BenePip 카드 일러스트 · 말랑한 입체(클레이) 느낌의 SVG 아이콘 세트
// icon(name, accent) → <svg> 문자열 · 400×400 · 연한 몸체 + 주제색 포인트 + 부드러운 그림자
const base = '#eef2fb', base2 = '#dde5f5', hi = '#ffffff', ink = '#13213b';
const defs = (id, a) => `<defs>
  <filter id="sh${id}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="20" flood-color="#13213b" flood-opacity=".16"/></filter>
  <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${base2}"/></linearGradient>
  <linearGradient id="a${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}" stop-opacity=".82"/><stop offset="1" stop-color="${a}"/></linearGradient>
</defs>`;

const ICONS = {
  // 동전 더미 (페이백·수수료)
  coins: (a, i) => `<g filter="url(#sh${i})">
    <ellipse cx="200" cy="292" rx="120" ry="40" fill="#e7b93a"/><rect x="80" y="252" width="240" height="40" fill="#e7b93a"/><ellipse cx="200" cy="252" rx="120" ry="40" fill="#f6cf5c"/>
    <ellipse cx="200" cy="212" rx="120" ry="40" fill="#e7b93a"/><rect x="80" y="172" width="240" height="40" fill="#e7b93a"/><ellipse cx="200" cy="172" rx="120" ry="40" fill="#f6cf5c"/>
    <ellipse cx="200" cy="132" rx="120" ry="40" fill="#e7b93a"/><rect x="80" y="92" width="240" height="40" fill="#e7b93a"/><ellipse cx="200" cy="92" rx="120" ry="40" fill="#fbdc79"/>
    <text x="200" y="108" text-anchor="middle" font-size="58" font-weight="800" fill="#b8860b" font-family="Pretendard Variable, sans-serif">$</text></g>`,
  // 달력 (경제 캘린더)
  calendar: (a, i) => `<g filter="url(#sh${i})"><rect x="70" y="80" width="260" height="250" rx="40" fill="url(#b${i})"/>
    <path d="M70 120a40 40 0 0 1 40-40h180a40 40 0 0 1 40 40v30H70z" fill="url(#a${i})"/>
    <rect x="125" y="58" width="22" height="56" rx="11" fill="${base2}"/><rect x="253" y="58" width="22" height="56" rx="11" fill="${base2}"/>
    ${[0, 1, 2, 3].map(r => [0, 1, 2, 3].map(c => `<rect x="${102 + c * 52}" y="${178 + r * 36}" width="36" height="22" rx="8" fill="${r === 1 && c === 2 ? a : '#c9d4ea'}" opacity="${r === 1 && c === 2 ? 1 : .7}"/>`).join('')).join('')}</g>`,
  // 차트 폰 (MT4·MT5)
  phone: (a, i) => `<g filter="url(#sh${i})"><rect x="110" y="40" width="180" height="320" rx="40" fill="url(#b${i})"/><rect x="128" y="76" width="144" height="248" rx="18" fill="#ffffff"/>
    ${[[150, 210, 60, 0], [176, 170, 70, 1], [202, 190, 50, 0], [228, 140, 80, 1], [254, 120, 60, 1]].map(([x, y, h, up]) => `<rect x="${x - 2}" y="${y - 16}" width="4" height="${h + 32}" rx="2" fill="${up ? a : '#f26b6b'}"/><rect x="${x - 9}" y="${y}" width="18" height="${h}" rx="5" fill="${up ? a : '#f26b6b'}"/>`).join('')}
    <rect x="170" y="52" width="60" height="10" rx="5" fill="${base2}"/></g>`,
  // 돋보기 (확인·비교)
  magnifier: (a, i) => `<g filter="url(#sh${i})"><rect x="232" y="232" width="56" height="130" rx="28" transform="rotate(-45 260 297)" fill="${ink}"/>
    <circle cx="175" cy="175" r="118" fill="url(#b${i})"/><circle cx="175" cy="175" r="82" fill="#ffffff"/><circle cx="175" cy="175" r="82" fill="${a}" opacity=".14"/>
    <path d="M135 150a52 52 0 0 1 42-34" stroke="#ffffff" stroke-width="16" stroke-linecap="round" fill="none"/></g>`,
  // 방패 체크 (안전·확인 완료)
  shield: (a, i) => `<g filter="url(#sh${i})"><path d="M200 50l130 48v96c0 86-58 138-130 166C128 332 70 280 70 194V98z" fill="url(#b${i})"/>
    <path d="M200 92l92 34v68c0 60-40 98-92 118-52-20-92-58-92-118v-68z" fill="url(#a${i})"/>
    <path d="M155 200l32 32 62-66" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`,
  // 경고 (주의할 조건)
  warning: (a, i) => `<g filter="url(#sh${i})"><path d="M200 60c14 0 26 7 33 19l116 202c14 25-4 56-33 56H84c-29 0-47-31-33-56L167 79c7-12 19-19 33-19z" fill="url(#b${i})"/>
    <rect x="186" y="140" width="28" height="110" rx="14" fill="${a}"/><circle cx="200" cy="285" r="17" fill="${a}"/></g>`,
  // 문서 체크리스트 (조건·서류)
  doc: (a, i) => `<g filter="url(#sh${i})"><rect x="96" y="56" width="208" height="288" rx="34" fill="url(#b${i})"/>
    ${[0, 1, 2].map(r => `<rect x="130" y="${112 + r * 70}" width="36" height="36" rx="11" fill="${r < 2 ? a : '#c9d4ea'}"/>${r < 2 ? `<path d="M139 ${130 + r * 70}l7 7 12-14" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : ''}<rect x="182" y="${120 + r * 70}" width="${r === 1 ? 70 : 92}" height="20" rx="10" fill="#c9d4ea"/>`).join('')}</g>`,
  // 시계 (지급 주기·시간)
  clock: (a, i) => `<g filter="url(#sh${i})"><circle cx="200" cy="205" r="140" fill="url(#b${i})"/><circle cx="200" cy="205" r="104" fill="#ffffff"/>
    <path d="M200 205V140" stroke="${ink}" stroke-width="18" stroke-linecap="round"/><path d="M200 205l52 30" stroke="${a}" stroke-width="18" stroke-linecap="round"/><circle cx="200" cy="205" r="14" fill="${ink}"/></g>`,
  // 선물 (가입 혜택·크레딧)
  gift: (a, i) => `<g filter="url(#sh${i})"><rect x="86" y="170" width="228" height="170" rx="28" fill="url(#b${i})"/><rect x="70" y="128" width="260" height="64" rx="24" fill="#ffffff"/>
    <rect x="182" y="128" width="36" height="212" fill="url(#a${i})"/>
    <path d="M200 128c-30-56-92-60-92-22 0 24 50 22 92 22zM200 128c30-56 92-60 92-22 0 24-50 22-92 22z" fill="url(#a${i})"/></g>`,
  // 지갑 (출금·입금)
  wallet: (a, i) => `<g filter="url(#sh${i})"><rect x="78" y="96" width="220" height="150" rx="26" fill="url(#a${i})" transform="rotate(-8 188 171)"/>
    <rect x="60" y="140" width="280" height="200" rx="36" fill="url(#b${i})"/><rect x="240" y="208" width="100" height="64" rx="24" fill="#ffffff"/><circle cx="276" cy="240" r="13" fill="${a}"/></g>`,
  // 과녁 (목표·핵심)
  target: (a, i) => `<g filter="url(#sh${i})"><circle cx="190" cy="215" r="135" fill="url(#b${i})"/><circle cx="190" cy="215" r="92" fill="#ffffff"/><circle cx="190" cy="215" r="50" fill="${base}"/><circle cx="190" cy="215" r="20" fill="${a}"/></g>
    <path d="M196 209L318 87" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><path d="M300 70l32 6 6 32-26-12z" fill="${a}"/>`,
  // 퍼센트 태그 (요율·스프레드)
  percent: (a, i) => `<g filter="url(#sh${i})"><path d="M80 118c0-22 18-40 40-40h112l100 100c16 16 16 41 0 57l-97 97c-16 16-41 16-57 0L80 234z" fill="url(#b${i})"/>
    <circle cx="140" cy="138" r="18" fill="#ffffff"/><circle cx="196" cy="198" r="22" fill="none" stroke="${a}" stroke-width="16"/><circle cx="262" cy="262" r="22" fill="none" stroke="${a}" stroke-width="16"/><path d="M276 184l-92 92" stroke="${a}" stroke-width="16" stroke-linecap="round"/></g>`,
  // 지구 (해외 브로커)
  globe: (a, i) => `<g filter="url(#sh${i})"><circle cx="200" cy="200" r="140" fill="url(#a${i})"/>
    <path d="M118 120c40 10 50 40 30 60s0 50 30 50 20 40 0 70M250 80c-20 30 10 50 40 40s50 30 40 60" stroke="#ffffff" stroke-opacity=".55" stroke-width="18" fill="none" stroke-linecap="round"/>
    <path d="M90 140c50 22 172 22 220 0M80 230c55 26 185 26 240 0" stroke="#ffffff" stroke-opacity=".3" stroke-width="8" fill="none"/></g>`,
};
export const ICON_NAMES = Object.keys(ICONS);
let n = 0;
export function icon(name, accent) { const f = ICONS[name] || ICONS.target; const i = 'i' + (n++); return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${defs(i, accent)}${f(accent, i)}</svg>`; }
