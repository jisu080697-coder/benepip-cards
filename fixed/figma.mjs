// 피그마에서 받은 틀(fixed/figma/<이름>/bg.png + raw.json) 위에 글자를 얹는 HTML
// 칸 글자는 vals[칸id] (없으면 피그마 원래 글자) · “ ”로 감싼 부분은 피그마 강조 글자 모양
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FIG = process.env.FIG_DIR || join(dirname(fileURLToPath(import.meta.url)), 'figma');
export const hasFig = name => existsSync(join(FIG, String(name || ''), 'raw.json'));
export const figOf = name => JSON.parse(readFileSync(join(FIG, name, 'raw.json'), 'utf8'));
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = g => `font-size:${g.size}px;font-weight:${g.weight};color:${g.color};line-height:${g.lh}px;letter-spacing:${g.ls}px`;

// 칸의 기본 모양(첫 조각)과 강조 모양(기본과 색이나 굵기가 다른 조각)
export const styleOf = s => {
  // 기본 모양은 첫 조각 (제목 첫 줄은 기본색, 강조는 그 뒤에 옴)
  const base = s.segs.find(g => g.t.trim()) || s.segs[0], hi = s.segs.find(g => g.color !== base.color || g.weight !== base.weight) || null;
  return { base, hi };
};
// 피그마 원래 글자를 “강조” 표시가 있는 글로 (틀의 예시 글)
export const sampleOf = s => { const { base } = styleOf(s); return s.segs.map(g => g.color !== base.color || g.weight !== base.weight ? '“' + g.t + '”' : g.t).join('').replace(/“\n/g, '\n“').replace(/\n”/g, '”\n'); };

// 글자 칸이 들어 있는 가장 작은 상자 안에서 쓸 수 있는 너비 (상자 왼쪽 여백만큼 오른쪽도 비움) · 상자가 없으면 화면 오른쪽 여백까지
const availW = (t, s) => {
  const bx = (t.rects || []).filter(r => r.fill && r.x <= s.x + 1 && r.y <= s.y + 1 && r.x + r.w >= s.x + s.w - 1 && r.y + r.h >= s.y + s.h - 1 && r.w < 1000).sort((a, b) => a.w * a.h - b.w * b.h)[0];
  let w = bx ? bx.x + bx.w - s.x - Math.min(48, Math.max(16, s.x - bx.x)) : 1080 - 96 - s.x;   // 상자 오른쪽 여백 = 왼쪽 여백 (최대 48)
  // 같은 줄 오른쪽 글·도형 앞까지 (표 칸·빈칸 상자)
  const row = o => o.y < s.y + s.h && o.y + o.h > s.y && o.x > s.x + 4;
  const nx = t.slots.filter(o => o !== s && row(o)).map(o => o.x).concat((t.rects || []).filter(r => row(r) && r.x > s.x + 20 && r.w < 600).map(r => r.x));
  if (s.align !== 'RIGHT' && nx.length) w = Math.min(w, Math.min(...nx) - s.x - 16);
  // 가운데 정렬 칸: 가운데를 기준으로 양쪽으로 늘어남 → 상자(없으면 화면 여백 96)까지의 가까운 쪽 × 2
  if (s.align === 'CENTER') { const cx = s.x + s.w / 2, L = bx ? bx.x + 16 : 96, R = bx ? bx.x + bx.w - 16 : 1080 - 96; w = 2 * Math.min(cx - L, R - cx); }
  return Math.max(w, s.w);
};
// 오른쪽에 붙은 값 칸 (상자 오른쪽 끝·화면 오른쪽 여백에 닿은 너비 자동 칸): 오른쪽 끝을 고정하고 왼쪽으로 늘어남
const boxOf = (t, s) => (t.rects || []).filter(r => r.fill && r.x <= s.x + 1 && r.y <= s.y + 1 && r.x + r.w >= s.x + s.w - 1 && r.y + r.h >= s.y + s.h - 1 && r.w < 1000).sort((a, b) => a.w * a.h - b.w * b.h)[0];
export const rightOf = (t, s) => {
  if (s.autoResize !== 'WIDTH_AND_HEIGHT' || /^\d+ \/ \d+$/.test(s.text) || (t.shapes || []).some(g => g.kind === 'pill' && g.slot === s.id)) return false;
  if (s.align === 'RIGHT' || s.x + s.w > 1080 - 96 - 60) return true;
  const bx = boxOf(t, s); return !!bx && bx.x + bx.w - (s.x + s.w) < 70 && s.x - bx.x > bx.w * 0.4;
};
// 따라붙는 칸: 큰 글(숫자) 바로 오른쪽에 붙은 작은 글(단위) → 숫자 길이가 바뀌면 단위도 따라 움직임 · 둘이 가운데 묶음이면 묶음째 가운데 유지
export const followers = t => {
  const out = {};
  t.slots.forEach(s => {
    if (s.autoResize !== 'WIDTH_AND_HEIGHT' || Math.abs(s.rot) > 0.5) return;
    const L = t.slots.find(o => o !== s && o.autoResize === 'WIDTH_AND_HEIGHT' && Math.abs(o.rot) < 0.5 && o.h > s.h * 1.5 && Math.abs(o.x + o.w - s.x) <= 40 && s.y + s.h / 2 > o.y && s.y + s.h / 2 < o.y + o.h);
    if (!L) return;
    const cx = (L.x + s.x + s.w) / 2;
    out[s.id] = { lead: L.id, gap: +(s.x - (L.x + L.w)).toFixed(1), center: Math.abs(cx - 540) < 60 ? cx : null };
  });
  return out;
};
// 오른쪽 고정 칸이 왼쪽으로 쓸 수 있는 너비 (같은 줄 왼쪽 글 끝 또는 상자 왼쪽 여백까지)
const availL = (t, s) => {
  const bx = boxOf(t, s), right = s.x + s.w;
  let left = bx ? bx.x + Math.min(48, Math.max(16, bx.x + bx.w - right)) : 96;
  t.slots.forEach(o => { if (o !== s && o.y < s.y + s.h && o.y + o.h > s.y && o.x + o.w < s.x + 4) left = Math.max(left, o.x + o.w + 24); });
  // 같은 줄 왼쪽 도형(막대·빈칸 상자 등) 끝까지
  (t.rects || []).forEach(r => { if (r.y < s.y + s.h && r.y + r.h > s.y && r.x + r.w < s.x + 4 && r.x > (bx ? bx.x : 0) + 1) left = Math.max(left, r.x + r.w + 16); });
  // 막대는 값에 따라 가장 긴 막대 길이까지 늘어날 수 있음
  const bw = Math.max(0, ...(t.shapes || []).filter(g => g.kind === 'bar').map(g => g.w));
  (t.shapes || []).forEach(g => { if (g.kind === 'bar' && g.y < s.y + s.h && g.y + g.h > s.y && g.x < s.x) left = Math.max(left, g.x + bw + 16); });
  return Math.max(right - left, s.w);
};
export function figCard(name, vals) {
  const t = figOf(name), bg = pathToFileURL(join(FIG, name, 'bg.png')).href;
  const one = s => {
    const { base, hi } = styleOf(s), v = vals && vals[s.id] != null ? String(vals[s.id]) : null;
    const body = v == null
      ? s.segs.map(g => `<span style="${css(g)}">${esc(g.t).replace(/\n/g, '<br>')}</span>`).join('')
      : esc(v).replace(/“([^”]*)”/g, (m, x) => `<span style="${css(hi || base)}">${x}</span>`).replace(/\n/g, '<br>');
    const nw = s.autoResize === 'WIDTH_AND_HEIGHT' || /^\d+ \/ \d+$/.test(s.text), va = s.valign === 'CENTER' ? 'center' : s.valign === 'BOTTOM' ? 'flex-end' : 'flex-start';
    const al = s.align === 'CENTER' ? 'center' : s.align === 'RIGHT' ? 'right' : s.align === 'JUSTIFIED' ? 'justify' : 'left';
    // 글자 칸 너비가 자동이면 왼쪽(가운데·오른쪽 정렬이면 그 기준) 고정, 길어지면 그쪽으로 늘어남
    const ra = rightOf(t, s), th = -s.rot * Math.PI / 180;
    const ax = ra ? `left:${s.x + s.w * Math.cos(th)}px;top:${s.y + s.w * Math.sin(th)}px;transform:rotate(${-s.rot}deg) translateX(-100%);transform-origin:0 0` : nw && al === 'right' ? `left:${s.x + s.w}px;transform:translateX(-100%) rotate(${-s.rot}deg);transform-origin:100% 0` : nw && al === 'center' ? `left:${s.x + s.w / 2}px;transform:translateX(-50%) rotate(${-s.rot}deg);transform-origin:50% 0` : `left:${s.x}px;transform:rotate(${-s.rot}deg);transform-origin:0 0`;
    return `<div class="ft" data-id="${s.id}" data-nw="${nw ? 1 : 0}" data-ra="${ra ? 1 : 0}" style="${ra ? ax : ax + ';top:' + s.y + 'px'};${nw ? 'white-space:pre' : `width:${s.w}px;white-space:pre-wrap`};min-height:${s.h}px;display:flex;flex-direction:column;justify-content:${va};text-align:${al};opacity:${s.opacity};${s.blur ? `filter:blur(${s.blur / 2}px);` : ''}${css(base)}"><div>${body}</div></div>`;
  };
  const shp = (t.shapes || []).map((g, k) => (g.erase ? `<div style="position:absolute;left:${g.x - 2}px;top:${g.y - 2}px;width:${g.w + 4}px;height:${g.h + 4}px;background:${g.erase}"></div>` : '') + `<div class="fsh" data-k="${k}" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:${g.rad}px;background:${g.fill}"></div>`).join('');
  return `<script>window.__SHAPES=${JSON.stringify(t.shapes || [])};window.__SLOTS=${JSON.stringify(t.slots.map(x => ({ id: x.id, x: x.x, w: x.w, h: x.h, rot: x.rot, aw: rightOf(t, x) ? availL(t, x) : availW(t, x), ra: rightOf(t, x), y: x.y, fol: followers(t)[x.id] || null })))}</script><style>.fsh{position:absolute}</style>` + `<style>.fx{position:relative;width:1080px;height:1350px;overflow:hidden;background:url(${bg}) 0 0/1080px 1350px no-repeat}.ft{position:absolute;word-break:keep-all}.ft span{font-family:inherit}</style><div class="fx">${shp}${t.slots.map(one).join('')}</div>`;
}

// 페이지 안에서: 칸마다 실제로 그린 결과를 잼 · 넘친 칸(너비·줄 수가 시안 칸을 넘음)을 돌려줌
// 너비 자동 칸: 쓸 수 있는 너비(상자·옆 칸·화면 여백까지) · 너비가 정해진 칸: 시안의 높이(줄 수)까지 · 태그·쪽 번호는 제외
export const figMeasure = () => {
  const S = window.__SHAPES || [], out = [];
  (window.__SLOTS || []).forEach(sl => {
    const box = document.querySelector(`.ft[data-id="${sl.id}"]`); if (!box) return;
    const txt = box.textContent; if (!txt.trim() || /^\s*\d+\s*\/\s*\d+\s*$/.test(txt)) return;
    const pill = S.some(g => g.kind === 'pill' && g.slot === sl.id), nw = box.dataset.nw === '1', inner = box.firstElementChild;
    const cs = getComputedStyle(box), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2, lines = Math.max(1, Math.round(inner.offsetHeight / lh)), maxL = Math.max(1, Math.round(sl.h / lh));
    let why = '';
    if (nw && !pill && inner.offsetWidth > sl.aw + 2) why = '너비 ' + Math.round(inner.offsetWidth) + '/' + Math.round(sl.aw) + 'px';
    else if (lines > maxL) why = lines + '줄 → ' + maxL + '줄까지';
    out.push({ id: sl.id, lines, over: !!why, why });
  });
  const SL = window.__SLOTS || [], R = id => { const e = document.querySelector(`.ft[data-id="${id}"] > div`); return e && e.textContent.trim() ? e.getBoundingClientRect() : null; };
  SL.forEach(a => SL.forEach(b => {
    if (a.id >= b.id || (a.fol && a.fol.lead === b.id) || (b.fol && b.fol.lead === a.id)) return;
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return;   // 시안에서도 겹치던 칸
    const p = R(a.id), q = R(b.id); if (!p || !q) return;
    const vy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top); if (vy < Math.min(p.height, q.height) * 0.5) return;
    if (p.left < q.right + 8 && q.left < p.right + 8) {
      const lab = a.ra ? b : b.ra ? a : (p.width > q.width ? a : b), o = out.find(x => x.id === lab.id);
      if (o && !o.over) { o.over = true; o.why = '옆 글과 겹침'; }
    }
  }));
  return out;
};

// 페이지 안에서: 알약은 바뀐 글자 너비에 맞춤 · 막대는 값 크기에 비례 (가장 긴 막대 = 피그마의 가장 긴 막대 길이)
export const figFit = () => {
  // 글씨 크기·위치는 절대 바꾸지 않음 (넘침은 figMeasure 가 재서 기록 → 글을 다시 씀)
  const S = window.__SHAPES || [], el = k => document.querySelector(`.fsh[data-k="${k}"]`), tx = id => document.querySelector(`.ft[data-id="${id}"] > div`);
  const num = id => { const e = tx(id); const m = e && e.textContent.replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Math.abs(parseFloat(m[0])) : null; };
  S.forEach((g, k) => { if (g.kind !== 'pill') return; const e = tx(g.slot), b = el(k); if (!e || !b) return; if (!e.textContent.trim()) { b.style.display = 'none'; return; } const r = e.getBoundingClientRect(), w = r.width + g.padL + g.padR;
    const alone = !S.some(o => o !== g && o.kind === 'pill' && Math.abs(o.y - g.y) < 4);
    if (alone && g.x + g.w / 2 > 540) {   // 그 줄에 혼자 있는 오른쪽 태그·말풍선: 오른쪽 끝을 고정하고 왼쪽으로 늘어남
      const left = g.x + g.w - w, t = document.querySelector(`.ft[data-id="${g.slot}"]`); t.style.left = (parseFloat(t.style.left) + (left + g.padL - r.left)) + 'px'; t.style.transform = 'none';
      b.style.left = left + 'px'; b.style.width = w + 'px'; g.right = 1; return;
    }
    b.style.left = (r.left - g.padL) + 'px'; b.style.width = w + 'px'; });
  // 같은 줄 알약은 원래 간격 그대로 이어 붙임 (앞 알약이 줄면 뒤 알약도 당겨짐)
  const pills = S.map((g, k) => Object.assign({ k }, g)).filter(g => g.kind === 'pill' && !g.right && el(g.k).style.display !== 'none').sort((a, b) => a.y - b.y || a.x - b.x);
  // 왼쪽 태그 묶음은 원래 간격으로 줄줄이 놓고, 오른쪽 여백을 넘으면 다음 줄로
  if (pills.length > 1) {
    const x0 = Math.min(...pills.map(g => g.x)), ys = [...new Set(pills.map(g => Math.round(g.y)))].sort((a, b) => a - b);
    const gap = pills.length > 1 && Math.abs(pills[1].y - pills[0].y) < 4 ? pills[1].x - (pills[0].x + pills[0].w) : 16, step = ys.length > 1 ? ys[1] - ys[0] : pills[0].h + 16;
    let x = x0, y = pills[0].y;
    pills.forEach(g => {
      const b = el(g.k), t = document.querySelector(`.ft[data-id="${g.slot}"]`), w = parseFloat(b.style.width);
      if (x > x0 && x + w > 1080 - 96) { x = x0; y += step; }
      const dx = x - parseFloat(b.style.left), dy = y - g.y;
      b.style.left = x + 'px'; b.style.top = y + 'px';
      t.style.left = (parseFloat(t.style.left) + dx) + 'px'; t.style.top = (parseFloat(t.style.top) + dy) + 'px';
      x += w + gap;
    });
  }
  (window.__SLOTS || []).forEach(sl => {
    if (!sl.fol) return;
    const L = document.querySelector(`.ft[data-id="${sl.fol.lead}"]`), U = document.querySelector(`.ft[data-id="${sl.id}"]`); if (!L || !U) return;
    const lw = L.firstElementChild.getBoundingClientRect().width, uw = U.firstElementChild.getBoundingClientRect().width;
    const lx = sl.fol.center != null ? sl.fol.center - (lw + sl.fol.gap + uw) / 2 : parseFloat(L.style.left);
    L.style.left = lx + 'px'; L.style.transform = 'none'; U.style.left = (lx + lw + sl.fol.gap) + 'px'; U.style.transform = 'none';
  });
  const bars = S.map((g, k) => Object.assign({ k }, g)).filter(g => g.kind === 'bar');
  if (bars.length) { const W = Math.max(...bars.map(g => g.w)), mx = Math.max(...bars.map(g => num(g.slot) || 0)); bars.forEach(g => { const v = num(g.slot), b = el(g.k); if (!b) return; if (v == null || !mx) { b.style.display = 'none'; return; } b.style.width = Math.max(g.h * 2, W * 0.12, W * v / mx) + 'px'; }); }
};
