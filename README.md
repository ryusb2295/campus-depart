# 나갈시간

React 19 + Astryx 대학생 통학 PWA.

`npm ci` → `npm run dev`

`npm test` / `npm run build`

GitHub Pages: Settings > Pages > Source: GitHub Actions.

공식 열차 API 조회에는 별도 HTTPS Node 서버가 필요합니다. `npm start`로 실행하고 저장소 Actions 변수 VITE_TRANSIT_API_URL에 서버의 /api/transit 주소를 설정하세요. 서버 미설정 시 열차 조회는 동작하지 않습니다. 도착시각은 입력한 이동시간 기준 추정이며 실시간 지연 및 환승은 미지원입니다.
