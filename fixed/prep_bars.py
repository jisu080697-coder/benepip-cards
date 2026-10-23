# 피그마 틀의 막대 찾기 (플러그인이 못 잡은 것): 왼쪽 끝이 같은 사각형 2개 이상 + 같은 줄 오른쪽에 숫자 글자
# 찾은 막대는 raw.json shapes 에 bar 로 넣고, 배경에 남은 원래 막대는 바탕색으로 덮음 (erase)
# 사용: python fixed/prep_bars.py
import json, os, re, sys
from PIL import Image

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'figma')
for name in sorted(os.listdir(root)):
    p = os.path.join(root, name, 'raw.json')
    if not os.path.exists(p): continue
    d = json.load(open(p, encoding='utf-8'))
    have = {s['slot'] for s in d.get('shapes', []) if s['kind'] == 'bar'}
    rs = [r for r in d.get('rects', []) if r.get('fill') and 6 <= r['h'] <= 90 and r['w'] >= 12]
    bg = Image.open(os.path.join(root, name, 'bg.png')).convert('RGB'); sc = bg.width / d['w']
    added = 0
    for r in rs:
        col = [q for q in rs if abs(q['x'] - r['x']) <= 2 and abs(q['h'] - r['h']) <= 4]
        if len(col) < 2: continue
        cy = r['y'] + r['h'] / 2
        num = [s for s in d['slots'] if re.search(r'\d', s['text']) and abs(s['y'] + s['h'] / 2 - cy) <= 30 and s['x'] >= r['x'] + r['w'] - 4]
        if not num: continue
        s = min(num, key=lambda s: s['x'])
        if s['id'] in have: continue
        px = bg.getpixel((max(0, int((r['x'] - 8) * sc)), int(cy * sc)))
        d.setdefault('shapes', []).append({'kind': 'bar', 'slot': s['id'], 'x': r['x'], 'y': r['y'], 'w': r['w'], 'h': r['h'], 'rad': min(r['h'] / 2, 20), 'fill': r['fill'], 'erase': 'rgb(%d,%d,%d)' % px})
        have.add(s['id']); added += 1
    if added:
        json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(name, '막대', added)
