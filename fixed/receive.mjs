// 피그마 "베네핍 틀 내보내기" 플러그인이 보내는 틀을 받아 fixed/figma/<이름>/ 에 저장 (bg.png · full.png · raw.json)
// 사용: node fixed/receive.mjs   (내 컴퓨터에서만 · localhost:8765)
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'figma');
const safe = s => String(s || 'frame').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 60) || 'frame';
const handler = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST' || req.url !== '/tpl') { res.statusCode = 404; return res.end(); }
  let body = ''; req.setEncoding('utf8'); req.on('data', d => { body += d; });
  req.on('end', () => {
    try {
      const m = JSON.parse(body), dir = join(root, safe(m.name)); mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'bg.png'), Buffer.from(m.png, 'base64'));
      writeFileSync(join(dir, 'full.png'), Buffer.from(m.full, 'base64'));
      writeFileSync(join(dir, 'raw.json'), JSON.stringify({ name: m.name, w: m.w, h: m.h, slots: m.slots, shapes: m.shapes || [], rects: m.rects || [] }, null, 1));
      console.log('받음', m.name, m.slots.length + '칸'); res.end('ok');
    } catch (e) { console.log('실패', e.message); res.statusCode = 400; res.end(String(e.message)); }
  });
};
// localhost 가 ::1 로 잡히는 경우까지 (내 컴퓨터 안에서만)
createServer(handler).listen(8765, '127.0.0.1', () => console.log('수신 대기 localhost:8765'));
createServer(handler).listen(8765, '::1').on('error', () => {});
