# LuvMoment

사진과 짧은 영상을 선택하고 음악·테마를 더해 세로형 MP4를 만드는 무료 모바일 웹 앱입니다.

공개 서비스: https://luvmoment.vercel.app

공개 저장소: https://github.com/mouseco/luvmoment

## 사용 방법

1. 사진과 영상을 3~30개 선택하고 순서를 조정합니다.
2. Love·Anniversary·Travel 테마, 인트로 스타일, BGM을 선택합니다. 음악 버튼으로 미리 듣거나 정지할 수 있습니다.
3. 인트로 제목과 부제목을 입력하고 영상 만들기를 실행합니다.
4. 완성된 영상을 재생한 뒤 저장하거나 공유합니다. 파일 공유를 지원하지 않는 브라우저에서는 다운로드합니다.

사진과 영상은 브라우저에서 처리하며 서버로 업로드하지 않습니다. 선택 내용은 메모리에만 있으므로 새로고침·탭 종료 시 사라집니다. 저장할 영상은 먼저 다운로드하십시오.

## 실행과 검증

Node.js 22와 npm을 사용합니다. 이 README가 있는 저장소 루트에서 실행하십시오.

```powershell
npm ci
npm run dev
```

개발 주소는 http://localhost:3000 입니다.

```powershell
npm test
npm run lint
npm run build
npm start
```

`npm test`는 Node.js 내장 테스트 러너로 파일 URL 해제와 에셋 순서·개수 경계를 검증합니다. 브라우저에서는 사진·영상 혼합 선택, 터치 정렬·삭제, BGM 재생·정지, 인트로 수정, 영상 생성·재생·다운로드와 오류 복구를 확인하십시오.

## 구조

- `src/app/`: 홈, 업로드, 스타일, 미리보기 화면
- `src/store/useAppStore.ts`: 선택한 에셋과 편집 설정
- `src/lib/videoGenerator.ts`: Canvas 프레임 생성과 Mediabunny MP4 인코딩
- `src/lib/video/`: BPM, 레이아웃, 효과, 프레임 탐색, 리소스 관리
- `public/bgm/`: 기본 음악
- `tests/`: 회귀 테스트

## 브라우저와 제약

- HTTPS 환경과 H.264/AAC 인코딩을 지원하는 브라우저가 필요합니다. 우선 최신 Chrome 또는 Edge에서 사용하십시오.
- 출력은 1080×1920, 30fps MP4입니다. 생성 시간은 파일 크기·길이와 기기 성능에 따라 달라집니다.
- 입력 형식 지원은 브라우저의 이미지·영상 디코더에 따릅니다. HEIC 변환 기능은 없습니다.
- 로그인, 결제, 클라우드 저장 기능은 없습니다.

## 무료 공개 배포

Vercel Hobby 계정의 기본 도메인을 사용하며 별도 데이터베이스나 API 키가 필요하지 않습니다. Hobby는 개인·비상업용 요금제이며 사용량 한도가 있습니다. [공식 요금제 안내](https://vercel.com/docs/plans/hobby)

자신의 Vercel 프로젝트에 연결한 뒤 배포할 때:

```powershell
npm test
npm run lint
npm run build
vercel deploy --prod --yes
```

배포 후 홈과 각 화면, BGM 요청의 HTTP 응답 및 실제 MP4 다운로드를 확인하십시오. 테스트 자료·로그·인증 파일은 배포하지 않습니다.
