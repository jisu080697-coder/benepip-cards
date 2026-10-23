// 피그마 자동 반영 연결 프로그램 (내 컴퓨터에서만 · localhost:8766)
// 렌더 결과(cards/<id>/<ver>/cards.json) 중 아직 피그마 이미지가 없는 것을 "베네핍 자동 반영" 플러그인에 넘기고,
// 플러그인이 피그마에서 채워 내보낸 JPG 를 같은 폴더에 덮어쓴 뒤 figma.json 을 남기고 GitHub 에 올림 → 서버(Render.gs)가 이 이미지로 발행
// 사용: node fixed/fig_bridge.mjs   (SINCE=<ms> 로 그 이후 결과만 · 기본은 켠 시각 2시간 전부터)
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RD = dirname(dirname(fileURLToPath(import.meta.url))), FIG = join(RD, 'fixed', 'figma'), CARDS = join(RD, 'cards');
const SINCE = Number(process.env.SINCE || Date.now() - 2 * 3600e3);
const git = (...a) => execFileSync('git', a, { cwd: RD, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const giving = {};   // 플러그인에 넘긴 지 10분 안 된 것은 다시 넘기지 않음
let pulled = 0;
const pull = () => { if (Date.now() - pulled < 50e3) return; pulled = Date.now(); try { git('pull', '-q', '--rebase'); } catch (e) { console.log('git pull 실패', String(e.message).slice(0, 120)); } };

// 렌더 결과 → 플러그인이 채울 정보 (칸은 시안 글로 찾음 · 강조 “ ” 모양 · 알약 크기 · 쪽 번호)
function post(id, ver) {
  const d = JSON.parse(readFileSync(join(CARDS, id, ver, 'cards.json'), 'utf8'));
  const list = d.cards.filter(c => c.fig);
  return { id, ver, group: d.group, cards: list.map((c, i) => {
    const raw = JSON.parse(readFileSync(join(FIG, c.fig, 'raw.json'), 'utf8'));
    return { fig: c.fig, slots: raw.slots.map(s => {
      const base = s.segs[0], em = s.segs.find(g => g.color !== base.color || g.weight !== base.weight);
      let v = c.v && c.v[s.id];
      if (v == null && /^\d+ \/ \d+$/.test(s.text)) v = (i + 1) + ' / ' + list.length;
      if (v == null) return null;
      const p = (raw.shapes || []).find(x => x.kind === 'pill' && x.slot === s.id);
      return { o: s.text, v: String(v), em: em ? { c: em.color, w: em.weight } : null, pill: p ? { x: p.x, y: p.y, w: p.w, l: p.padL, r: p.padR } : null };
    }).filter(Boolean) };
  }) };
}
function pending() {
  pull();
  const out = [];
  for (const id of existsSync(CARDS) ? readdirSync(CARDS) : []) {
    const vers = readdirSync(join(CARDS, id)).filter(v => /^v\d+$/.test(v)).sort();
    const ver = vers[vers.length - 1];   // 초안마다 가장 최근 렌더만
    if (!ver || +ver.slice(1) < SINCE) continue;
    const dir = join(CARDS, id, ver);
    if (!existsSync(join(dir, 'cards.json')) || existsSync(join(dir, 'figma.json'))) continue;
    if (giving[id + ver] && Date.now() - giving[id + ver] < 600e3) continue;
    try { out.push(post(id, ver)); giving[id + ver] = Date.now(); } catch (e) { console.log('건너뜀', id, ver, e.message); }
    if (out.length >= 3) break;   // 한 번에 3개씩
  }
  return out;
}
function save(m) {
  const dir = join(CARDS, m.id, m.ver);
  if (!existsSync(dir)) throw new Error('폴더 없음 ' + m.id + '/' + m.ver);
  readdirSync(dir).filter(f => /^\d+\.(jpe?g|png)$/i.test(f)).forEach(f => unlinkSync(join(dir, f)));
  m.imgs.forEach((b, i) => writeFileSync(join(dir, String(i + 1).padStart(2, '0') + '.jpg'), Buffer.from(b, 'base64')));
  writeFileSync(join(dir, 'figma.json'), JSON.stringify({ at: new Date().toISOString(), n: m.imgs.length, edited: !!m.edited }));
  git('add', '-A', join('cards', m.id, m.ver));
  git('commit', '-q', '-m', 'figma ' + m.id + (m.edited ? ' (피그마에서 고침)' : ''));
  for (let k = 0; k < 3; k++) { try { git('pull', '-q', '--rebase'); git('push', '-q'); return; } catch (e) { if (k === 2) throw e; } }
}

const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method === 'GET' && req.url === '/pending') { try { res.end(JSON.stringify(pending())); } catch (e) { res.statusCode = 500; res.end(String(e.message)); } return; }
  if (req.method === 'POST' && req.url === '/done') {
    let body = ''; req.setEncoding('utf8'); req.on('data', d => { body += d; });
    req.on('end', () => { try { const m = JSON.parse(body); save(m); console.log(new Date().toLocaleTimeString('ko-KR'), '올림', m.id, m.imgs.length + '장', m.edited ? '(고친 것)' : ''); res.end('ok'); } catch (e) { console.log('실패', e.message); res.statusCode = 400; res.end(String(e.message)); } });
    return;
  }
  res.statusCode = 404; res.end();
};
createServer(handler).listen(8766, '127.0.0.1', () => console.log('피그마 자동 반영 대기 localhost:8766 · ' + new Date(SINCE).toLocaleString('ko-KR') + ' 이후 결과'));
createServer(handler).listen(8766, '::1').on('error', () => {});
