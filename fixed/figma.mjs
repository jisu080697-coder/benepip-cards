// 피그마에서 받은 틀(fixed/figma/<이름>/bg.png + raw.json) 위에 글자를 얹는 HTML
// 칸 글자는 vals[칸id] (없으면 피그마 원래 글자) · “ ”로 감싼 부분은 피그마 강조 글자 모양
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FIG = join(dirname(fileURLToPath(import.meta.url)), 'figma');
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
  return bx ? bx.x + bx.w - s.x - Math.max(16, s.x - bx.x) : 1080 - 96 - s.x;
};
export function figCard(name, vals) {
  const t = figOf(name), bg = pathToFileURL(join(FIG, name, 'bg.png')).href;
  const one = s => {
    const { base, hi } = styleOf(s), v = vals && vals[s.id] != null ? String(vals[s.id]) : null;
    const body = v == null
      ? s.segs.map(g => `<span style="${css(g)}">${esc(g.t).replace(/\n/g, '<br>')}</span>`).join('')
      : esc(v).replace(/“([^”]*)”/g, (m, x) => `<span style="${css(hi || base)}">${x}</span>`).replace(/\n/g, '<br>');
    const nw = s.autoResize === 'WIDTH_AND_HEIGHT', va = s.valign === 'CENTER' ? 'center' : s.valign === 'BOTTOM' ? 'flex-end' : 'flex-start';
    const al = s.align === 'CENTER' ? 'center' : s.align === 'RIGHT' ? 'right' : s.align === 'JUSTIFIED' ? 'justify' : 'left';
    // 글자 칸 너비가 자동이면 왼쪽(가운데·오른쪽 정렬이면 그 기준) 고정, 길어지면 그쪽으로 늘어남
    const ax = nw && al === 'right' ? `left:${s.x + s.w}px;transform:translateX(-100%) rotate(${-s.rot}deg);transform-origin:100% 0` : nw && al === 'center' ? `left:${s.x + s.w / 2}px;transform:translateX(-50%) rotate(${-s.rot}deg);transform-origin:50% 0` : `left:${s.x}px;transform:rotate(${-s.rot}deg);transform-origin:0 0`;
    return `<div class="ft" data-id="${s.id}" data-nw="${nw ? 1 : 0}" style="${ax};top:${s.y}px;${nw ? 'white-space:pre' : `width:${s.w}px;white-space:pre-wrap`};min-height:${s.h}px;display:flex;flex-direction:column;justify-content:${va};text-align:${al};opacity:${s.opacity};${s.blur ? `filter:blur(${s.blur / 2}px);` : ''}${css(base)}"><div>${body}</div></div>`;
  };
  const shp = (t.shapes || []).map((g, k) => (g.erase ? `<div style="position:absolute;left:${g.x - 2}px;top:${g.y - 2}px;width:${g.w + 4}px;height:${g.h + 4}px;background:${g.erase}"></div>` : '') + `<div class="fsh" data-k="${k}" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px;border-radius:${g.rad}px;background:${g.fill}"></div>`).join('');
  return `<script>window.__SHAPES=${JSON.stringify(t.shapes || [])};window.__SLOTS=${JSON.stringify(t.slots.map(x => ({ id: x.id, x: x.x, w: x.w, h: x.h, rot: x.rot, aw: availW(t, x) })))}</script><style>.fsh{position:absolute}</style>` + `<style>.fx{position:relative;width:1080px;height:1350px;overflow:hidden;background:url(${bg}) 0 0/1080px 1350px no-repeat}.ft{position:absolute;word-break:keep-all}.ft span{font-family:inherit}</style><div class="fx">${shp}${t.slots.map(one).join('')}</div>`;
}

// 페이지 안에서: 알약은 바뀐 글자 너비에 맞춤 · 막대는 값 크기에 비례 (가장 긴 막대 = 피그마의 가장 긴 막대 길이)
export const figFit = () => {
  // 피그마 칸보다 많이 길어진 글은 그 칸만 줄여 겹치지 않게 (최소 80%) · 줄인 칸은 품질 검사가 글을 줄이게 알림
  const shrunk = [];
  (window.__SLOTS || []).forEach(sl => {
    const box = document.querySelector(`.ft[data-id="${sl.id}"]`); if (!box || Math.abs(sl.rot) > 0.5 || (window.__SHAPES || []).some(g => g.kind === 'pill' && g.slot === sl.id)) return;   // 태그(알약)는 바탕이 글자에 맞춰 늘어남
    const nw = box.dataset.nw === '1', fs0 = parseFloat(getComputedStyle(box).fontSize), maxW = nw ? Math.max(sl.w, Math.min(sl.aw, 1080 - 60 - sl.x)) : sl.w, maxH = sl.h * 1.08 + 4;
    const over = () => { const r = box.getBoundingClientRect(); return (nw && r.width > maxW) || (!nw && r.height > maxH); };
    if (!over()) return;
    let z = 1; const kids = [...box.querySelectorAll('*')].concat([box]).map(e => [e, parseFloat(getComputedStyle(e).fontSize), parseFloat(getComputedStyle(e).lineHeight)]);
    while (over() && z > 0.8) { z -= 0.04; kids.forEach(([e, f, l]) => { e.style.fontSize = (f * z) + 'px'; if (l) e.style.lineHeight = (l * z) + 'px'; }); }
    if (over() && nw) { box.style.whiteSpace = 'pre-wrap'; box.style.width = maxW + 'px'; }   // 그래도 길면 칸 너비 안에서 줄바꿈 (화면 밖으로 안 나가게)
    shrunk.push({ id: sl.id, z: +z.toFixed(2) });
  });
  window.__SHRUNK = shrunk;
  const S = window.__SHAPES || [], el = k => document.querySelector(`.fsh[data-k="${k}"]`), tx = id => document.querySelector(`.ft[data-id="${id}"] > div`);
  const num = id => { const e = tx(id); const m = e && e.textContent.replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Math.abs(parseFloat(m[0])) : null; };
  S.forEach((g, k) => { if (g.kind !== 'pill') return; const e = tx(g.slot), b = el(k); if (!e || !b) return; if (!e.textContent.trim()) { b.style.display = 'none'; return; } const r = e.getBoundingClientRect(); b.style.left = (r.left - g.padL) + 'px'; b.style.width = (r.width + g.padL + g.padR) + 'px'; });
  // 같은 줄 알약은 원래 간격 그대로 이어 붙임 (앞 알약이 줄면 뒤 알약도 당겨짐)
  const pills = S.map((g, k) => Object.assign({ k }, g)).filter(g => g.kind === 'pill' && el(g.k).style.display !== 'none').sort((a, b) => a.y - b.y || a.x - b.x);
  for (let i = 1; i < pills.length; i++) { const a = pills[i - 1], b = pills[i]; if (Math.abs(a.y - b.y) > 4) continue; const gap = b.x - (a.x + a.w), ea = el(a.k), eb = el(b.k), dx = parseFloat(ea.style.left) + parseFloat(ea.style.width) + gap - parseFloat(eb.style.left); eb.style.left = (parseFloat(eb.style.left) + dx) + 'px'; const t = document.querySelector(`.ft[data-id="${b.slot}"]`); t.style.left = (parseFloat(t.style.left) + dx) + 'px'; }
  const bars = S.map((g, k) => Object.assign({ k }, g)).filter(g => g.kind === 'bar');
  if (bars.length) { const W = Math.max(...bars.map(g => g.w)), mx = Math.max(...bars.map(g => num(g.slot) || 0)); bars.forEach(g => { const v = num(g.slot), b = el(g.k); if (!b) return; if (v == null || !mx) { b.style.display = 'none'; return; } b.style.width = Math.max(g.h, W * v / mx) + 'px'; }); }
};
