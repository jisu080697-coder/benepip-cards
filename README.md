# BenePip 카드뉴스 렌더러

초안 JSON을 받아 실제 크롬으로 카드뉴스 PNG(2160×2700)를 만듭니다.

- `templates/card.css` 카드 디자인
- `render.mjs` 렌더러 (`node render.mjs samples/d1.json`)
- `.github/workflows/render.yml` 자동 렌더링 (repository_dispatch `render`)
- `cards/{초안 id}/` 렌더링 결과 (인스타 발행용 공개 주소)
