// cards.src.js + CSS(palette·v3·v3b) + 아이콘 팩 → templates/cards.bundle.js 하나로
// 렌더러(render.mjs)와 관리 화면(build.py가 화면에 넣음)이 같은 파일을 씀 · 카드 디자인을 고치면: node build_cards.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const tpl = join(dirname(fileURLToPath(import.meta.url)), 'templates');
const read = f => readFileSync(join(tpl, f), 'utf8');

const glassSrc = read('glassicons.mjs').replace(/^export /gm, '');
const { GLASS_CSS } = await import('./templates/glassicons.mjs');
const strip = css => css.replace(/@import[^;]+;/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const css = strip(read('palette.css')) + strip(read('v3.css')) + strip(read('v3b.css')) + strip(read('v4.css')) + strip(read('v5.css')) + GLASS_CSS + '\n.art .gi{width:100%;height:100%}';

// 관리 화면용: 모든 규칙을 .v3c 안으로 (화면의 다른 스타일과 섞이지 않게)
const scoped = css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, body) => {
  const list = sel.split(',').map(s => s.trim()).filter(Boolean);
  if (list.join(',') === 'html,body') return '';
  return list.map(s => (s === ':root' || s === 'body' || s === 'html') ? '.v3c' : '.v3c ' + s).join(',') + '{' + body + '}';
}).replace(/\s+/g, ' ');

const cardsSrc = read('cards.src.js').replace(/^if \(typeof globalThis[^\n]*\n?/m, '');
const out = `// 자동 생성 파일 (build_cards.mjs) · 직접 고치지 말고 cards.src.js · v3.css · v3b.css 를 고친 뒤 다시 빌드
(function () {
var BPGlass = (function () {
${glassSrc}
return { icon: glassIconX, names: GLASS_NAMES };
})();
var BP_ICON = BPGlass.icon;
${cardsSrc}
BPCards.css = ${JSON.stringify(css.replace(/\s+/g, ' '))};
BPCards.scopedCss = ${JSON.stringify(scoped)};
BPCards.ICONS = BPGlass.names;
BPCards.icon = BP_ICON;
if (typeof globalThis !== 'undefined') globalThis.BPCards = BPCards; else if (typeof window !== 'undefined') window.BPCards = BPCards;
})();
`;
writeFileSync(join(tpl, 'cards.bundle.js'), out);
console.log('cards.bundle.js', out.length);
