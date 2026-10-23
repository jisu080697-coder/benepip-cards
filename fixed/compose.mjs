// 고정 틀 카드 한 장 HTML: 배경(bg.png) 위 정해진 칸에 글자만 얹음 · 크기·위치는 틀 그대로
// 카드 형식: { tpl: 'event', s: { title: '밤 10시 45분,\n미국 “경기 체감”은?', time: '22:45', ... } }
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), 'out');
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const hasTpl = id => existsSync(join(out, String(id || ''), 'slots.json'));
export const tplOf = id => JSON.parse(readFileSync(join(out, id, 'slots.json'), 'utf8'));

export function fixedCard(draft, i) {
  const c = draft.cards[i], t = tplOf(c.tpl), s = Object.assign({}, c.s || {});
  if (s.pg == null) s.pg = (i + 1) + ' / ' + draft.cards.length;
  if (s.risk == null) s.risk = draft.disclaimer || '';
  const bg = pathToFileURL(join(out, c.tpl, 'bg.png')).href;
  const slot = x => {
    const v = esc(s[x.name]).replace(/“([^”]*)”/g, '<b>$1</b>').replace(/\n/g, '<br>');
    return `<div class="fs" data-n="${x.name}" data-lines="${x.lines}" style="left:${x.x}px;top:${x.y}px;width:${x.w}px;height:${x.h}px;font-size:${x.size}px;font-weight:${x.weight};color:${x.color};--hi:${x.hi};line-height:${x.lh}px;letter-spacing:${x.ls};text-align:${x.align};font-variant-numeric:${x.nums};white-space:${x.lines > 1 ? 'normal' : 'nowrap'}">${v}</div>`;
  };
  return `<style>.fx{position:relative;width:1080px;height:1350px;overflow:hidden;background:url(${bg}) 0 0/1080px 1350px no-repeat}.fs{position:absolute;overflow:hidden;word-break:keep-all}.fs b{font-weight:inherit;color:var(--hi)}</style><div class="fx">${t.slots.map(slot).join('')}</div>`;
}

// 칸을 넘치면 그 칸만 조금씩 줄임 (최소 80%) · 줄인 칸은 품질 관문이 글을 다시 쓰게 알려줌
export const fitFixed = () => [...document.querySelectorAll('.fx .fs')].map(e => {
  const base = parseFloat(e.style.fontSize), lh = parseFloat(e.style.lineHeight); let z = 1;
  const over = () => e.scrollWidth > e.clientWidth + 1 || (+e.dataset.lines > 1 && e.scrollHeight > e.clientHeight + 1);
  while (over() && z > 0.8) { z -= 0.04; e.style.fontSize = (base * z) + 'px'; e.style.lineHeight = (lh * z) + 'px'; }
  return { slot: e.dataset.n, z: +z.toFixed(2), clipped: over(), empty: !e.textContent.trim() };
});
