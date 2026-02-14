### MadMed

#### Why did we make?
I need to give medication to my 13-year-old cat Domingo every 12 hours. My partner and I were keep asking each other "Have you give him the med?"
We sometimes take care of neighbour's furry friends. And some of them take medication. We ask each other same questions every morning and evening.
This made us confusing and mad sometimes. 🤯 I built this app to reduce unnecessary check-up ping-pong in my pacific zoo. 

#### How to use:
1. 처음에 앱을 다운로드 후
2. 구글 로그인으로 계정 만들기 (MVP = id 지정 익명 로그인 -> 나중에 google 계정 연결 예정)
3. 하우스홀드 아이디 유무 물어본 후 없다면 등록
4. 해당 하우스 홀드 아이디 안에 펫 등록
5. 펫의 약 등록
6. 약의 스케줄 등록
7. 알림 설정
8. 디바이스에서 알림 울림
9. 약을 먹인 후 알림을 누르고 앱을 들어가면 투약했다고 표시할 수 있음
10. 알림 시간에서 15분이 지난 후에도 투약 표시가 되지 않는다면 알림이 다시 울리게 됨
11. 다른 사용자가 구글 로그인으로 계정 만든 후
12. 이미 등록된 하우스홀드 아이디를 입력하면 해당 하우스홀드의 펫 정보가 불러와 자동 등록됨
13. 펫, 알림 설정 및 정보 모두 동기화 됨 
14. 투약 여부는 23시간 마다  초기화되고, 투약 여부 로그 기록함


#### Tech Stack:
Vite 로 프로젝트 생성, 빌드
React + TypeScript 로 작성 + React Router
PWA setting, manifest, service worker setting, web push setting
Cloud Firestore
Firebase Cloud Messaging
PWA 용으로 배포 via Firebase Hosting, Cloud Functions/Run, Cloud Scheduler

#### Data Flow:
사용자가 약 스케줄 등록
서버 DB에 저장
서버 크론이 주기적으로 실행
“지금 알림 대상인가?” 판단
대상 사용자들의 pushToken 조회
FCM(Web Push) 발송
아이폰에 알림 표시
📌 알림 예약이라는 개념이 없음
서버(Cloud Functions)가 주기적으로 돌면서
→ “지금 보내야 하면 지금 보낸다”


#### Some Notes:
[PWA (iPhone)]
  - 알림 권한
  - pushToken 등록
  - 투약 체크 UI

[Firebase]
  - Firestore (schedule)
  - Auth (익명/household)
  - FCM (Web Push)

[Server Cron]
  - 시간 판단
  - 푸시 발송

[PWA 클라이언트]
   |
   | (읽기/쓰기)
   v
[Database]
   ^
   | (관리자 권한)
   |
[Netlify Functions]
   |
   | (FCM 요청)
   v
[Firebase Cloud Messaging]


#### WIP...
MadMed PWA React 컴포넌트 설계 + 페이지 흐름 + 상태 관리(useState/useReducer/Context)
MadMed PWA(React+TS) + Firestore + Auth(익명→구글 연결) + FCM(Web Push) + (크론) Cloud Functions


#### Known Issues
- Push notification delay?
- No foreground push notification
- UX: Raw time zone from IANA DB
- UX: medication 화면에서 save 를 누르면 notification (FCM) 권한 주기

#### File Tree
madmed/
  .gitignore
  package.json            # 루트 워크스페이스용
  yarn.lock
  .yarnrc.yml
  .yarn/                  # Yarn Berry (releases/plugins 등)
  firebase.json
  .firebaserc

  apps/
    web/                  # Vite + React + TS (PWA) => front
      package.json
      vite.config.ts
      src/
      public/

  functions/              # Firebase Functions (TS) => serverless; 서버 키 필요(FCM 발송/크론 판단)
    package.json
    tsconfig.json
    src/
      index.ts
      jobs/               # cron/scheduler 관련
      fcm/                # push sending
      firestore/          # db access helpers

  packages/               # 공유 코드(타입/유틸); 프론트와 functions가 같은 타입/유틸을 쓰게 해줌 (버그 감소)
    shared/
      package.json
      src/
        types.ts
        time.ts
        validation.ts
     
#### TECH DEBT
- Corepack in Node?
- Yarn workspaces
- 약 주인 누구인지 알려주기
    

#### 재배포 
1. `yarn build` in apps/web
2. `npm run build` in functions
3. `firebase deploy` in root