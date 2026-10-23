# 평가표: 최근 렌더 결과를 초안마다 한 줄로, 장마다 [결과 | 피그마 시안] 을 나란히 붙인 이미지
# 사용: python fixed/report.py <이후 시각 ms | 로컬 테스트 결과 폴더> <저장 폴더>  → report_1.jpg, report_2.jpg … (한 장에 초안 5개)
import json, os, sys, glob
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARG = sys.argv[1] if len(sys.argv) > 1 else '0'
SINCE = int(ARG) if ARG.isdigit() else 0   # 숫자가 아니면 로컬 테스트 결과 폴더 (그 안의 img* 폴더들)
OUT = sys.argv[2] if len(sys.argv) > 2 else '.'
W = 240                      # 카드 한 장 폭 (결과·시안 각각)
H = W * 1350 // 1080
PER = 5                      # 한 장에 초안 몇 개
font = lambda n: ImageFont.truetype('C:/Windows/Fonts/malgun.ttf', n)

# 초안마다 가장 최근 버전 (SINCE 이후)
rows = {}
for d in glob.glob(os.path.join(ROOT, 'cards', '*', 'v*')):
    v = int(os.path.basename(d)[1:]); cid = os.path.basename(os.path.dirname(d))
    if v > SINCE and os.path.exists(os.path.join(d, 'metrics.json')) and (cid not in rows or v > rows[cid][0]): rows[cid] = (v, d)
rows = sorted(rows.items(), key=lambda x: x[1][0])
if not ARG.isdigit(): rows = [(os.path.basename(d), (0, d)) for d in sorted(glob.glob(os.path.join(ARG, 'img*'))) if os.path.exists(os.path.join(d, 'metrics.json'))]

def card(path):
    try: return Image.open(path).convert('RGB').resize((W, H))
    except Exception: im = Image.new('RGB', (W, H), '#eee'); ImageDraw.Draw(im).text((10, 10), '없음', fill='#999', font=font(16)); return im

pages = [rows[i:i + PER] for i in range(0, len(rows), PER)] or [[]]
for pi, page in enumerate(pages):
    maxn = max([len(json.load(open(os.path.join(d, 'metrics.json'), encoding='utf-8'))) for _, (v, d) in page] or [1])
    RW, RH = 40 + maxn * (W * 2 + 24), 60 + H + 30
    sheet = Image.new('RGB', (RW, 50 + len(page) * RH), 'white'); dr = ImageDraw.Draw(sheet)
    dr.text((20, 12), '평가표 %d/%d · 초안 %d개 · 장마다 왼쪽 결과 / 오른쪽 피그마 시안' % (pi + 1, len(pages), len(rows)), fill='#111', font=font(22))
    for ri, (cid, (v, d)) in enumerate(page):
        y = 50 + ri * RH; m = json.load(open(os.path.join(d, 'metrics.json'), encoding='utf-8'))
        bad = [str(c['n']) + '장 ' + ','.join(c.get('over') or []) for c in m if c.get('over')]
        dr.text((20, y + 8), '%d. %s (%d장)  %s' % (pi * PER + ri + 1, cid, len(m), ('넘침: ' + ' / '.join(bad)) if bad else '넘침 없음'), fill='#c00' if bad else '#060', font=font(18))
        for k, c in enumerate(m):
            x = 20 + k * (W * 2 + 24)
            sheet.paste(card(os.path.join(d, '%02d.jpg' % c['n'])), (x, y + 40))
            sheet.paste(card(os.path.join(ROOT, 'fixed', 'figma', c.get('fig') or '-', 'full.png')), (x + W + 4, y + 40))
            dr.text((x, y + 44 + H), '%d · %s' % (c['n'], c.get('fig') or '예전 디자인'), fill='#333', font=font(14))
        dr.line((0, y + RH - 6, RW, y + RH - 6), fill='#ddd', width=2)
    p = os.path.join(OUT, 'report_%d.jpg' % (pi + 1)); sheet.save(p, quality=85); print(p)
