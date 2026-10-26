# 메인 카피(제목) 글자 키우기 (사용자 요청 2026-10-26: 메인 느낌이 나게 · 80→92 · 표지 96→110, 15%)
# raw.json 의 제목 칸 글자 크기·줄 간격·자간을 같은 비율로 바꾸고, 피그마 원본도 같게 바꾸도록 title_fix.json 을 남김 (자동 반영 플러그인이 읽어 적용)
# 멱등: 이미 바뀐 칸(92·110)은 건너뜀 · 사용: python fixed/scale_titles.py → node fixed/calibrate.mjs → python fixed/catalog.py → node fixed/verify.mjs
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.abspath(__file__))
cat = json.load(open(os.path.join(ROOT, 'catalog.json'), encoding='utf-8'))
MAP = {80: 92, 96: 110}
fixes, n = [], 0
for t in cat:
    p = os.path.join(ROOT, 'figma', t['n'], 'raw.json')
    if not os.path.exists(p): continue
    r = json.load(open(p, encoding='utf-8')); ids = {x[0] for x in t['s'] if '제목' in x[1]}
    for s in r['slots']:
        if s['id'] not in ids: continue
        z = s['segs'][0]['size']
        if z not in MAP and z in MAP.values():   # 이미 바꾼 칸 → 피그마 고침 목록만 다시
            fixes.append({'frame': t['n'], 'x': s['x'], 'y': s['y'], 'size': z, 'lh': s['segs'][0]['lh'], 'ls': s['segs'][0]['ls']}); continue
        if z not in MAP: continue
        f = MAP[z] / z
        for g in s['segs']: g['size'] = MAP[z]; g['lh'] = round(g['lh'] * f, 1); g['ls'] = round(g['ls'] * f, 2)
        s['h'] = round(s['h'] * f, 1)
        if s['autoResize'] == 'WIDTH_AND_HEIGHT': s['w'] = round(s['w'] * f, 1)
        fixes.append({'frame': t['n'], 'x': s['x'], 'y': s['y'], 'size': MAP[z], 'lh': s['segs'][0]['lh'], 'ls': s['segs'][0]['ls']}); n += 1
    json.dump(r, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'ver': 'title-92', 'fixes': fixes}, open(os.path.join(ROOT, 'title_fix.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('바꾼 칸', n, '· 피그마 고칠 칸', len(fixes))
