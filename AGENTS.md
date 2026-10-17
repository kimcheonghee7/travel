# AGENTS.md — 여행지·숙소 예약 웹 프로젝트 공통 작업 지침

## 1. 프로젝트 목표
HTML, CSS, 순수 JavaScript로 반응형 여행지 소개 및 주변 숙소 예약 웹사이트의 실제 동작하는 MVP를 구현한다. 데이터베이스는 Firebase Realtime Database를 사용하며, 소스 관리와 배포는 GitHub → Vercel 순서로 진행한다.

이 문서는 프로젝트 전반에 적용되는 공통 작업 규칙이다. 화면·기능·데이터 요구사항은 `PRD.md`를 기준으로 한다.

## 2. 기술 스택과 금지 사항
- 화면: 시맨틱 HTML5
- 스타일: CSS3
- 동작: 순수 JavaScript(ES modules 사용 가능)
- 데이터: Firebase Realtime Database
- 인증: Firebase Authentication을 우선 사용한다. 비밀번호를 Realtime Database에 저장하거나 직접 검증하지 않는다.
- 로컬 개발 서버: Python 내장 HTTP 서버(`python -m http.server`)를 사용한다. 정적 파일을 제공하는 개발용 서버이며, 애플리케이션 백엔드는 별도로 구현하지 않는다.
- 배포: GitHub 저장소와 Vercel 정적 배포
- 프레임워크, UI 라이브러리, 프런트엔드 빌드 도구를 임의로 추가하지 않는다. 프로젝트에서 명시적으로 합의한 경우에만 변경한다.
- 서버 비밀키, 관리자 비밀값, 서비스 계정 키를 브라우저 코드나 Git 저장소에 넣지 않는다.

### 로컬 서버 실행 규칙
- 프로젝트 루트에서 `python --version` 또는 `py --version`으로 Python 설치를 확인한다.
- PowerShell에서 프로젝트 루트로 이동한 뒤 `python -m http.server 8000`으로 실행한다. `python` 명령을 찾을 수 없는 Windows 환경에서는 `py -m http.server 8000`을 사용한다.
- 브라우저에서 `http://localhost:8000`을 열어 확인한다. ES modules 및 Firebase 연동은 `file://`로 직접 열지 말고 HTTP 서버를 통해 확인한다.
- 서버를 종료할 때는 실행 중인 터미널에서 `Ctrl+C`를 누른다. 기본 포트 8000이 사용 중이면 다른 포트(예: 8080)를 지정하고 브라우저 주소도 일치시킨다.
- Python 내장 서버는 로컬 정적 파일 확인을 위한 개발 서버다. 인증·데이터 권한·예약 검증을 대신하지 않으며 인터넷에 공개하거나 운영 서버로 사용하지 않는다.
- Vercel 배포는 정적 사이트 배포로 유지한다. 별도의 Python 백엔드, API 서버 또는 프레임워크를 추가하지 않는다. 추후 서버 기능이 필요하면 범위와 배포 구성을 별도로 합의한다.

## 3. 파일·폴더 구조 규칙
반드시 다음 위치 규칙을 지킨다.

```text
project-root/
├── index.html                 # 유일한 루트 HTML 진입점
├── AGENTS.md
├── PRD.md
├── README.md
├── .gitignore
├── firebase.json              # Realtime Database Rules 배포 설정
├── database.rules.json        # Realtime Database 보안 규칙
├── vercel.json                # 필요한 경우에만
├── html/                      # index.html을 제외한 모든 HTML 화면
│   ├── destinations.html
│   ├── destination-detail.html
│   ├── stays.html
│   ├── stay-detail.html
│   ├── login.html
│   ├── signup.html
│   ├── my-reservations.html
│   ├── reservation.html
│   ├── admin-login.html
│   ├── admin.html
│   ├── reservation-detail.html
│   ├── reservation.html
│   ├── admin-login.html
│   ├── admin.html
│   └── admin/
│       ├── dashboard.html
│       ├── destinations.html
│       ├── stays.html
│       ├── members.html
│       └── reservations.html
├── css/                       # 모든 CSS 파일
│   ├── reset.css
│   ├── common.css
│   ├── layout.css
│   ├── components.css
│   ├── pages.css
│   └── admin.css
├── js/                        # 모든 JavaScript 파일
│   ├── firebase-config.js
│   ├── firebase-init.js
│   ├── auth-service.js
│   ├── site-auth.js
│   ├── signup.js
│   ├── login.js
│   ├── admin-login.js
│   ├── admin.js
│   ├── reservation.js
│   ├── my-reservations.js
│   ├── auth-service.js
│   ├── site-auth.js
│   ├── signup.js
│   ├── login.js
│   ├── admin-login.js
│   ├── admin.js
│   ├── reservation.js
│   ├── my-reservations.js
│   ├── auth.js
│   ├── guards.js
│   ├── utils.js
│   ├── navigation.js
│   ├── destinations.js
│   ├── stays.js
│   ├── reservations.js
│   └── admin/
│       ├── dashboard.js
│       ├── destinations-admin.js
│       ├── stays-admin.js
│       ├── members-admin.js
│       └── reservations-admin.js
└── assets/
    ├── images/
    └── icons/
```

규칙:
1. `index.html`만 프로젝트 루트에 둔다. 그 외 모든 HTML 파일은 `html/` 아래에 둔다.
2. CSS는 전부 `css/`, JavaScript는 전부 `js/` 아래에 둔다.
3. 하위 폴더의 HTML에서 루트 파일을 참조할 때 상대경로를 정확하게 계산한다. 예: `../css/common.css`, `../js/firebase-init.js`; `html/admin/`에서는 `../../css/admin.css`, `../../js/admin/dashboard.js`.
4. `index.html`의 경로는 `css/common.css`, `js/...`처럼 루트 기준 상대경로를 사용한다.
5. 파일을 새로 만들거나 이동한 후 모든 링크, CSS, 스크립트, 이미지 경로를 확인한다.
6. JavaScript는 HTML에 인라인으로 길게 작성하지 말고 외부 파일로 분리한다. HTML의 이벤트 핸들러 속성(`onclick` 등)은 사용하지 않고 `addEventListener`를 사용한다.
7. 파일명은 소문자 kebab-case를 기본으로 한다.

## 4. 반응형·접근성·사용성
- 모바일 우선으로 설계하고 휴대전화, 태블릿, 데스크톱에서 확인한다.
- 고정 폭 레이아웃을 피하고 Flexbox/Grid, 유연한 너비, 적절한 미디어 쿼리를 사용한다.
- 가로 스크롤이 페이지 전체에 생기지 않도록 한다. 데이터 표는 작은 화면에서 카드형 목록 또는 표 전용 가로 스크롤을 제공한다.
- 메뉴·버튼·입력창은 터치하기 충분한 크기로 만들고, 본문 글자와 대비를 확보한다.
- 입력 필드에는 명확한 label, 오류 설명, 필수 여부를 제공한다. 키보드 포커스 표시를 숨기지 않는다.
- 이미지에는 의미 있는 대체 텍스트를 제공하고, 장식 이미지는 빈 alt를 사용한다.
- 예약·삭제·상태 변경 등 중요한 작업은 결과 메시지와 확인 단계를 제공한다.
- 로딩, 빈 목록, 성공, 실패 상태를 각각 설계한다.

## 5. 데이터·보안 원칙
- Realtime Database는 관계형 SQL 테이블이 아니라 JSON 트리다. PRD의 `destinations`, `stays`, `members`, `reservations`는 최상위 노드 이름으로 구현한다.
- 각 항목은 Firebase push ID 또는 고유 키를 사용한다. 데이터 객체에도 `id`를 저장해 화면 처리와 참조를 단순화한다.
- 모든 레코드에 가능한 한 `createdAt`, `updatedAt` 타임스탬프를 저장한다.
- 예약은 `memberId`, `destinationId`, `stayId`를 참조한다. 이름·숙소명 등은 예약 당시 표시를 위한 스냅샷으로 필요한 경우에만 함께 저장한다.
- 비밀번호는 절대 Realtime Database에 저장하지 않는다. Firebase Authentication UID를 회원 식별자로 사용한다.
- 관리자 권한은 화면에서 버튼을 숨기는 것만으로 보호되지 않는다. Realtime Database Security Rules에서 인증 UID와 관리자 권한을 검증한다.
- 관리자 권한을 클라이언트에서 임의로 부여할 수 있게 만들지 않는다. 최초 관리자는 Firebase Console에서 안전하게 지정하는 절차를 문서화한다.
- 클라이언트에 포함되는 Firebase 웹 설정은 일반적으로 비밀키가 아니지만, 보안은 Authentication과 Security Rules로 보장한다. 서비스 계정 키·Admin SDK 비밀값은 절대 클라이언트에 포함하지 않는다.
- 사용자 입력은 출력 시 안전하게 처리하고, HTML 문자열을 그대로 삽입하는 방식의 XSS 취약 구현을 피한다.
- 예약 생성·취소·상태 변경은 권한과 현재 상태를 검증한다. 클라이언트 검증만으로 재고나 중복 예약을 완전히 보장할 수 없음을 문서화한다.

## 6. 예약 기능의 최소 기준
- 로그인한 회원만 예약할 수 있다.
- 체크인/체크아웃 날짜를 입력받고, 체크아웃은 체크인 이후 날짜여야 한다.
- 인원 수는 1명 이상이어야 한다.
- 숙소가 선택한 여행지와 연결되어 있는지 확인한다.
- 예약에는 예약 상태와 생성·수정 시각을 기록한다.
- 예약 가능 여부를 검증하고, 겹치는 날짜의 중복 예약을 방지하는 로직을 구현한다. 클라이언트 전용 MVP의 동시성 한계는 README에 명시하고, 실제 운영 전에는 서버 측 검증 또는 안전한 트랜잭션 설계를 검토한다.
- 결제 기능은 이번 MVP 범위에 포함하지 않는다. 실제 결제가 없는 상태에서 결제가 완료된 것처럼 표시하지 않는다.
- 회원은 본인의 예약만 조회하고, 정책상 허용된 상태의 예약만 취소할 수 있다. 관리자는 전체 예약을 관리할 수 있다.

## 7. 관리자 대시보드
- 회원, 여행지, 숙소, 예약을 목록·상세·등록·수정·삭제(또는 비활성화)할 수 있게 한다.
- 목록에는 검색, 필터, 정렬, 페이지 단위 표시 또는 합리적인 대체 수단을 제공한다.
- 삭제 전에 확인을 받고, 예약과 연결된 여행지·숙소는 무결성이 깨지지 않도록 삭제 대신 비활성화하거나 참조 여부를 확인한다.
- 대시보드 요약 수치는 실제 데이터에서 계산한다. 임의의 예시 수치를 실데이터처럼 노출하지 않는다.
- 관리자 페이지의 모든 데이터 작업은 권한 확인과 오류 처리를 거친다.

## 8. 개발 진행 순서
1. 프로젝트 구조와 `AGENTS.md`, `PRD.md`를 검토한다.
2. Python 설치 여부를 확인하고 `python -m http.server 8000`(또는 Windows의 `py -m http.server 8000`)으로 로컬 실행 경로를 준비한다.
3. `index.html`과 공통 반응형 레이아웃을 만들고 HTTP 서버를 통해 확인한다.
4. Firebase 프로젝트 생성 및 Realtime Database·Authentication 설정을 준비한다.
5. Firebase 설정 파일과 환경별 설정 방법을 작성한다. 실제 값이 없으면 명시적 자리표시자를 사용하고 연결 완료라고 주장하지 않는다.
6. 데이터 구조와 Security Rules를 설계·검증한다.
7. 공개 여행지/숙소 조회 → 회원가입/로그인 → 예약 → 내 예약 → 관리자 CRUD 순서로 구현한다.
8. 반응형·권한·오류·예약 날짜 검증을 테스트한다.
9. GitHub에 올리기 전에 비밀값, 테스트 데이터, 불필요한 파일을 점검한다.
10. GitHub에 업로드한 뒤 Vercel 프로젝트를 연결하고 배포한다.
11. 배포 URL에서 주요 흐름을 실제로 확인한다.

## 9. 완료 기준
- 모든 파일이 정해진 폴더 규칙을 따른다.
- 주요 화면과 링크가 깨지지 않는다.
- 모바일/태블릿/데스크톱에서 핵심 기능을 사용할 수 있다.
- Firebase 연결 상태, 인증 실패, 데이터 로딩 실패가 사용자에게 명확하게 표시된다.
- 회원별 예약 접근 제어와 관리자 전용 접근 제어가 Security Rules로 보호된다.
- 예약 입력 검증, 중복 날짜 검사, 취소 상태 처리가 동작한다.
- README에 Python 로컬 서버 실행(`python -m http.server 8000` 및 Windows 대체 명령), Firebase 설정, 관리자 지정, 테스트, GitHub, Vercel 배포 절차가 기록되어 있다.
- 실제 검증하지 않은 기능을 완료했다고 표시하지 않는다.

## 10. 작업 방식
- 먼저 현재 파일과 기존 구현을 확인하고, 불필요한 구조 변경을 피한다.
- PRD에 정의된 MVP를 우선 구현한다. 요청하지 않은 기능을 임의로 확장하지 않는다.
- 작업 후 변경 파일, 구현한 기능, 테스트 결과, 미완료 항목, 사용자가 설정해야 할 값을 간단히 보고한다.
- Firebase 프로젝트·GitHub 저장소·Vercel 계정에 실제 접근 권한이 없으면 설정 파일과 절차를 준비하되, 원격 설정이 완료되었다고 주장하지 않는다.
