// 피그마 "베네핍 시안 맞추기" 플러그인 만들기: 시스템에서 바로잡은 내용을 피그마 시안 v2 원본에 그대로 반영
//  - 글 위치 보정 (polish_v2.py 와 같은 값) · 본문 제목 굵기 700/강조 800 · 계산 장 2장(페이백 2·플랫폼 4) 제목 위·상자 아래로
// 사용: node fixed/fig_nodes.mjs <노드.json> "거래비용·페이백 2" "플랫폼 활용 4" → node fixed/make_sync_plugin.mjs <노드.json>
// 피그마에서 한 번 실행 → 이어서 "베네핍 틀 내보내기" 실행 (피그마 = 원본, 시스템 = 그대로 재현)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), OUT = join(here, '..', '..', '피그마_플러그인', '시안맞추기');
const nodes = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const r2 = v => Array.isArray(v) ? v.map(r2) : typeof v === 'number' ? Math.round(v * 1000) / 1000 : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined && x !== null && x !== 0).map(([k, x]) => [k, r2(x)])) : v;
const DATA = JSON.stringify({
  cards: nodes.map(c => r2({ name: c.name, bg: c.bg, gr: c.gr, nodes: c.nodes })),
  // 글 위치: 시안 프레임 안 글을 찾아(앞부분 글자로) 위치를 바꿈
  moves: [
    ['경제 캘린더 2', '예상보다 높으면', { x: 100 }], ['경제 캘린더 3', '늘어나면 고용', { x: 100 }], ['경제 캘린더 4', '50 위면 확장', { x: 100 }],
    ...['사용 기한이', '지급일부터 날짜', '조건 전에 출금', '크레딧과 그 수익', '여러 계좌로', '한 사람 한 번'].map(t => ['혜택·적용 조건 3', t, { x: 100 }]),
  ],
  shifts: [['거래비용·페이백 1', '10월 페이백 내역', -8], ['거래비용·페이백 1', '예시 · 브로커 A', -8], ['거래비용·페이백 3', '3 / 5', 22], ['플랫폼 활용 2', '2 / 5', 22]]
});
const code = `// 베네핍 시안 맞추기 (자동 생성 · 직접 고치지 마세요) · 시안 v2 페이지에 한 번만
const DATA = ${DATA};
const PAGE = '시안 v2';
(async () => {
  try {
    const fonts = await figma.listAvailableFontsAsync();
    const fam = fonts.some(f => f.fontName.family === 'Pretendard') ? 'Pretendard' : 'Noto Sans KR';
    const styles = fonts.filter(f => f.fontName.family === fam).map(f => f.fontName.style);
    const WANT = { 100: ['Thin'], 200: ['ExtraLight', 'Extra Light'], 300: ['Light'], 400: ['Regular'], 500: ['Medium'], 600: ['SemiBold', 'Semi Bold', 'Bold'], 700: ['Bold'], 800: ['ExtraBold', 'Extra Bold', 'Bold'], 900: ['Black'] };
    const st = w => { const k = Math.min(900, Math.max(100, Math.round((w || 400) / 100) * 100)); return (WANT[k] || ['Regular']).find(s => styles.includes(s)) || 'Regular'; };
    for (const s of styles) await figma.loadFontAsync({ family: fam, style: s });
    const pg = figma.root.children.find(p => p.name === PAGE); if (!pg) { figma.closePlugin('"' + PAGE + '" 페이지가 없어요'); return; }
    await figma.setCurrentPageAsync(pg);
    if (pg.getPluginData('bp-sync') === 'v1') { figma.closePlugin('이미 맞춘 시안이에요 · 바로 "베네핍 틀 내보내기"를 실행하세요'); return; }
    const frame = n => pg.children.find(f => f.name === n);
    const norm = s => String(s || '').replace(/\\s+/g, '');
    const find = (fr, t) => fr && fr.findAll(n => n.type === 'TEXT').find(n => norm(n.characters).indexOf(norm(t)) === 0);
    let moved = 0, titles = 0; const errs = [];
    for (const [f, t, set] of DATA.moves) { const n = find(frame(f), t); if (!n) { errs.push(f + ' ' + t); continue; } if (set.x != null) n.x = set.x; moved++; }
    for (const [f, t, dy] of DATA.shifts) { const n = find(frame(f), t); if (!n) { errs.push(f + ' ' + t); continue; } n.y += dy; moved++; }
    // 계산 장 2장: 프레임 안을 비우고 제목 위·상자 아래 구성으로 다시 그림
    const logoC = await figma.getNodeByIdAsync('2:4'), logoW = await figma.getNodeByIdAsync('2:5');
    const P = c => ({ type: 'SOLID', color: { r: c[0], g: c[1], b: c[2] }, opacity: c[3] == null ? 1 : c[3] });
    for (const c of DATA.cards) {
      const fr = frame(c.name); if (!fr) { errs.push('프레임 없음 ' + c.name); continue; }
      for (const k of [...fr.children]) k.remove();
      fr.fills = [P(c.bg || [1, 1, 1, 1])];
      for (const n of c.nodes) {
        try {
          const [x, y, w, h] = n.r; let o;
          if (n.k === 'box') {
            o = figma.createRectangle(); o.name = '상자'; o.resize(Math.max(w, 1), Math.max(h, 1));
            o.fills = n.bg ? [P(n.bg)] : []; if (n.rad) o.cornerRadius = n.rad;
            if (n.bw && n.bc) { o.strokes = [P(n.bc)]; o.strokeAlign = 'INSIDE'; o.strokeTopWeight = n.bw[0] || 0; o.strokeRightWeight = n.bw[1] || 0; o.strokeBottomWeight = n.bw[2] || 0; o.strokeLeftWeight = n.bw[3] || 0; }
            if (n.sh) o.effects = [{ type: 'DROP_SHADOW', color: { r: n.sh.c[0], g: n.sh.c[1], b: n.sh.c[2], a: n.sh.c[3] }, offset: { x: n.sh.x || 0, y: n.sh.y || 0 }, radius: n.sh.b || 0, spread: n.sh.s || 0, visible: true, blendMode: 'NORMAL' }];
          } else if (n.k === 'text') {
            o = figma.createText(); o.fontName = { family: fam, style: st(400) };
            const txt = n.runs.map(r => r.t).join(''); o.characters = txt; let p = 0;
            for (const r of n.runs) { const e = p + r.t.length; if (r.s && e > p) { o.setRangeFontName(p, e, { family: fam, style: st(r.w) }); o.setRangeFontSize(p, e, r.s); o.setRangeFills(p, e, [P(r.c)]); } p = e; }
            if (n.lh) o.lineHeight = { unit: 'PIXELS', value: n.lh }; if (n.ls) o.letterSpacing = { unit: 'PIXELS', value: n.ls };
            o.textAlignHorizontal = n.al === 'C' ? 'CENTER' : n.al === 'R' ? 'RIGHT' : 'LEFT';
            if (n.nw) o.textAutoResize = 'WIDTH_AND_HEIGHT'; else { o.resize(Math.max(w + 12, 10), Math.max(h, 10)); o.textAutoResize = 'HEIGHT'; }
            o.name = txt.replace(/\\n/g, ' ').slice(0, 20);
          } else if (n.k === 'svg') { o = figma.createNodeFromSvg(n.svg); o.name = '그림'; o.resize(Math.max(w, 1), Math.max(h, 1)); }
          else if (n.k === 'img') { o = (/white/.test(n.src) ? logoW : logoC).createInstance(); o.resize(w, h); }
          if (!o) continue; fr.appendChild(o); o.x = x; o.y = y; if (n.op) o.opacity = n.op;
        } catch (e) { errs.push(c.name + ' ' + n.k + ': ' + String(e.message || e).slice(0, 60)); }
      }
    }
    // 본문 장 제목(80px): 기본 글자 Bold(700) · 강조(색이 다른 글자) ExtraBold(800)
    for (const fr of pg.children.filter(f => f.type === 'FRAME')) {
      for (const n of fr.findAll(n => n.type === 'TEXT' && n.fontSize === 80)) {
        const segs = n.getStyledTextSegments(['fills']), base = JSON.stringify((segs[0] || {}).fills);
        for (const g of segs) n.setRangeFontName(g.start, g.end, { family: fam, style: JSON.stringify(g.fills) === base ? st(700) : st(800) });
        titles++;
      }
    }
    pg.setPluginData('bp-sync', 'v1');
    figma.closePlugin('시안 맞추기 완료 · 글 위치 ' + moved + '곳 · 제목 ' + titles + '개 · 계산 장 ' + DATA.cards.length + '장' + (errs.length ? ' · 확인 필요 ' + errs.length + '건: ' + errs[0] : '') + ' → 이어서 "베네핍 틀 내보내기"');
  } catch (e) { figma.closePlugin('실패: ' + (e.message || e)); }
})();
`;
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'code.js'), code, 'utf8');
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ name: '베네핍 시안 맞추기', id: 'benepip-sync-local', api: '1.0.0', main: 'code.js', editorType: ['figma'], documentAccess: 'dynamic-page' }, null, 2), 'utf8');
console.log('ok', code.length);
