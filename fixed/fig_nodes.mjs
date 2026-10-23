// 카드 DOM → 피그마 레이어용 JSON (렌더러와 같은 코드로 그린 뒤 위치·색·글자 추출) · 시안 맞추기 플러그인용
// 사용: node fixed/fig_nodes.mjs 출력.json "틀 이름" ...   (v3_build 의 V3_PLAIN 과 같은 모양: 배치 변형 끄기 + 아래까지 채우기)
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = join(dirname(fileURLToPath(import.meta.url)), '..'), tpl = join(here, 'templates');
await import('../templates/cards.bundle.js');
const BP = globalThis.BPCards;
const FONT = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const SETS = [['pay', '거래비용·페이백'], ['benefit', '혜택·적용 조건'], ['guide', '브로커 이용 가이드'], ['bene', '베네핍 이용 안내'], ['platform', '플랫폼 활용'], ['cal', '경제 캘린더']];
const b = await chromium.launch({ channel: 'msedge', headless: false, args: ['--headless=new'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
const all = [];
const ONLY = process.argv.slice(3);
const { prep } = await import('./v3_prep.mjs');
for (const [id, name] of SETS) {
  const d = JSON.parse(readFileSync(join(here, 'samples', 'v3', id + '.json'), 'utf8'));
  for (let i = 0; i < d.cards.length; i++) {
    if (ONLY.length && !ONLY.includes(`${name} ${i + 1}`)) continue;
    const f = join(tpl, `_fe_${i}.html`);
    writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><base href="${pathToFileURL(tpl).href}/"><link rel="stylesheet" href="${FONT}"><style>${BP.css}</style><script src="cards.bundle.js"></script></head><body>${BP.card(d, i)}</body></html>`);
    await p.goto(pathToFileURL(f).href, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(prep);
    const nodes = await p.evaluate(() => {
      const k = document.querySelector('.k');
      const K = k.getBoundingClientRect(), out0 = [], G = []; const out = { push: x => { if (G.length) x.g = G[G.length - 1]; out0.push(x); }, get length() { return out0.length; }, filter: f => out0.filter(f) };
      const R = r => [Math.round(r.left - K.left), Math.round(r.top - K.top), Math.round(r.width), Math.round(r.height)];
      const col = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); const a = v.length > 3 ? v[3] : 1; return a < 0.02 ? null : [+(v[0] / 255).toFixed(3), +(v[1] / 255).toFixed(3), +(v[2] / 255).toFixed(3), +a.toFixed(2)]; };
      const zoomOf = e => { let z = 1, q = e; while (q && q !== document.body) { z *= parseFloat(q.style && q.style.zoom || getComputedStyle(q).zoom || 1) || 1; q = q.parentElement; } return z; };
      const INLINE = /^(inline|inline-block|contents)$/;
      const grad = s => { const m = String(s).match(/linear-gradient\((.*)\)/); if (!m) return null; const cs = [...m[1].matchAll(/rgba?\([^)]+\)/g)].map(x => col(x[0])).filter(Boolean); const ang = (m[1].match(/(-?[\d.]+)deg/) || [0, 180])[1]; return cs.length >= 2 ? { a: +ang, c: cs } : null; };
      const shadow = s => { if (!s || s === 'none') return null; const c = col(s); const n = (s.replace(/rgba?\([^)]+\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat); return c ? { c, x: n[0] || 0, y: n[1] || 0, b: n[2] || 0, s: n[3] || 0 } : null; };
      const runsOf = (el, z0) => {
        const runs = [], lastTop = { v: null };
        const walk = (n) => {
          for (const c of n.childNodes) {
            if (c.nodeType === 3) {
              // 브라우저가 실제로 줄을 바꾼 자리를 그대로 \n 으로 (피그마에서 글자 단위로 끊기지 않게)
              const raw = c.textContent, rg = document.createRange(); let t = '';
              for (let j = 0; j < raw.length; j++) {
                const ch = raw[j];
                if (/\s/.test(ch)) { if (!/[ \n]$/.test(t) && !(t === '' && lastTop.v == null)) t += ' '; continue; }
                rg.setStart(c, j); rg.setEnd(c, j + 1); const q = rg.getClientRects()[0];
                if (q && lastTop.v != null && q.top > lastTop.v + q.height * 0.5) { t = t.replace(/ $/, ''); if (!t.endsWith('\n')) t += '\n'; }
                if (q) lastTop.v = q.top;
                t += ch;
              }
              if (!t.trim() && !runs.length) continue; const cs = getComputedStyle(c.parentElement); if (cs.textTransform === 'uppercase') t = t.toUpperCase(); const z = zoomOf(c.parentElement); runs.push({ t, c: col(cs.color) || col(cs.backgroundColor) || [0.08, 0.13, 0.23, 1], s: +(parseFloat(cs.fontSize) * z).toFixed(1), w: +cs.fontWeight }); }
            else if (c.nodeType === 1) { if (c.tagName === 'BR') { runs.push({ t: '\n' }); lastTop.v = null; continue; } const cs = getComputedStyle(c); if (cs.display === 'none') continue; if (INLINE.test(cs.display) || cs.display === 'block' && c.tagName === 'SPAN' && false) { walk(c); } }
          }
        };
        walk(el);
        while (runs.length && runs[runs.length - 1].t && !runs[runs.length - 1].t.trim()) runs.pop();
        if (runs.length) runs[0].t = runs[0].t.replace(/^\s+/, '');
        return runs.filter(r => r.t);
      };
      const visit = (el) => { const g0 = G.length; visit0(el); G.length = g0; };
      const visit0 = (el) => {
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
        let rotG = null;
        const tm = cs.transform.match(/matrix\(([^,]+), ([^,]+)/);
        if (tm && Math.abs(+tm[2]) > 0.005 && el.tagName.toLowerCase() !== 'svg') { const ang = Math.atan2(+tm[2], +tm[1]) * 180 / Math.PI; el.style.transform = 'none'; const r0 = el.getBoundingClientRect(); rotG = { k: 'grp', r: R(r0), rot: +ang.toFixed(2), id: 'g' + out.length }; out.push(rotG); G.push(rotG.id); }
        const r = el.getBoundingClientRect(); const z = zoomOf(el);
        const op = +cs.opacity < 1 ? +cs.opacity : undefined;
        if (el.tagName.toLowerCase() === 'svg') { const s = el.cloneNode(true); s.setAttribute('width', r.width); s.setAttribute('height', r.height); if (!s.getAttribute('xmlns')) s.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); out.push({ k: 'svg', r: R(r), svg: s.outerHTML, op }); return; }
        if (el.tagName === 'IMG') { out.push({ k: 'img', r: R(r), src: el.getAttribute('src'), op }); return; }
        if (!r.width || !r.height) return;
        const bg = col(cs.backgroundColor), gr = grad(cs.backgroundImage), clipText = /text/.test(cs.webkitBackgroundClip || cs.backgroundClip);
        const bw = ['Top', 'Right', 'Bottom', 'Left'].map(s => +(parseFloat(cs['border' + s + 'Width']) * z).toFixed(1)), bc = col(cs.borderTopColor) || col(cs.borderBottomColor) || col(cs.borderLeftColor);
        const rad = parseFloat(cs.borderTopLeftRadius) * z || 0, sh = shadow(cs.boxShadow);
        const isInline = INLINE.test(cs.display) && el !== k;
        if (!clipText && (bg || gr || (bc && bw.some(x => x > 0)) || sh)) {
          if (isInline && el.getClientRects().length > 1) for (const cr of el.getClientRects()) out.push({ k: 'box', r: R(cr), bg, rad });
          else out.push({ k: 'box', r: R(r), bg, gr, rad: Math.min(rad, r.height / 2, r.width / 2), bw: bw.some(x => x > 0) && bc ? bw : undefined, bc: bw.some(x => x > 0) ? bc : undefined, sh, op });
        }
        const hasText = [...el.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
        if (hasText) {
          const runs = runsOf(el);
          if (clipText && gr) runs.forEach(x => x.c = gr.c[0]);
          // 글자 영역 = 직접 글자 + 인라인 자식만 (블록 자식 = 같은 줄의 라벨 등은 따로)
          const own = [...el.childNodes].filter(c => c.nodeType === 3 ? c.textContent.trim() : c.nodeType === 1 && (c.tagName === 'BR' || INLINE.test(getComputedStyle(c).display)));
          const mixed = [...el.children].some(c => !INLINE.test(getComputedStyle(c).display) && c.tagName !== 'BR');
          let L = 1e9, T = 1e9, Rr = -1e9, B = -1e9;
          own.forEach(c => { const g = document.createRange(); g.selectNodeContents(c.nodeType === 3 ? c.parentNode : c); if (c.nodeType === 3) g.selectNode(c); for (const q of g.getClientRects()) { if (!q.width) continue; L = Math.min(L, q.left); T = Math.min(T, q.top); Rr = Math.max(Rr, q.right); B = Math.max(B, q.bottom); } });
          const tr = L < 1e9 ? { left: L, top: T, width: Rr - L, height: B - T } : (() => { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); })();
          const blur = (cs.filter.match(/blur\(([\d.]+)px\)/) || [])[1];
          const pl = parseFloat(cs.paddingLeft) * z, pr = parseFloat(cs.paddingRight) * z;
          const box = [Math.round(r.left - K.left + pl + parseFloat(cs.borderLeftWidth) * z), Math.round(tr.top - K.top), Math.round(r.width - pl - pr - (parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)) * z), Math.round(tr.height)];
          const lh = cs.lineHeight === 'normal' ? 0 : +(parseFloat(cs.lineHeight) * z).toFixed(1), ls = cs.letterSpacing === 'normal' ? 0 : +(parseFloat(cs.letterSpacing) * z).toFixed(2);
          const align = /center/.test(cs.textAlign) ? 'C' : /right|end/.test(cs.textAlign) ? 'R' : 'L';
          const nw = mixed || cs.whiteSpace === 'nowrap' || tr.height < parseFloat(cs.fontSize) * z * 1.9 && !/\n/.test(runs.map(x => x.t).join(''));
          if (runs.length) out.push({ k: 'text', r: nw ? [Math.round(tr.left - K.left), box[1], Math.round(tr.width) + 2, box[3]] : box, runs, lh, ls, al: nw ? 'L' : align, nw, op, blur: blur ? +blur * z : undefined });
          [...el.children].forEach(c => { const cs2 = getComputedStyle(c); if (!INLINE.test(cs2.display)) { visit(c); return; } c.querySelectorAll('svg,img').forEach(visit); if (col(cs2.backgroundColor)) for (const cr of c.getClientRects()) out.push({ k: 'box', r: R(cr), bg: col(cs2.backgroundColor), rad: parseFloat(cs2.borderTopLeftRadius) || 0, under: 1 }); });
          return;
        }
        for (const c of el.children) visit(c);
      };
      const kcs = getComputedStyle(k);
      const card = { bg: col(kcs.backgroundColor) || [1, 1, 1, 1], gr: grad(kcs.backgroundImage) };
      for (const c of k.children) visit(c);
      // 인라인 배경(형광펜)은 글자 아래로
      const under = out.filter(x => x.under), rest = out.filter(x => !x.under);
      const ti = rest.findIndex(x => x.k === 'text');
      card.nodes = ti < 0 ? rest.concat(under) : rest.slice(0, ti).concat(under, rest.slice(ti));
      return card;
    });
    nodes.name = `${name} ${i + 1}`; nodes.set = name; nodes.i = i;
    all.push(nodes); rmSync(f);
  }
}
await b.close();
writeFileSync(process.argv[2], JSON.stringify(all));
console.log(all.length, all.map(c => c.nodes.length).join(','));
