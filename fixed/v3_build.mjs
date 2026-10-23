// 틀 v3 만들기 (피그마 없이): 시안 예시 글(samples/v3)을 카드 코드 + v3.css 로 그린 뒤
// 피그마 "틀 내보내기"와 같은 모양으로 저장 → fixed/figma/<이름>/ (bg.png 글자 뺀 배경 · full.png 미리보기 · raw.json 칸·도형)
// 칸 번호는 지금 틀(raw.json)과 글자로 맞춰 그대로 유지 (FigTpl.gs 칸 역할이 그대로 맞게)
// 사용: node fixed/v3_build.mjs [--dry]   (--dry: fixed/v3_out/ 에만 저장)
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), tpl = join(root, 'templates');
const DRY = process.argv.includes('--dry'), OUT = join(here, DRY ? 'v3_out' : 'figma');
await import('../templates/cards.bundle.js');
const BP = globalThis.BPCards, V3 = process.env.V3_PLAIN ? '' : readFileSync(join(here, 'v3.css'), 'utf8');   // V3_PLAIN: 지금 카드 코드 그대로 (시안 v2 모양)
const ONLY = (process.env.V3_ONLY || '').split(',').filter(Boolean);   // 이 틀만 다시 만들기
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const SETS = [['pay', '거래비용·페이백'], ['benefit', '혜택·적용 조건'], ['guide', '브로커 이용 가이드'], ['bene', '베네핍 이용 안내'], ['platform', '플랫폼 활용'], ['cal', '경제 캘린더']];

// 화면 안에서: 배치 변형 끄기 → 크기 맞춤 → 아래까지 채우기
const prep = () => {
  const k = document.querySelector('.k');
  if (k.classList.contains('P')) { k.className = k.className.replace(/\bcmp-(center|right|bottom|ev2)\b/g, ''); BPCards.fit(k); BPCards.arrowFit(k); }
  if (!k.classList.contains('P')) return;
  const box = k.getBoundingClientRect(), lim = 1350 - (k.classList.contains('has-risk') ? 215 : 150);
  const kids = [...k.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.tagName !== 'H2' && e.tagName !== 'IMG' && !/^(logo|head|pg|src|risk|desc)$/.test(String(e.className).split(' ')[0]));
  if (!kids.length) return;
  const bottom = () => Math.max(...[...k.children].filter(e => getComputedStyle(e).position !== 'absolute').map(e => e.getBoundingClientRect().bottom - box.top));
  const main = kids.slice().sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0];
  let rows = [...main.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height > 20);
  if (rows.length < 2) rows = [main];
  // 나란한 칸(왼쪽·오른쪽 열)이면 열 안의 줄들을 늘림
  if (rows.length > 1 && new Set(rows.map(e => Math.round(e.getBoundingClientRect().top))).size === 1) { const inner = rows.flatMap(r => [...r.children].filter(e => getComputedStyle(e).position !== 'absolute' && e.getBoundingClientRect().height > 20)); if (inner.length > rows.length) rows = inner; }
  const tops = new Set(rows.map(e => Math.round(e.getBoundingClientRect().top))).size || 1, free = lim - bottom();
  if (free < 30) return;
  const per = Math.min(free * 0.9 / tops, rows.length > 1 ? 64 : 160);
  rows.forEach(e => { const cs = getComputedStyle(e); e.style.paddingTop = (parseFloat(cs.paddingTop) + per / 2) + 'px'; e.style.paddingBottom = (parseFloat(cs.paddingBottom) + per / 2) + 'px'; });
  if (bottom() > lim + 4) rows.forEach(e => { e.style.paddingTop = e.style.paddingBottom = ''; });
};

// 화면 안에서: 글자 칸·사각형·움직이는 도형(알약·막대) 찾기 (피그마 플러그인과 같은 기준)
const extract = () => {
  const k = document.querySelector('.k'), K = k.getBoundingClientRect();
  const INLINE = /^(inline|inline-block|contents)$/;
  const rgba = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); const a = v.length > 3 ? v[3] : 1; return a < 0.02 ? null : `rgba(${v[0]},${v[1]},${v[2]},${+a.toFixed(3)})`; };
  const opOf = e => { let o = 1; for (let p = e; p && p !== document.body; p = p.parentElement) o *= +getComputedStyle(p).opacity; return +o.toFixed(3); };
  // 기울어진 묶음: 가장 가까운 회전 조상 (각도·중심)
  const rotOf = e => { for (let p = e; p && p !== k; p = p.parentElement) { const m = getComputedStyle(p).transform.match(/matrix\(([^,]+), ([^,]+)/); if (m && Math.abs(+m[2]) > 0.005) return { el: p, deg: Math.atan2(+m[2], +m[1]) * 180 / Math.PI }; } return null; };
  const unrot = (r, cb) => { if (!r) return cb(); const t = r.el.style.transform; r.el.style.transform = 'none'; try { return cb(); } finally { r.el.style.transform = t; } };
  const place = (r, x, y) => { if (!r) return [x, y]; const g = unrot(r, () => r.el.getBoundingClientRect()), cx = g.left - K.left + g.width / 2, cy = g.top - K.top + g.height / 2, a = r.deg * Math.PI / 180; return [cx + Math.cos(a) * (x - cx) - Math.sin(a) * (y - cy), cy + Math.sin(a) * (x - cx) + Math.cos(a) * (y - cy)]; };
  // 그라데이션 글자(배경을 글자 모양으로 자름)는 그라데이션 첫 색으로
  const gradColor = e => { for (let p = e; p && p !== k; p = p.parentElement) { const cs = getComputedStyle(p); if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip)) { const m = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (m) return rgba(m[0]); } } return null; };
  const slots = [], rects = [], dynInline = [];
  const segsOf = el => {
    const out = [];
    const walk = n => { for (const c of n.childNodes) {
      if (c.nodeType === 3) { const t = c.textContent.replace(/\s+/g, ' '); if (!t.trim() && !out.length) continue; const cs = getComputedStyle(c.parentElement), sz = parseFloat(cs.fontSize); out.push({ t: cs.textTransform === 'uppercase' ? t.toUpperCase() : t, size: +sz.toFixed(1), weight: +cs.fontWeight, color: rgba(cs.color) || gradColor(c.parentElement) || 'rgba(19,33,59,1)', lh: cs.lineHeight === 'normal' ? +(sz * 1.193).toFixed(1) : +parseFloat(cs.lineHeight).toFixed(1), ls: cs.letterSpacing === 'normal' ? 0 : +parseFloat(cs.letterSpacing).toFixed(2) }); }
      else if (c.nodeType === 1) { if (c.tagName === 'BR') { out.push({ t: '\n' }); continue; } const cs = getComputedStyle(c); if (cs.display !== 'none' && INLINE.test(cs.display) && !c.querySelector('svg,img')) walk(c); }
    } };
    walk(el);
    // 줄바꿈 조각은 앞 조각에 붙임 · 앞뒤 공백 정리
    const m = []; out.forEach(s => { if (s.t === '\n') { if (m.length) m[m.length - 1].t += '\n'; } else m.push(s); });
    if (m.length) { m[0].t = m[0].t.replace(/^\s+/, ''); m[m.length - 1].t = m[m.length - 1].t.replace(/\s+$/, ''); }
    return m.filter(s => s.t.length);
  };
  const visit = el => {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
    const rot = rotOf(el), bg = rgba(cs.backgroundColor);
    if (bg && el !== k && INLINE.test(cs.display) && el.closest('h1,h2')) dynInline.push(el);   // 제목 형광펜 → 배경에서 뺌
    else if (bg && el !== k) unrot(rot, () => { const r = el.getBoundingClientRect(); if (r.width > 2 && r.height > 2) { const [x, y] = place(rot, r.left - K.left, r.top - K.top); rects.push({ el, x: +x.toFixed(1), y: +y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), fill: bg, rad: parseFloat(cs.borderTopLeftRadius) || 0, rot: rot ? rot.deg : 0 }); } });
    const own = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
    if (own) {
      const segs = segsOf(el);
      if (segs.length) unrot(rot, () => {
        // 글자 영역 = 직접 글자 + 인라인 자식만 (같은 줄의 블록 자식 = 이름표 등은 따로 칸)
        const own = [...el.childNodes].filter(c => c.nodeType === 3 ? c.textContent.trim() : c.nodeType === 1 && (c.tagName === 'BR' || INLINE.test(getComputedStyle(c).display)));
        let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
        own.forEach(c => { const g = document.createRange(); if (c.nodeType === 3) g.selectNode(c); else g.selectNodeContents(c); for (const q of g.getClientRects()) { if (!q.width) continue; L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); } });
        const mixed = [...el.children].some(c => c.tagName !== 'BR' && !INLINE.test(getComputedStyle(c).display));
        const er = el.getBoundingClientRect(), pl = parseFloat(cs.paddingLeft), pr = parseFloat(cs.paddingRight), bl = parseFloat(cs.borderLeftWidth), br = parseFloat(cs.borderRightWidth);
        const nowrap = mixed || cs.whiteSpace === 'nowrap' || cs.whiteSpace === 'pre' || (B - T) < parseFloat(cs.fontSize) * 1.9;
        const al = /center/.test(cs.textAlign) ? 'CENTER' : /right|end/.test(cs.textAlign) ? 'RIGHT' : 'LEFT';
        const x0 = nowrap ? L - K.left : er.left - K.left + pl + bl, w = nowrap ? R - L + 2 : er.width - pl - pr - bl - br;
        const [x, y] = place(rot, x0, T - K.top);
        slots.push({ layer: segs.map(s => s.t).join('').slice(0, 20), text: segs.map(s => s.t).join(''), x: +x.toFixed(1), y: +y.toFixed(1), w: +w.toFixed(1), h: +(B - T).toFixed(1), rot: rot ? -rot.deg : 0, align: nowrap ? 'LEFT' : al, valign: 'TOP', autoResize: nowrap ? 'WIDTH_AND_HEIGHT' : 'HEIGHT', opacity: opOf(el), blur: +((cs.filter.match(/blur\(([\d.]+)px\)/) || [])[1] || 0) * 2, segs });
      });
      [...el.children].forEach(c => { if (!INLINE.test(getComputedStyle(c).display)) visit(c); });
      return;
    }
    [...el.children].forEach(visit);
  };
  [...k.children].forEach(visit);
  slots.forEach((s, i) => { s.id = 't' + (i + 1); });
  // 알약(글자를 꼭 감싼 바탕) · 막대(숫자 글자 바로 왼쪽에서 끝나는 가는 사각형, 같은 열 2개 이상)
  const shapes = [], dyn = new Set();
  slots.forEach(s => {
    if (Math.abs(s.rot) > 0.5) return;
    const t = { x: s.x, y: s.y, r: s.x + s.w, b: s.y + s.h, cy: s.y + s.h / 2 };
    const pill = s.autoResize === 'WIDTH_AND_HEIGHT' && rects.filter(r => !r.rot && r.x <= t.x + 1 && r.x + r.w >= t.r - 1 && r.y <= t.y + 1 && r.y + r.h >= t.b - 1 && t.x - r.x <= 48 && r.x + r.w - t.r <= 48 && r.h <= s.h * 2.4).sort((a, b) => a.w - b.w)[0];
    if (pill) { shapes.push({ kind: 'pill', slot: s.id, x: pill.x, y: pill.y, w: pill.w, h: pill.h, rad: pill.rad, fill: pill.fill, padL: +(t.x - pill.x).toFixed(1), padR: +(pill.x + pill.w - t.r).toFixed(1) }); dyn.add(pill.el); }
  });
  const bars = rects.filter(r => !r.rot && r.h >= 6 && r.h <= 90 && r.w >= 12 && !dyn.has(r.el) && r.el.tagName === 'S');
  bars.forEach(r => {
    const cy = r.y + r.h / 2, num = slots.filter(s => /\d/.test(s.text) && Math.abs(s.y + s.h / 2 - cy) <= 30 && s.x >= r.x + r.w - 4).sort((a, b) => a.x - b.x)[0];
    if (num) { shapes.push({ kind: 'bar', slot: num.id, x: r.x, y: r.y, w: r.w, h: r.h, rad: r.rad, fill: r.fill }); dyn.add(r.el); }
  });
  window.__DYN = [...dyn, ...dynInline];
  return { slots, shapes, rects: rects.map(({ el, ...r }) => r) };
};

const norm = s => String(s || '').replace(/[\s“”]/g, '');
const b = await chromium.launch(process.env.PW_EXEC ? { executablePath: process.env.PW_EXEC } : process.env.CI ? {} : { channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
const report = [];
for (const [id, name] of SETS) {
  const d = JSON.parse(readFileSync(join(root, 'samples', 'v3', id + '.json'), 'utf8'));
  for (let i = 0; i < d.cards.length; i++) {
    const nm = `${name} ${i + 1}`, f = join(tpl, `_v3b_${i}.html`);
    if (ONLY.length && !ONLY.includes(nm)) continue;
    writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tpl).href}/"><link rel="stylesheet" href="${FONT}"><style>${BP.css}\n${V3}</style><script src="cards.bundle.js"></script></head><body style="margin:0">${BP.card(d, i)}</body></html>`);
    await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(prep);
    const t = await p.evaluate(extract);
    // 칸 번호: 지금 틀과 글자로 맞춤
    const old = existsSync(join(here, 'figma', nm, 'raw.json')) ? JSON.parse(readFileSync(join(here, 'figma', nm, 'raw.json'), 'utf8')).slots : [];
    const used = new Set(), miss = [];
    t.slots.forEach(s => { const o = old.find(o => !used.has(o.id) && norm(o.text) === norm(s.text)); if (o) { used.add(o.id); s.id = 'n' + o.id; } else s.id = null; });
    let next = Math.max(0, ...old.map(o => +o.id.slice(1))) + 1;
    const ren = {}; t.slots.forEach(s => { const nid = s.id ? s.id.slice(1) : 't' + (next++); if (!s.id) miss.push(nid + ':' + s.text.slice(0, 12)); ren[s.__old || ''] = nid; s.id = nid; });
    // 도형이 가리키는 칸 번호도 바꿈 (추출 순서 → 맞춘 번호)
    const order = await p.evaluate(() => 0);
    t.shapes.forEach(g => { const k = +g.slot.slice(1) - 1; g.slot = t.slots[k] ? t.slots[k].id : g.slot; });
    const lost = old.filter(o => !used.has(o.id)).map(o => o.id + ':' + o.text.slice(0, 12));
    report.push(nm + (miss.length ? ' · 새 칸 ' + miss.join(', ') : '') + (lost.length ? ' · 사라진 칸 ' + lost.join(', ') : ''));
    const dir = join(OUT, nm); mkdirSync(dir, { recursive: true });
    await p.screenshot({ path: join(dir, 'full.png'), clip: { x: 0, y: 0, width: 1080, height: 1350 }, scale: 'css' });
    await p.evaluate(() => {
      const st = document.createElement('style'); st.textContent = '.k, .k * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }'; document.head.appendChild(st);
      (window.__DYN || []).forEach(e => { e.style.background = 'transparent'; e.style.boxShadow = 'none'; e.style.border = '0'; });
      document.querySelectorAll('.k *').forEach(e => { const cs = getComputedStyle(e); if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip)) e.style.backgroundImage = 'none';
        // 글줄 안 형광펜·밑줄 바탕(예시 글 길이에 맞춰진 것)은 배경에서 뺌
        else if (cs.display === 'inline' && (cs.backgroundImage !== 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || cs.boxShadow !== 'none')) { e.style.background = 'none'; e.style.boxShadow = 'none'; } });
    });
    await p.screenshot({ path: join(dir, 'bg.png'), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    writeFileSync(join(dir, 'raw.json'), JSON.stringify({ name: nm, w: 1080, h: 1350, slots: t.slots, shapes: t.shapes, rects: t.rects, src: 'v3' }, null, 1));
    rmSync(f);
  }
}
await b.close();
console.log(report.join('\n'));
