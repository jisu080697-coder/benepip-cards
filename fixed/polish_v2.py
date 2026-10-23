# 시안 v2 틀 글 위치 바로잡기 (피그마 시안 자체의 어긋남) · 여러 번 돌려도 같은 결과 (raw.json 의 polished 표시)
# 사용: python fixed/polish_v2.py   (피그마에서 다시 내보낸 뒤에도 한 번)
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'figma')

def edit(name, fn):
    p = os.path.join(ROOT, name, 'raw.json'); d = json.load(open(p, encoding='utf-8'))
    if d.get('polished'): return
    by = {s['id']: s for s in d['slots']}
    fn(by, d); d['polished'] = 1
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); print('고침', name)

# 발표 장: '발표 전후로 볼 것' 아래 문장을 이름표 왼쪽 끝(100)에 맞춤
for n in ['경제 캘린더 2', '경제 캘린더 3', '경제 캘린더 4']:
    edit(n, lambda by, d: by['t13'].update(x=by['t12']['x']))

# 경우 목록: 아이콘이 빠진 자리만큼 들어간 글을 구분선 시작점(100)에 맞춤
edit('혜택·적용 조건 3', lambda by, d: [by[k].update(x=100) for k in ['t3', 't4', 't5', 't6', 't7', 't8']])

# 영수증 표지: 제목·부제를 위로 (부제가 아래 구분선에 붙지 않게)
def rcpt(by, d):
    for k in ['t3', 't4']: by[k]['y'] -= 8
edit('거래비용·페이백 1', rcpt)

# 쪽 번호가 마지막 값에 붙은 장: 쪽 번호를 아래로
for n, k in [('거래비용·페이백 3', 't11'), ('플랫폼 활용 2', 't12')]:
    edit(n, lambda by, d, k=k: by[k].update(y=by[k]['y'] + 22))
