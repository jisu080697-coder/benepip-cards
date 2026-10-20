// BenePip 카드뉴스 v3 · 카드 HTML 만들기 (렌더러와 관리 화면 미리보기가 같이 씀)
// 카드 = { t: 제목, b: 본문(줄마다 의미, 칸은 | 로 구분), layout, k: 작은 머리말, n: 아래 작은 메모, icon }
// 표지는 주제군마다 정해진 형태 · 가운데·마지막 장은 layout 으로 고름
// build_cards.mjs 가 CSS·아이콘과 합쳐 cards.bundle.js 로 만듦 (직접 고친 뒤 꼭 다시 빌드)
/* global BP_ICON */
var BPCards = (function () {
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>\x22]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;' }[c]; }); };
  // 꾸미는 한 글자 말(이 세 가지 · 두 번)은 뒷말에, 그 밖의 한 글자 말(전 · 꼭)은 앞말에 붙여 줄이 그 사이에서 안 바뀌게
  var glue = function (t) { return String(t == null ? '' : t).replace(/(^|[ \n ])([이그저한두세네몇첫각새옛온]) (?=\S)/g, '$1$2 ').replace(/ (\S)(?= |\n|$)/g, ' $1'); };
  // “강조” 구간은 색 강조 (곧은 큰따옴표도 같은 뜻으로)
  var hi = function (t) { return esc(glue(String(t == null ? '' : t).replace(/\x22([^\x22\n]{1,30})\x22/g, '“$1”'))).replace(/“([^”]+)”/g, '<b>$1</b>').replace(/\n/g, '<br>'); };
  var txt = function (t) { return esc(glue(t)).replace(/\n/g, '<br>'); };
  var lines = function (b) { return String(b == null ? '' : b).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  var cells = function (x) { return x.split('|').map(function (y) { return y.trim(); }); };
  var rowsOf = function (b) { return lines(b).filter(function (x) { return x.indexOf('|') >= 0; }).map(cells); };
  var plainOf = function (b) { return lines(b).filter(function (x) { return x.indexOf('|') < 0; }); };
  var star = function (s) { s = String(s || ''); return s.charAt(0) === '*' ? [true, s.slice(1).trim()] : [false, s]; };
  var num = function (s) { var m = String(s || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 0; };
  var pill = function (s) { var k = /완료|승인|가능|적립됨|연결됨/.test(s) ? 'ok' : /확인|필요|잠김|실패|불가|거절/.test(s) ? 'chk' : 'wait'; return '<span class="pill ' + k + '">' + esc(s) + '</span>'; };
  var logo = function (white) { return '<img class="logo" src="' + (white ? 'benepip-logo-allwhite.png' : 'benepip-logo.png') + '">'; };
  var icon = function (n, o) { return typeof BP_ICON === "function" ? BP_ICON(n, o) : ''; };

  // ── 주제군별 표지 (시리즈처럼 일관되게) ──
  var COVER_OF = { '경제 캘린더·이벤트': 'c-report', '플랫폼 활용': 'c-edit', '거래비용·페이백': 'c-receipt', '혜택·적용 조건': 'c-balance', '브로커 이용 가이드': 'c-num', '베네핍 이용 안내': 'c-state' };
  var COVER_ALT = { '거래비용·페이백': ['c-issue'] };   // 문제 상황 주제일 때만 쓰는 보조 표지
  var ICON_OF = { '플랫폼 활용': 'chart', '경제 캘린더·이벤트': 'calendar' };
  var DARK = { '플랫폼 활용': 1 };                      // 본문까지 남색으로 이어지는 주제군
  var BODY = [['body', '기본 (제목 + 설명)'], ['big', '한 문장 크게'], ['vs', '두 칸 비교'], ['table', '표'], ['steps', '순서'], ['flow', '예/아니오 흐름'], ['stat', '큰 숫자 + 막대'], ['calc', '계산 상자'], ['ui', '앱 화면 조각'], ['qa', '묻고 답하기'], ['warn', '주의'], ['event', '발표 상세'], ['check', '체크리스트'], ['reason', '이유 (큰 번호)'], ['route', '경로 (→)']];
  var ENDS = [['e-checks', '캡처용 체크 칸'], ['e-msg', '바로 쓰는 문장'], ['e-timeline', '전·후 타임라인'], ['e-fill', '빈칸 계산'], ['e-sum', '한 장 요약 (파랑)'], ['steps', '다음 행동 순서'], ['table', '저장용 표'], ['calc', '계산 상자']];
  var COVERS = [['c-report', '주간 리포트'], ['c-edit', '남색 에디토리얼'], ['c-receipt', '영수증'], ['c-issue', '질문 + 앱 내역'], ['c-balance', '잔고 화면'], ['c-num', '큰 숫자'], ['c-state', '상태 카드'], ['c-plain', '기본 표지']];
  var HINT = {
    'c-report': '본문 한 줄 = "요일 | 발표 | 시각" (예: 수 | 영국 CPI | 15:00) · 메모 = 오른쪽 위 날짜 글',
    'c-edit': '본문 = 아래 띠 문구 한 줄 (예: 플랫폼 활용 · 설정 3단계)',
    'c-receipt': '첫 줄 = 영수증 제목 · 다음 줄 "항목 | 값" · 마지막 줄 = 합계(가려서 보여요) · 메모 = 작은 부제(예시 등)',
    'c-issue': '첫 줄 = 화면 이름 · 다음 줄 "제목 | 보조 | 금액 | 상태" (상태: 적립 완료 · 확인 필요 · 집계 중)',
    'c-balance': '두 줄 "항목 | 금액 | 설명" · 첫 줄 = 회색(빼지 못하는 돈), 둘째 줄 = 파랑',
    'c-num': '첫 줄 = 크게 보일 숫자 · 다음 줄부터 꼬리표 2~3개',
    'c-state': '두 줄 "상태 | 제목 | 설명" · 첫 줄 = 전(흐리게), 둘째 줄 = 후(또렷하게)',
    'c-plain': '본문 = 아래 상자 문구 · 둘째 줄은 작은 글씨',
    body: '본문 1~3줄', big: '제목 = 크게 보일 한 문장 (“강조”) · 본문 = 아래 설명',
    vs: '첫 줄 "A 이름 | A 부제 | B 이름 | B 부제" · 다음 줄 "기준 | A 내용 | B 내용" (A가 강조돼요)',
    table: '한 줄 = 한 행 · 칸은 | 로 구분 · 첫 줄은 머리글',
    steps: '한 줄 = "단계 이름 | 설명" (3~4개)', flow: '한 줄 = "질문 | 아니오일 때 할 일" · 마지막 줄(| 없이) = 모두 예일 때',
    stat: '첫 줄 = 큰 숫자(예: 5랏) · 둘째 줄 = 설명 · 다음 줄 "항목 | 값" 막대 (앞에 * = 강조)',
    calc: '한 줄 = "항목 | 값" · 마지막 줄 = 결과', ui: '첫 줄 = 화면 이름 · 다음 줄 "항목 | 값" (앞에 * = 강조) · 메모 = 아래 설명',
    qa: '한 줄 = "질문 | 답" (2개)', warn: '한 줄 = "주의할 점 | 이유" (2~3개)',
    event: '첫 줄 "날짜 요일 | 시각" · "항목 | 값" 2~4줄 · "- 볼 것" 1~2줄',
    check: '한 줄 = "항목 | 보조" (3~4개)', reason: '첫 줄 = 설명 · 다음 줄 "항목 | 상태" (선택)', route: '한 줄 = "출발 | 도착 | 보조"',
    'e-checks': '한 줄 = "체크 항목 | 보조" (3~4개)', 'e-msg': '본문 = 그대로 보낼 문장 ([ ] 는 바꿀 곳) · 메모 = 설명',
    'e-timeline': '"날짜 | 일" 4줄 (기준 날짜 앞에 *) · "전: …" "후: …" 줄로 아래 두 칸', 'e-fill': '한 줄 = 빈칸 항목 · 마지막 줄 = 결과', 'e-sum': '한 줄 = "요약 | 보조" (3~4개)'
  };
  var coverType = function (d) {
    var c = (d.cards || [])[0] || {}, def = COVER_OF[d.group] || 'c-plain', alt = COVER_ALT[d.group] || [];
    return c.layout === def || alt.indexOf(c.layout) >= 0 || c.layout === 'c-plain' ? c.layout : def;
  };
  var isEnd = function (L) { return ENDS.some(function (x) { return x[0] === L; }); };
  var isBody = function (L) { return BODY.some(function (x) { return x[0] === L; }); };
  var kindOf = function (d, i) {
    var n = d.cards.length, L = d.cards[i].layout === 'compare' ? 'table' : d.cards[i].layout;   // 예전 초안의 비교표는 표로
    if (i === 0) return coverType(d);
    if (i === n - 1) return isEnd(L) ? L : 'e-sum';
    return isBody(L) ? L : 'body';
  };

  // ── 표지 ──
  var plainCover = function (c, d) {
    var p = lines(c.b);
    return '<div class="k T1 CP">' + logo() + (c.k ? '<div class="kicker">' + esc(c.k) + '</div>' : '') + '<h1>' + hi(c.t) + '</h1>' +
      (p.length ? '<div class="box"><div><b>' + txt(p[0]) + '</b>' + (p[1] ? '<span>' + txt(p[1]) + '</span>' : '') + '</div><i>›</i></div>' : '') + '</div>';
  };
  var COVER = {
    'c-plain': plainCover,
    'c-report': function (c, d) {
      var r = rowsOf(c.b), days = ['월', '화', '수', '목', '금'];
      var cell = function (dd) { var x = r.filter(function (y) { return y[0].charAt(0) === dd; }); return x.length ? '<div class="on"><b>' + dd + '</b><span>' + x.map(function (y) { return esc(y[1] || '') + (y[2] ? '<br>' + esc(y[2]) : ''); }).join('<br>') + '</span></div>' : '<div><b>' + dd + '</b><span>—</span></div>'; };
      return '<div class="k T6"><div class="mast"><span class="t">BenePip Weekly</span><span class="d">' + esc(c.n || '한국 시간') + '</span></div><div class="art">' + icon(c.icon || 'calendar') + '</div>' +
        '<div class="kicker">' + esc(c.k || '이번 주 경제 캘린더') + '</div><h1>' + hi(c.t) + '</h1><div class="week">' + days.map(cell).join('') + '</div><div class="note">넘겨서 발표별 확인할 것 보기 →</div></div>';
    },
    'c-edit': function (c, d) {
      return '<div class="k T4">' + logo(1) + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' +
        '<div class="art" style="width:420px;height:420px;right:70px;top:150px">' + icon(c.icon || ICON_OF[d.group] || 'chart', { dark: 1 }) + '</div>' +
        (lines(c.b)[0] ? '<div class="bar">' + txt(lines(c.b)[0]) + '</div>' : '') + '</div>';
    },
    'c-receipt': function (c, d) {
      var r = rowsOf(c.b), p = plainOf(c.b); if (r.length < 2) return plainCover(c, d);
      var last = r.pop();
      return '<div class="k CG">' + logo(1) + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' +
        '<div class="rcpt"><h4>' + esc(p[0] || '내역') + '</h4><div class="d">' + esc(c.n || '예시') + '</div>' +
        r.map(function (x) { return '<div class="ln"><span>' + esc(x[0]) + '</span>' + esc(x[1] || '') + '</div>'; }).join('') +
        '<div class="ln tot"><span>' + esc(last[0]) + '</span><b class="blur">' + esc(last[1] || '') + '</b></div></div></div>';
    },
    'c-issue': function (c, d) {
      var r = rowsOf(c.b), p = plainOf(c.b); if (!r.length) return plainCover(c, d);
      return '<div class="k CQ">' + logo() + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' +
        '<div class="uic"><div class="cap"><span>' + esc(p[0] || '베네핍 · 페이백 내역') + '</span><span>' + esc(c.n || '예시 화면') + '</span></div>' +
        r.slice(0, 3).map(function (x) { var bad = /확인|필요|실패/.test(x[3] || ''); return '<div class="lrow' + (bad ? ' hl' : '') + '"><div><b>' + esc(x[0]) + '</b><small>' + esc(x[1] || '') + '</small></div><div class="r"><strong>' + esc(x[2] || '—') + '</strong>' + (x[3] ? pill(x[3]) : '') + '</div></div>'; }).join('') + '</div></div>';
    },
    'c-balance': function (c, d) {
      var r = rowsOf(c.b); if (r.length < 2) return plainCover(c, d);
      var a = num(r[0][1]), b = num(r[1][1]), sum = a + b, cur = /\$/.test(r[0][1] + r[1][1]) ? '$' : '', pa = sum ? Math.round(a / sum * 100) : 50;
      var amt = cur + sum.toLocaleString('en-US', { minimumFractionDigits: cur ? 2 : 0, maximumFractionDigits: 2 });
      return '<div class="k CF">' + logo() + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' +
        '<div class="uic bal"><div class="cap"><span>계좌 잔고</span><span>' + esc(c.n || '예시') + '</span></div><div class="amt">' + esc(amt) + '</div>' +
        '<div class="stack"><s class="cr" style="width:' + pa + '%"></s><s class="pf" style="width:' + (100 - pa) + '%"></s></div>' +
        '<div class="leg"><div>' + esc(r[0][0] + ' ' + r[0][1]) + '<span>' + esc(r[0][2] || '') + '</span></div><div class="p">' + esc(r[1][0] + ' ' + r[1][1]) + '<span>' + esc(r[1][2] || '') + '</span></div></div></div></div>';
    },
    'c-num': function (c, d) {
      var p = lines(c.b), big = p[0] && p[0].length <= 3 ? p[0] : '';
      return '<div class="k CN"><svg class="corner" viewBox="0 0 300 300"><path d="M300 0v300L120 0z" fill="#13213b"/><path d="M300 40v220L160 40z" fill="#2455f5"/></svg>' +
        '<div class="eyebrow">BenePip<br>Broker Guide</div>' + (c.k ? '<div class="kicker" style="margin-top:90px">' + esc(c.k) + '</div>' : '') + '<h1' + (c.k ? ' style="margin-top:22px"' : '') + '>' + hi(c.t) + '</h1>' +
        (big ? '<div class="bign">' + esc(big) + '</div><div class="tags">' + p.slice(1, 4).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>'
          : '<div class="art" style="position:absolute;width:520px;height:520px;left:96px;bottom:120px">' + icon(c.icon || 'wallet') + '</div>') + logo() + '</div>';
    },
    'c-state': function (c, d) {
      var r = rowsOf(c.b); if (r.length < 2) return plainCover(c, d);
      var st = function (x, k) { return '<div class="st ' + k + '"><div class="lb"><i></i>' + esc(x[0]) + '</div><b>' + esc(x[1] || '') + '</b><span>' + esc(x[2] || '') + '</span></div>'; };
      return '<div class="k CD">' + logo() + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' + st(r[0], 'off') + st(r[1], 'on') + '</div>';
    }
  };

  // ── 가운데·마지막 장 ──
  var head = function (c) { return c.k ? '<div class="head"><span class="chip">' + esc(c.k) + '</span></div>' : ''; };
  var note = function (c) { return c.n ? '<div class="src">' + txt(c.n) + '</div>' : ''; };
  var desc = function (s) { return s ? '<div class="desc">' + txt(s) + '</div>' : ''; };
  var LAY = {
    body: function (c) { return '<h2>' + hi(c.t) + '</h2>' + desc(lines(c.b).join('\n')) + note(c); },
    big: function (c) { return '<div class="stmt">' + hi(c.t) + '</div>' + (c.b ? '<div class="stmt-sub">' + txt(c.b) + '</div>' : '') + note(c); },
    vs: function (c) {
      var r = rowsOf(c.b); if (r.length < 2) return LAY.body(c);
      var h = r.shift(), col = function (k, on) { return '<div' + (on ? ' class="on"' : '') + '><h3>' + esc(h[k * 2] || '') + '<small>' + esc(h[k * 2 + 1] || '') + '</small></h3>' + r.map(function (x) { return '<p><em>' + esc(x[0]) + '</em>' + esc(x[k + 1] || '') + '</p>'; }).join('') + '</div>'; };
      return '<h2>' + hi(c.t) + '</h2><div class="vs">' + col(0, 1) + col(1, 0) + '</div>' + note(c);
    },
    table: function (c) {
      var r = rowsOf(c.b); if (!r.length) return LAY.body(c);
      return '<h2>' + hi(c.t) + '</h2>' + desc(plainOf(c.b).join('\n')) + '<div class="tbl">' + r.map(function (x) { return '<div style="grid-template-columns:repeat(' + x.length + ',1fr)">' + x.map(function (y) { var s = star(y); return '<span' + (s[0] ? ' class="hi"' : '') + '>' + esc(s[1]) + '</span>'; }).join('') + '</div>'; }).join('') + '</div>' + note(c);
    },
    steps: function (c) {
      var r = lines(c.b).map(cells);
      return '<h2>' + hi(c.t) + '</h2><div class="steps">' + r.map(function (x, k) { return '<div' + (k === 0 ? ' class="on"' : '') + '><i>' + (k + 1) + '</i><div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<span>' + esc(x[1]) + '</span>' : '') + '</div></div>'; }).join('') + '</div>' + note(c);
    },
    flow: function (c) {
      var l = lines(c.b), q = l.filter(function (x) { return x.indexOf('|') >= 0; }).map(cells), end = l.filter(function (x) { return x.indexOf('|') < 0; })[0];
      return '<h2>' + hi(c.t) + '</h2><div class="flow">' + q.map(function (x) { return '<div class="fr"><div class="fq">' + esc(x[0]) + '</div><div class="fa"><small>아니오</small>' + esc(x[1] || '') + '</div></div><div class="yes">예 ↓</div>'; }).join('') + (end ? '<div class="end">' + esc(end) + '</div>' : '') + '</div>' + note(c);
    },
    stat: function (c) {
      var l = plainOf(c.b), r = rowsOf(c.b), big = l[0] || '', m = big.match(/^([$₩]?[\d.,]+)(.*)$/), max = Math.max.apply(null, r.map(function (x) { return num(x[1]); }).concat([1]));
      return '<h2>' + hi(c.t) + '</h2><div class="stat"><span class="n">' + esc(m ? m[1] : big) + '</span><span class="u">' + esc(m ? m[2].trim() : '') + '</span></div>' + (l[1] ? '<div class="stat-cap">' + txt(l.slice(1).join('\n')) + '</div>' : '') +
        (r.length ? '<div class="bars">' + r.map(function (x) { var s = star(x[0]); return '<div' + (s[0] ? ' class="on"' : '') + '><span>' + esc(s[1]) + '</span><s style="width:' + Math.max(4, Math.round(num(x[1]) / max * 100)) + '%"></s><em>' + esc(x[1] || '') + '</em></div>'; }).join('') + '</div>' : '') + note(c);
    },
    calc: function (c) {
      var r = rowsOf(c.b); if (!r.length) return LAY.body(c);
      var last = r.pop();
      return '<h2>' + hi(c.t) + '</h2><div class="calc">' + r.map(function (x) { return '<div><span>' + esc(x[0]) + '</span>' + esc(x[1] || '') + '</div>'; }).join('') + '<div class="eq"><span>' + esc(last[0]) + '</span><b>' + esc(last[1] || '') + '</b></div></div>' + note(c);
    },
    ui: function (c) {
      var r = rowsOf(c.b), p = plainOf(c.b);
      return '<h2>' + hi(c.t) + '</h2><div class="ui"><div class="bar"><span>' + esc(p[0] || '화면') + '</span><span>예시 화면</span></div>' + r.map(function (x) { var s = star(x[0]); return '<div class="row' + (s[0] ? ' hl' : '') + '"><span>' + esc(s[1]) + '</span>' + (s[0] ? '<b>' + esc(x[1] || '') + '</b>' : esc(x[1] || '')) + '</div>'; }).join('') + '</div>' + (c.n ? '<div class="ui-tip">' + txt(c.n) + '</div>' : '');
    },
    qa: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="qa">' + rowsOf(c.b).map(function (x) { return '<p class="q">' + esc(x[0]) + '</p><p class="a">' + esc(x[1] || '') + '</p>'; }).join('') + '</div>' + note(c); },
    warn: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="warn">' + lines(c.b).map(cells).map(function (x) { return '<div>' + esc(x[0]) + (x[1] ? '<em>' + esc(x[1]) + '</em>' : '') + '</div>'; }).join('') + '</div>' + note(c); },
    event: function (c) {
      var l = lines(c.b), w = cells(l[0] || ''), r = l.slice(1).filter(function (x) { return x.indexOf('|') >= 0; }).map(cells), look = l.filter(function (x) { return /^[-·•]/.test(x); }).map(function (x) { return x.replace(/^[-·•]\s*/, ''); });
      return '<h2>' + hi(c.t) + '</h2><div class="ev"><div class="when"><small>' + esc(w[0] || '') + '</small><b>' + esc(w[1] || '') + '</b><span>한국 시간</span></div><div class="what">' + r.slice(0, 4).map(function (x) { return '<div><span>' + esc(x[0]) + '</span>' + esc(x[1] || '') + '</div>'; }).join('') + '</div></div>' +
        (look.length ? '<div class="look"><h4>발표 전후로 볼 것</h4>' + look.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>' : '') + note(c);
    },
    check: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="list">' + lines(c.b).map(cells).map(function (x) { return '<div><i>✓</i>' + esc(x[0]) + (x[1] ? '<em>' + esc(x[1]) + '</em>' : '') + '</div>'; }).join('') + '</div>' + note(c); },
    reason: function (c, d, i) {
      var p = plainOf(c.b), r = rowsOf(c.b), no = 0;
      for (var k = 1; k <= i; k++) if ((d.cards[k] || {}).layout === 'reason') no++;
      return '<div class="rn">' + no + '</div><h2>' + hi(c.t) + '</h2>' + desc(p.join('\n')) + (r.length ? '<div class="uic">' + r.map(function (x) { return '<div class="lrow"><b>' + esc(x[0]) + '</b>' + (x[1] ? pill(x[1]) : '') + '</div>'; }).join('') + '</div>' : '') + note(c);
    },
    route: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="route">' + rowsOf(c.b).map(function (x) { return '<div><span>' + esc(x[0]) + '</span><i>→</i><span>' + esc(x[1] || '') + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '</span></div>'; }).join('') + '</div>' + note(c); },
    'e-checks': function (c) { return '<h2>' + hi(c.t) + '</h2><div class="checks">' + lines(c.b).map(cells).map(function (x) { return '<div><i></i><div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<span>' + esc(x[1]) + '</span>' : '') + '</div></div>'; }).join('') + '</div>' + note(c); },
    'e-msg': function (c) { return '<h2>' + hi(c.t) + '</h2><div class="msg">' + esc(c.b).replace(/\[([^\]\n]{1,30})\]/g, '<u>$1</u>').replace(/\n/g, '<br>') + '</div>' + (c.n ? '<div class="msg-ko">' + txt(c.n) + '</div>' : ''); },
    'e-timeline': function (c) {
      var l = lines(c.b), r = l.filter(function (x) { return x.indexOf('|') >= 0; }).map(cells), key = -1;
      r.forEach(function (x, k) { if (star(x[0])[0] && key < 0) key = k; });
      var pre = l.filter(function (x) { return /^전\s*:/.test(x); })[0], post = l.filter(function (x) { return /^후\s*:/.test(x); })[0];
      return '<h2>' + hi(c.t) + '</h2><div class="tl" style="grid-template-columns:repeat(' + Math.max(r.length, 1) + ',1fr)">' + r.map(function (x, k) { return '<div class="' + (k === key ? 'key' : key >= 0 && k > key ? 'on' : '') + '"><i></i><b>' + esc(star(x[0])[1]) + '</b><span>' + esc(x[1] || '') + '</span></div>'; }).join('') + '</div>' +
        (pre || post ? '<div class="tl-span"><div class="a">' + esc((pre || '').replace(/^전\s*:\s*/, '')) + '</div><div class="b">' + esc((post || '').replace(/^후\s*:\s*/, '')) + '</div></div>' : '') + note(c);
    },
    'e-fill': function (c) {
      var l = lines(c.b), last = l.pop();
      return '<h2>' + hi(c.t) + '</h2><div class="fill">' + l.map(function (x) { return '<div><span>' + esc(x) + '</span><div><u></u></div></div>'; }).join('') + (last ? '<div class="tot"><span>' + esc(last) + '</span><div><u></u></div></div>' : '') + '</div>' + note(c);
    },
    'e-sum': function (c) { return '<h2>' + hi(c.t) + '</h2><div class="recap">' + lines(c.b).map(cells).map(function (x, k) { return '<div><i>' + (k + 1) + '</i>' + esc(x[0]) + (x[1] ? '<em>' + esc(x[1]) + '</em>' : '') + '</div>'; }).join('') + '</div>'; }
  };

  // 카드 한 장 HTML (1080×1350)
  var card = function (d, i, opt) {
    opt = opt || {};
    var n = d.cards.length, c = d.cards[i] || {}, L = kindOf(d, i);
    if (i === 0) return (COVER[L] || plainCover)(c, d);
    var last = i === n - 1, dark = DARK[d.group] && L !== 'e-sum';
    var cls = L === 'e-sum' ? 'sum' : dark ? 'dark' : L === 'big' ? 'big' : L === 'reason' ? 'rs' + (i % 2 ? '' : ' soft') : (i % 3 === 2 ? 'soft' : '');
    var risk = last && d.disclaimer ? '<div class="risk">' + esc(d.disclaimer) + '</div>' : '';
    return '<div class="k P ' + cls + ' L-' + L + (risk ? ' has-risk' : '') + '">' + logo(L === 'e-sum' || dark) + (L === 'big' ? '' : head(c)) + LAY[L](c, d, i) + risk + '<div class="pg">' + (i + 1) + ' / ' + n + '</div></div>';
  };

  // 넘치면 글자 크기를 조금씩 줄여 맞춤 (렌더러·미리보기 공통, 화면에 붙인 뒤 호출)
  var fit = function (k) {
    if (!k || k.dataset.fit) return; k.dataset.fit = '1';
    var limit = 1350 - (k.classList.contains('has-risk') ? 200 : 130);
    var parts = [].slice.call(k.children).filter(function (e) { return !/^(logo|pg|src|risk|rn|art|corner|save)$/.test(e.className.split(' ')[0]) && getComputedStyle(e).position !== 'absolute'; });
    var bottom = function () { return Math.max.apply(null, parts.map(function (e) { return e.offsetTop + e.offsetHeight; }).concat([0])); };
    for (var z = 1; z > 0.72 && bottom() > limit; z -= 0.04) parts.forEach(function (e) { e.style.zoom = z.toFixed(2); });
  };
  var fitAll = function (root) { [].forEach.call((root || document).querySelectorAll('.v3c .k.P'), fit); };

  return { card: card, fit: fit, fitAll: fitAll, kindOf: kindOf, coverType: coverType, COVER_OF: COVER_OF, COVER_ALT: COVER_ALT, COVERS: COVERS, BODY: BODY, ENDS: ENDS, HINT: HINT, esc: esc };
})();
if (typeof globalThis !== 'undefined') globalThis.BPCards = BPCards;
