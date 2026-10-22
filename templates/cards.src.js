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
  var BODY = [['body', '기본 (제목 + 설명)'], ['big', '한 문장 크게'], ['vs', '두 칸 비교'], ['table', '표'], ['steps', '순서'], ['flow', '예/아니오 흐름'], ['stat', '큰 숫자 + 막대'], ['calc', '계산 상자'], ['ui', '앱 화면 조각'], ['qa', '묻고 답하기'], ['warn', '주의'], ['event', '발표 상세'], ['check', '체크리스트'], ['reason', '이유 (큰 번호)'], ['route', '경로 (→)'], ['myth', '오해 vs 사실']];
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
    event: '첫 줄 "날짜 요일 | 시각" · "항목 | 값" 2~4줄 · "- 볼 것" 1줄',
    check: '한 줄 = "항목 | 보조" (3~4개)', reason: '첫 줄 = 설명 · 다음 줄 "항목 | 상태" (선택)', route: '한 줄 = "출발 | 도착 | 보조"', myth: '첫 줄 = 흔한 오해 · 둘째 줄 = 사실 · 셋째 줄(선택) = 짧은 설명',
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
    if (i === n - 1) return isEnd(L) || L === 'body' ? L : 'e-sum';   // 형식이 안 맞아 기본 장으로 바뀐 마지막 장
    return isBody(L) ? L : 'body';
  };

  // ── 표지 ──
  var plainCover = function (c, d) {
    var p = lines(String(c.b || '').replace(/\s*\|\s*/g, ' · '));
    var art = { '혜택·적용 조건': 'gift', '거래비용·페이백': 'coin', '플랫폼 활용': 'chart', '브로커 이용 가이드': 'wallet', '베네핍 이용 안내': 'shield', '경제 캘린더·이벤트': 'calendar' }[d.group] || c.icon;
    return '<div class="k T1 CP">' + (art ? '<div class="art">' + icon(c.icon || art) + '</div>' : '') + logo() + (c.k ? '<div class="kicker">' + esc(c.k) + '</div>' : '') + '<h1>' + hi(c.t) + '</h1>' +
      (p.length ? '<div class="box"><div><b>' + txt(p[0]) + '</b>' + (p[1] ? '<span>' + txt(p[1]) + '</span>' : '') + '</div><i>›</i></div>' : '') + '</div>';
  };
  var COVER = {
    'c-plain': plainCover,
    // 표지: 제목 + 날짜 범위 + 지표 이름만 (자세한 시각은 가운데 장에서 · 피드백: 표지 정보 과다)
    'c-report': function (c, d) {
      var r = rowsOf(c.b), names = [];
      r.forEach(function (y) { var x = (y[1] || y[0] || '').trim(); if (x && names.indexOf(x) < 0) names.push(x); });
      return '<div class="k T6 CR2"><div class="mast"><span class="t">BenePip Weekly</span><span class="d">한국 시간</span></div>' +
        '<div class="kicker">' + esc(c.k || '이번 주 경제 캘린더') + '</div><h1>' + hi(c.t) + '</h1>' + (c.n ? '<div class="range">' + esc(c.n) + '</div>' : '') +
        '<div class="names">' + names.slice(0, 5).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
        '<div class="art">' + icon(c.icon || 'calendar') + '</div><div class="note">넘겨서 지표별로 보기 →</div></div>';
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
        r.map(function (x) { return '<div class="ln"><span>' + esc(x[0]) + '</span>' + esc(x.slice(1).join(' · ')) + '</div>'; }).join('') +
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
      // 한 줄 = 항목 · 금액 · 설명 (금액은 숫자가 든 칸, 순서가 바뀌어도 찾음)
      var row = function (x) { var k = -1; for (var j = 0; j < x.length; j++) if (k < 0 && /\d/.test(x[j])) k = j; var amt = k >= 0 ? x[k] : ''; return { lab: k === 0 ? x[0] : x[0] + (amt ? ' ' + amt : ''), amt: amt, desc: x.filter(function (y, j) { return j !== 0 && j !== k; }).join(' · ') }; };
      var A = row(r[0]), Bq = row(r[1]);
      var a = num(A.amt), b = num(Bq.amt), sum = a + b, cur = /\$|달러/.test(A.amt + Bq.amt) ? '$' : /원|₩/.test(A.amt + Bq.amt) ? '₩' : '', pa = sum ? Math.round(a / sum * 100) : 50;
      var amt = cur + sum.toLocaleString('en-US', { minimumFractionDigits: cur ? 2 : 0, maximumFractionDigits: 2 });
      return '<div class="k CF">' + logo() + '<div class="kicker">' + esc(c.k || d.group || '') + '</div><h1>' + hi(c.t) + '</h1>' +
        '<div class="uic bal"><div class="cap"><span>계좌 잔고</span><span>' + esc(c.n || '예시') + '</span></div>' + (sum ? '<div class="amt">' + esc(amt) + '</div>' : '') +
        '<div class="stack"><s class="cr" style="width:' + pa + '%"></s><s class="pf" style="width:' + (100 - pa) + '%"></s></div>' +
        '<div class="leg"><div>' + esc(A.lab) + '<span>' + esc(A.desc) + '</span></div><div class="p">' + esc(Bq.lab) + '<span>' + esc(Bq.desc) + '</span></div></div></div></div>';
    },
    'c-num': function (c, d) {
      var p = lines(c.b), m0 = String(p[0] || '').match(/^\d{1,2}/), big = m0 ? m0[0] : '';
      return '<div class="k CN">' +
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
    body: function (c) { var l = lines(String(c.b || '').replace(/\s*\|\s*/g, ' · ')); return '<h2>' + hi(c.t) + '</h2>' + (l[0] ? '<div class="lead">' + hi(l[0]) + '</div>' : '') + (l.length > 1 ? '<div class="pts">' + l.slice(1).map(function (x) { return '<div>' + txt(x) + '</div>'; }).join('') + '</div>' : '') + note(c); },
    big: function (c) { var sb = String(c.b || '').replace(/\s*\|\s*/g, ' · '); return '<div class="stmt">' + hi(c.t) + '</div>' + (sb ? '<div class="stmt-sub">' + txt(sb) + '</div>' : '') + note(c); },
    vs: function (c) {
      var r = rowsOf(c.b); if (r.length < 2) return LAY.body(c);
      var h = r.shift(); if (h.length === 3 && /^(항목|구분|기준|비교)$/.test(h[0])) h = [h[1], '', h[2], ''];
      var col = function (k, on) { return '<div' + (on ? ' class="on"' : '') + '><h3>' + esc(h[k * 2] || '') + '<small>' + esc(h[k * 2 + 1] || '') + '</small></h3>' + r.map(function (x) { return '<p><em>' + esc(x[0]) + '</em>' + esc(x[k + 1] || '') + '</p>'; }).join('') + '</div>'; };
      return '<h2>' + hi(c.t) + '</h2><div class="vs">' + col(0, 1) + col(1, 0) + '</div>' + note(c);
    },
    table: function (c) {
      var r = rowsOf(c.b); if (!r.length) return LAY.body(c);
      return '<h2>' + hi(c.t) + '</h2>' + desc(plainOf(c.b).join('\n')) + '<div class="tbl">' + r.map(function (x) { return '<div style="grid-template-columns:repeat(' + x.length + ',1fr)">' + x.map(function (y) { var s = star(y); return '<span' + (s[0] ? ' class="hi"' : '') + '>' + esc(s[1]) + '</span>'; }).join('') + '</div>'; }).join('') + '</div>' + note(c);
    },
    steps: function (c) {
      var r = lines(c.b).map(cells);
      return '<h2>' + hi(c.t) + '</h2><div class="steps">' + r.map(function (x, k) { return '<div' + (k === 0 ? ' class="on"' : '') + '><i>0' + (k + 1) + '</i><div><b>' + esc(x[0]) + '</b>' + (x[1] ? '<span>' + esc(x[1]) + '</span>' : '') + '</div></div>'; }).join('') + '</div>' + note(c);
    },
    flow: function (c) {
      var l = lines(c.b), q = l.filter(function (x) { return x.indexOf('|') >= 0; }).map(cells), end = l.filter(function (x) { return x.indexOf('|') < 0; })[0];
      return '<h2>' + hi(c.t) + '</h2><div class="flow">' + q.map(function (x) { return '<div class="fr"><div class="fq">' + esc(x[0]) + '</div><div class="fa"><small>아니오</small>' + esc(x[1] || '') + '</div></div><div class="yes">예 ↓</div>'; }).join('') + (end ? '<div class="end">' + esc(end) + '</div>' : '') + '</div>' + note(c);
    },
    stat: function (c) {
      var l = plainOf(c.b), r = rowsOf(c.b), big = l[0] || '', m = big.match(/^([$₩]?[\d.,]+)(.*)$/), max = Math.max.apply(null, r.map(function (x) { return num(x[1]); }).concat([1]));
      return '<h2>' + hi(c.t) + '</h2><div class="stat"><span class="n">' + esc(m ? m[1] : big) + '</span><span class="u">' + esc(m ? m[2].trim() : '') + '</span></div>' + (l[1] ? '<div class="stat-cap">' + txt(l.slice(1).join('\n')) + '</div>' : '') +
        (r.length && r.every(function (x) { return /\d/.test(x[1] || ''); }) ? '<div class="bars">' + r.map(function (x) { var s = star(x[0]); return '<div' + (s[0] ? ' class="on"' : '') + '><span>' + esc(s[1]) + '</span><s style="width:' + Math.max(4, Math.round(num(x[1]) / max * 100)) + '%"></s><em>' + esc(x[1] || '') + '</em></div>'; }).join('') + '</div>' : '') + note(c);
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
      var l = lines(c.b), w = cells(l[0] || ''), tm = String(w[1] || '').match(/\d{1,2}:\d{2}/) || String(c.b || '').match(/\d{1,2}:\d{2}/); w[1] = tm ? tm[0] : '';
      if (!/\d/.test(w[0] || '')) { var dt = String(c.b || '').match(/\d{1,2}\x2f\d{1,2}(\s*\(?[월화수목금토일]\)?)?/); w[0] = dt ? dt[0] : ''; }
      var r = l.slice(1).filter(function (x) { return x.indexOf('|') >= 0; }).map(cells), look = l.filter(function (x) { return /^[-·•]/.test(x); }).map(function (x) { return x.replace(/^[-·•]\s*/, ''); }).slice(0, 1);
      var get = function (k) { for (var i = 0; i < r.length; i++) if (k.test(r[i][0])) return r[i]; return null; };
      var fc = get(/예상/), pv = get(/이전/), base = get(/기준/), viz = '';
      var nv = function (x) { var m = String(x || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };
      if (fc && pv && nv(fc[1]) != null && nv(pv[1]) != null) {
        var a = nv(pv[1]), b = nv(fc[1]), base50 = base && nv(base[1]) != null ? nv(base[1]) : null;
        if (base50 != null) {   // 기준선이 있는 지표 (PMI 등): 게이지
          var lo = Math.min(a, b, base50) - 5, hi2 = Math.max(a, b, base50) + 5, pos = function (v) { return Math.round((v - lo) / (hi2 - lo) * 100); };
          viz = '<div class="gauge"><div class="bar"><i class="base" style="left:' + pos(base50) + '%"><em>' + esc(String(base50)) + '</em></i><i class="pv" style="left:' + pos(a) + '%"></i><i class="fc" style="left:' + pos(b) + '%"></i></div><div class="leg"><span class="pv">이전 ' + esc(pv[1]) + '</span><span class="fc">예상 ' + esc(fc[1]) + '</span><span>' + esc(base50 + ' 위 = 확장 · 아래 = 위축') + '</span></div></div>';
        } else {   // 물가·고용 등: 이전 → 예상 막대
          var mx = Math.max(Math.abs(a), Math.abs(b)) || 1;
          viz = '<div class="cmpbar"><div><span>이전</span><s style="width:' + Math.max(8, Math.round(Math.abs(a) / mx * 100)) + '%"></s><b>' + esc(pv[1]) + '</b></div><div class="on"><span>예상</span><s style="width:' + Math.max(8, Math.round(Math.abs(b) / mx * 100)) + '%"></s><b>' + esc(fc[1]) + '</b></div></div>';
        }
      }
      var info = r.filter(function (x) { return !(viz && /예상|이전|기준/.test(x[0])); }).slice(0, 3);
      return '<h2>' + hi(c.t) + '</h2><div class="ev"><div class="when"><small>' + esc(w[0] || '') + '</small><b>' + esc(w[1] || '') + '</b><span>한국 시간</span></div><div class="what' + (info.length <= 1 ? ' one' : '') + '">' + info.map(function (x) { return '<div><span>' + esc(x[0]) + '</span>' + esc(x[1] || '') + '</div>'; }).join('') + '</div></div>' + viz +
        (look.length ? '<div class="look"><h4>발표 전후로 볼 것</h4>' + look.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>' : '') + note(c);
    },
    check: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="list">' + lines(c.b).map(cells).map(function (x) { return '<div><i>✓</i>' + esc(x[0]) + (x[1] ? '<em>' + esc(x[1]) + '</em>' : '') + '</div>'; }).join('') + '</div>' + note(c); },
    reason: function (c, d, i) {
      var p = plainOf(c.b), r = rowsOf(c.b), no = 0;
      for (var k = 1; k <= i; k++) if ((d.cards[k] || {}).layout === 'reason') no++;
      return '<div class="rn">' + no + '</div><h2>' + hi(c.t) + '</h2>' + desc(p.join('\n')) + (r.length ? '<div class="uic">' + r.map(function (x) { return '<div class="lrow"><b>' + esc(x[0]) + '</b>' + (x[1] ? pill(x[1]) : '') + '</div>'; }).join('') + '</div>' : '') + note(c);
    },
    route: function (c) { return '<h2>' + hi(c.t) + '</h2><div class="route">' + rowsOf(c.b).map(function (x) { return '<div><span>' + esc(x[0]).replace(/(\S+·)/g, '<b style="white-space:nowrap;font:inherit;color:inherit">$1</b><wbr>') + '</span><i>→</i><span>' + esc(x[1] || '').replace(/(\S+·)/g, '<b style="white-space:nowrap;font:inherit;color:inherit">$1</b><wbr>') + (x[2] ? '<small>' + esc(x[2]) + '</small>' : '') + '</span></div>'; }).join('') + '</div>' + note(c); },
    myth: function (c) {
      var l = lines(c.b).map(function (x) { return x.replace(/^(오해|사실|MYTH|FACT)\s*[:|]\s*/i, '').replace(/\s*\|\s*/g, ' · '); });
      return '<h2>' + hi(c.t) + '</h2><div class="myth"><div><div class="lb"><span class="tg"></span>오해</div><p>' + txt(l[0] || '') + '</p></div><div class="fact"><div class="lb"><span class="tg"></span>사실</div><p>' + txt(l[1] || '') + '</p></div></div>' + (l[2] ? '<div class="myth-sub">' + txt(l.slice(2).join('\n')) + '</div>' : '') + note(c);
    },
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

  // 장식: 반짝이 · 손그림 화살표 · 빈 곳을 채우는 사물 · 저장 도장 (보일지는 fit 이 공간을 보고 정함)
  var OBJ = { body: 'bulb', big: 'target', vs: 'exchange', table: 'doc', steps: 'target', flow: 'search', stat: 'chart', qa: 'chat', warn: 'bell', event: 'clock', check: 'check', reason: 'search', route: 'exchange', myth: 'bulb', 'e-msg': 'chat', 'e-timeline': 'calendar', 'e-fill': 'calculator' };
  // 구성 변형 고르기 (디자인은 그대로, 배치만 레퍼런스 참고) · 같은 형식이라도 장 번호에 따라 섞음
  var cmpOf = function (c, L, i, d) {
    var ls = lines(c.b), n = ls.length, longest = Math.max.apply(null, ls.map(function (x) { return x.length; }).concat([0])), total = ls.join('').length;
    if (L === 'stat' || L === 'myth') return 'cmp-center';
    if (L === 'big') return i % 2 ? 'cmp-center' : '';
    if (L === 'calc') return 'cmp-bottom';
    if (L === 'event') { var k = 0; for (var j = 1; j < i; j++) if ((d.cards[j] || {}).layout === 'event') k++; return k % 2 ? 'cmp-ev2' : ''; }
    if ((L === 'check' || L === 'e-checks') && n >= 3 && n <= 4 && longest <= 30) return 'cmp-grid';
    if (L === 'body' && n <= 3 && total <= 80 && (c.icon || OBJ[L])) return 'cmp-right';
    return '';
  };
  var SPOT = { body: 1, warn: 1, qa: 1, steps: 1, check: 1, flow: 1, route: 1 };
  var VARY = { body: ['bulb', 'target', 'search', 'doc'], warn: ['bell', 'shield'], qa: ['chat', 'bulb'], steps: ['target', 'key'], check: ['check', 'shield'] };
  var deco = function (c, L, dark, cmp, i) {
    var ob = c.icon || (VARY[L] ? VARY[L][(i || 0) % VARY[L].length] : OBJ[L]);
    if (!ob) return '';
    if (cmp === 'cmp-right') return '<div class="obj">' + icon(ob, { dark: dark }) + '</div>';
    return SPOT[L] && !cmp ? '<div class="spot">' + icon(ob, { dark: dark }) + '</div>' : '';
  };

  // 카드 한 장 HTML (1080×1350)
  var card = function (d, i, opt) {
    opt = opt || {};
    var n = d.cards.length, c = d.cards[i] || {}, L = kindOf(d, i);
    if (i === 0) return (COVER[L] || plainCover)(c, d);
    var last = i === n - 1, dark = DARK[d.group] && L !== 'e-sum';
    var cls = L === 'e-sum' ? 'sum' : dark ? 'dark' : L === 'big' ? 'big' : L === 'reason' ? 'rs' + (i % 2 ? '' : ' soft') : (i % 3 === 2 ? 'soft' : ''), cmp = cmpOf(c, L, i, d);
    var ph = c.img && /^https?:/.test(c.img) && /^(body|big|qa|warn|check|myth)$/.test(L) ? '<div class="photo" style="background-image:url(' + esc(c.img) + ')"></div>' : '';
    if (ph) cmp = '';
    var risk = last && d.disclaimer ? '<div class="risk">' + esc(d.disclaimer) + '</div>' : '';
    return '<div class="k P ' + cls + ' ' + cmp + (c.img && ph ? ' has-photo' : SPOT[L] && !cmp && (c.icon || OBJ[L]) ? ' has-spot' : '') + ' L-' + L + (risk ? ' has-risk' : '') + '">' + logo(L === 'e-sum' || dark) + (L === 'big' ? '' : head(c)) + (ph ? (L === 'big' ? ph + LAY[L](c, d, i) : LAY[L](c, d, i).replace('</h2>', '</h2>' + ph)) : LAY[L](c, d, i)) + (ph ? '' : deco(c, L, dark || L === 'e-sum', cmp, i)) + risk + '<div class="pg">' + (i + 1) + ' / ' + n + '</div></div>';
  };

  // 형식 예시 (관리 화면 '형식 예시 보기' 팝업 · 숫자는 모두 예시)
  var SAMPLES = {
    'c-report': { g: '경제 캘린더·이벤트', c: { t: '이번 주 밤에\n차트 볼 날은 “사흘”', b: '수 | 영국 CPI | 15:00\n목 | 미국 실업수당 | 21:30\n금 | 미국 PMI | 22:45', n: '10월 넷째 주 · 한국 시간' } },
    'c-edit': { g: '플랫폼 활용', c: { k: 'MT5 처음 켰다면', t: '0.5랏으로 20pip,\n“원화로 얼마”일까?', b: '플랫폼 활용 · 계산 3단계', icon: 'calculator' } },
    'c-receipt': { g: '거래비용·페이백', c: { k: '페이백 계산 사례', t: '한 달 30랏 거래하면\n“페이백은 얼마?”', b: '10월 페이백 내역\n거래량 | 30랏\n랏당 페이백 | $3\n합계 | $90.00', n: '예시' } },
    'c-issue': { g: '거래비용·페이백', c: { k: '페이백 적립 체크', t: '페이백 신청했는데\n“적립이 안 된다면?”', b: '베네핍 · 페이백 내역\n9월 넷째 주 | 스탠다드 | $12.40 | 적립 완료\n10월 첫째 주 | 로우 스프레드 | $0.00 | 확인 필요\n10월 둘째 주 | 스탠다드 | — | 집계 중' } },
    'c-balance': { g: '혜택·적용 조건', c: { k: '혜택·적용 조건', t: '가입 크레딧으로\n번 수익, “출금\n가능할까?”', b: '크레딧 | $100 | 출금 안 돼요\n수익 | $30 | 조건 채우면 가능' } },
    'c-num': { g: '브로커 이용 가이드', c: { t: '해외 브로커 출금이\n“늦어지는 이유”', b: '3\n인증\n입금 수단\n증거금' } },
    'c-state': { g: '베네핍 이용 안내', c: { k: '베네핍 이용 안내', t: '페이백 적립 전,\n“UID 연결”이\n필요한 이유', b: 'UID 연결 전 | 거래해도 적립되지 않아요 | 누구의 거래인지 알 수 없어서\nUID 연결 후 | 그날 거래부터 적립돼요 | 브로커가 회원으로 인식' } },
    'c-plain': { g: '', c: { k: '머리말', t: '기본 표지\n“제목”만 크게', b: '아래 상자 첫 줄\n작은 설명' } },
    body: { k: '기본', t: '내 거래도\n“페이백 대상”일까요?', b: '적용되는 계좌 유형과 거래 상품을 확인하세요.\n최소 거래량이나 제외되는 거래 조건도 함께 살펴보세요.' },
    big: { t: '페이백은 수익이 아니라\n“거래 비용을 줄이는”\n쪽에 가까워요', b: '거래 결과와 상관없이 거래량 기준으로 쌓여요.' },
    vs: { k: '헷갈리는 것', t: 'UID와 계좌번호,\n“뭐가 달라요?”', b: 'UID | 회원 번호 | 계좌번호 | MT5 로그인\n뜻 | 회원 한 명당 하나 | 계좌마다 하나\n어디에 | 회원 페이지 프로필 | 계좌 목록' },
    table: { k: '저장용 계산표', t: '자주 쓰는 랏,\n“달러로 미리” 보기', b: 'EUR/USD | 10pip | 50pip\n0.01랏 | $1 | $5\n0.1랏 | $10 | $50\n1랏 | *$100 | *$500' },
    steps: { k: '계산 3단계', t: '랏 → 달러 → “원화”', b: '내 랏 크기 확인 | MT5 거래 탭의 볼륨\n움직인 pip 수 곱하기 | 랏 × pip × 10달러\n그날 환율 곱하기 | 원화로 바꿔 보기' },
    flow: { k: '어디서 막혔을까', t: '위에서부터\n“순서대로” 확인', b: 'UID가 연결돼 있나요? | 연결부터 하기\n그 계좌도 대상인가요? | 대상 계좌 확인\n지급일이 지났나요? | 다음 지급일 대기\n모두 예라면 베네핍에 문의' },
    stat: { k: '기준 숫자', t: 'EUR/USD 1랏,\n1pip 움직이면', b: '10달러\n가격이 0.0001 움직이면 10달러가 변해요.\n0.1랏 | 1달러\n*1랏 | 10달러' },
    calc: { k: '예시로 계산', t: '0.5랏으로\n“20pip” 움직였다면', b: '랏 × pip × 10달러 | 0.5 × 20 × 10\n× 환율 (예시) | 1,380원\n원화로 | 약 138,000원' },
    ui: { k: '어디서 찾나요', t: '회원 페이지\n“프로필”에 있어요', b: '내 프로필\n이름 | HONG GILDONG\n*회원 번호 (UID) | 8123 4567\n인증 상태 | 승인', n: '메뉴 이름은 브로커마다 달라요.' },
    qa: { k: '자주 묻는 것', t: '연결하다가\n막히는 순간', b: 'UID를 넣었는데 확인 중이에요 | 브로커 쪽 확인이 필요해요.\n계좌를 새로 만들면 다시 연결하나요? | 같은 UID 아래 계좌면 그대로예요.' },
    warn: { k: '놓치기 쉬운 것', t: '크레딧이\n“사라지는” 경우', b: '사용 기한이 지났어요 | 지급일부터 세는 곳이 많아요\n조건 전에 출금을 신청했어요 | 크레딧이 한꺼번에 빠질 수 있어요' },
    event: { k: '수요일 · 영국', t: '영국 “소비자물가”\n(CPI) 발표', b: '10/21 수 | 15:00\n영향 통화 | GBP\n중요도 | 높음\n- 파운드 쌍 스프레드가 넓어지는지' },
    check: { k: '발표 시간대 체크', t: '큰 발표 앞뒤로\n“이 세 가지”만 점검', b: '스프레드 확대 | 발표 직후\n증거금 여유 | 급변 대비\n대기 주문 위치 | 미끄러짐' },
    reason: { t: '인증이\n“승인이 아니에요”', b: '하나라도 검토 중이면 출금이 잠겨요.\n신분증 | 승인\n주소 증명 | 검토 중' },
    route: { k: '수단별 순서', t: '어디로\n“먼저” 돌아올까', b: '카드로 입금한 금액 | 카드로 먼저 환불 | 입금액까지만\n그 위의 수익 | 해외 송금 | 본인 명의만' },
    myth: { k: '흔한 오해', t: '페이백 받으면\n\u201c거래 비용\u201d이 늘어난다?', b: '페이백을 받으면 스프레드가 넓어진다\n스프레드·수수료는 그대로, 브로커 몫 일부를 돌려받는 구조예요\n계좌 유형별 스프레드는 브로커 페이지에서 같은 기준으로 비교할 수 있어요.' },
    'e-checks': { k: '캡처해두고 체크', t: '문의하기 전\n여기까지 했나요?', b: 'UID 연결 날짜 확인 | 그 전 거래는 적립 안 돼요\n계좌 유형 확인 | ECN은 다를 수 있어요\n거래 내역 캡처 | 같이 보내면 빨라요' },
    'e-msg': { k: '그래도 늦어진다면', t: '고객센터에\n“이렇게” 보내세요', b: 'Hello, I requested a withdrawal on [10/20] (ID [123456]). Could you tell me the current status? Thank you.', n: '밑줄 친 곳만 내 정보로 바꿔요.' },
    'e-timeline': { k: '예시로 보면', t: '언제 연결했는지가\n“적립 시작일”이에요', b: '10/1 | 가입\n10/5 | 첫 거래\n*10/8 | UID 연결\n10/9 | 거래\n전: 10/5 거래는 적립 안 됨\n후: 10/9 거래부터 적립' },
    'e-fill': { k: '내 숫자로', t: '캡처해두고\n“빈칸”만 채워 보세요', b: '한 달 거래량 (랏)\n× 랏당 페이백 ($)\n= 한 달 페이백' },
    'e-sum': { k: '한 장 요약', t: '이번 주\n“표시해 둘 시간”', b: '수 15:00 | 영국 CPI\n목 21:30 | 미국 실업수당\n금 22:45 | 미국 PMI' }
  };
  // 예시 카드 한 장 (where: 'cover' | 'body' | 'end')
  var sample = function (L, where) {
    var cv = { t: '표지', b: '' }, s = SAMPLES[L];
    if (!s) return '';
    if (where === 'cover') return card({ group: s.g, cards: [Object.assign({ layout: L }, s.c)] }, 0);
    var c = Object.assign({ layout: L }, s);
    return where === 'end' ? card({ group: '', cards: [cv, c] }, 1) : card({ group: '', cards: [cv, c, { t: '끝', b: '' }] }, 1);
  };

  // 넘치면 글자 크기를 조금씩 줄여 맞춤 (렌더러·미리보기 공통, 화면에 붙인 뒤 호출)
  var fit = function (k) {
    if (!k || k.dataset.fit) return; k.dataset.fit = '1';
    var limit = 1350 - (k.classList.contains('has-risk') ? 200 : 115);
    var parts = [].slice.call(k.children).filter(function (e) { return !/^(logo|pg|src|risk|rn|art|corner|save|spark|arrow|obj|stamp)$/.test(String(e.className.baseVal != null ? e.className.baseVal : e.className).split(' ')[0]) && getComputedStyle(e).position !== 'absolute'; });
    var box = k.getBoundingClientRect(), scale = box.height / 1350 || 1;
    var bottom = function () { return Math.max.apply(null, parts.map(function (e) { return (e.getBoundingClientRect().bottom - box.top) / scale; }).concat([0])); };
    // 넘치면 제목 아래 내용만 줄임 (제목 크기는 장마다 같게) · 그래도 넘치면 제목까지
    var inner = parts.filter(function (e) { return e.tagName !== 'H2' && !/^(head)$/.test(e.className); });
    for (var z = 1; z > 0.7 && bottom() > limit; z -= 0.04) inner.forEach(function (e) { e.style.zoom = (z - 0.04).toFixed(2); });
    if (bottom() > limit) parts.forEach(function (e) { if (!e.style.zoom) e.style.zoom = '0.9'; });
    // 구성별: 왼쪽 아래 사물이 있으면 그 위까지만 키움 · 위아래로 나눈 구성은 키우지 않음
    var cmpd = /cmp-(center|right|bottom|grid)/.test(k.className), cap = k.classList.contains('cmp-right') ? 900 : limit;
    // 글씨는 키우지 않음 (모든 장 같은 크기 체계) · 남는 공간은 아래에서 가운데 쪽으로 정리
    // 내용은 띄우지 않고 제목 바로 아래부터 (장마다 시작 높이가 같게 · 남는 공간은 품질 관문이 내용으로 채움)
  };
  // 제목이 짧아 오른쪽이 비면 손그림 화살표 (제목 끝 → 내용)
  var arrowFit = function (k) {
    var a = k.querySelector('.arrow'), h = k.querySelector('h2'); if (!a || !h || k.classList.contains('L-big')) return;
    var box = k.getBoundingClientRect(), sc = box.height / 1350 || 1, r = h.getBoundingClientRect();
    var range = document.createRange(); range.selectNodeContents(h); var tr = range.getBoundingClientRect();
    if ((tr.right - box.left) / sc < 1080 - 360) { a.style.top = ((r.bottom - box.top) / sc - 120) + 'px'; a.style.display = 'block'; }
  };
  var fitAll = function (root) { [].forEach.call((root || document).querySelectorAll('.v3c .k.P'), function (k) { var first = !k.dataset.fit; fit(k); if (first) arrowFit(k); }); };

  return { card: card, arrowFit: arrowFit, sample: sample, SAMPLES: SAMPLES, fit: fit, fitAll: fitAll, kindOf: kindOf, coverType: coverType, COVER_OF: COVER_OF, COVER_ALT: COVER_ALT, COVERS: COVERS, BODY: BODY, ENDS: ENDS, HINT: HINT, esc: esc };
})();
if (typeof globalThis !== 'undefined') globalThis.BPCards = BPCards;
