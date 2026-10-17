# 여행의 결

HTML, CSS, 순수 JavaScript와 Firebase Authentication·Realtime Database를 사용하는 여행지·숙소 예약 MVP입니다.

## 로컬 실행

프로젝트 루트에서 Python 내장 HTTP 서버를 실행합니다.

```powershell
python -m http.server 8000
```

Windows에서 `python` 명령을 사용할 수 없지만 Python Launcher가 설치되어 있으면 다음 명령을 사용합니다.

```powershell
py -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 열고, 서버를 종료하려면 터미널에서 `Ctrl+C`를 누릅니다. ES modules와 Firebase SDK는 `file://`로 직접 연 페이지에서 동작하지 않으므로 HTTP 서버를 사용해야 합니다. Python 내장 서버는 로컬 정적 파일을 확인하는 용도이며 서비스 운영 서버가 아닙니다.

## Firebase 설정

1. Firebase Console에서 프로젝트 `travel-31c17`을 열고 Authentication의 이메일/비밀번호 제공업체를 활성화합니다.
2. Realtime Database를 `asia-southeast1` 리전에 생성합니다.
3. `js/firebase-config.js`에 웹 앱 설정이 들어 있습니다. 이 설정은 브라우저용 공개 설정이며 서비스 계정 키를 넣지 않습니다.
4. `database.rules.json`의 규칙을 Firebase Console의 Realtime Database → Rules에 붙여넣어 게시합니다. Firebase CLI를 쓰는 경우 프로젝트를 선택한 뒤 `firebase deploy --only database`를 실행합니다. 이 저장소에는 프로젝트 별칭을 포함하는 `.firebaserc`가 아직 없으므로, CLI 사용 시 먼저 Firebase 프로젝트를 연결해야 합니다.
5. 초기 관리자 계정을 Firebase Console의 Authentication에서 생성합니다. 로그인에 사용할 이메일은 `js/firebase-config.js`의 `adminAuthEmail` 값과 정확히 일치해야 합니다. 비밀번호는 Authentication이 검증하며 Realtime Database에는 저장하지 않습니다.
6. Authentication 사용자 목록에서 관리자의 전체 UID를 복사하고 Realtime Database의 `/admins/{UID}`에 boolean `true`를 등록합니다. 예: `/admins/b0Aa...` = `true`. 이 작업은 Firebase Console에서 수행하며 클라이언트에서는 관리자 명부를 수정할 수 없습니다.
7. `database.rules.json` 전체를 Firebase Console의 Realtime Database → Rules에 붙여넣고 게시합니다. 기본 거부 규칙을 이 파일로 교체하면 회원은 자기 프로필(`/members/{UID}`)을 저장·조회할 수 있고, 관리자는 UID 명부를 바탕으로 전체 회원 및 운영 데이터를 조회·관리할 수 있습니다.
8. 웹사이트 관리자 아이디는 `admin`입니다. 이 아이디는 `adminAuthEmail`로 지정한 Firebase Authentication 계정에 연결됩니다. 로그인 이후 앱과 Rules가 UID의 `/admins/{UID}` 값이 `true`인지 확인합니다.

관리자 권한은 Authentication UID와 `/admins/{UID}` 값으로 판별됩니다. 사용자 UID 전체를 정확히 등록해야 합니다. 관리자 계정 생성과 UID 등록은 Firebase Console에서 수행합니다.

## 화면 흐름

- 홈: `index.html`
- 회원가입: `html/signup.html`
- 회원 로그인: `html/login.html`
- 관리자 로그인: `html/admin-login.html`
- 예약 신청: `html/reservation.html`
- 관리자 대시보드: `html/admin.html`

회원 비밀번호는 Firebase Authentication에만 저장됩니다. 프로필은 `/members/{UID}`에 저장됩니다. 관리자는 여행지·숙소 등록, 수정, 삭제, 예약 상태 관리, 회원정보 조회를 할 수 있습니다. 예약은 `requested` 상태로 접수되고 관리자 확인 후 확정됩니다. 결제는 제공하지 않습니다.

## 예약 가능 날짜

예약은 숙박일별 `/availability/{stayId}/{YYYY-MM-DD}` 잠금에 Realtime Database 트랜잭션을 사용합니다. 같은 숙소·날짜를 동시에 신청하면 한 요청만 잠금을 얻고 나머지는 실패하도록 처리하며, 잠금 중 일부가 실패하면 해당 요청의 예약 레코드와 잠금을 정리합니다. 관리자 취소는 예약 상태 변경과 날짜 잠금 해제를 한 번의 다중 경로 업데이트로 처리합니다. 브라우저와 네트워크 장애까지 포함하는 운영 수준의 보장은 서버 측 검증과 모니터링을 추가하기 전까지 제한됩니다.

## 배포 전 확인

- Rules를 Firebase Console에서 게시하고 이메일/비밀번호 인증을 켭니다.
- `js/firebase-config.js`의 `adminAuthEmail`을 실제 관리자 계정 이메일로 맞추고, Authentication UID를 `/admins/{UID}`에 boolean `true`로 등록한 뒤 Rules를 게시합니다.
- 공개할 여행지(`isPublished: true`)와 활성 숙소(`isActive: true`)를 관리자 화면에서 등록합니다.
- 공개 여행지·숙소 조회는 Rules의 쿼리 조건을 만족해야 합니다. 현재 코드는 `isPublished === true`, `isActive === true`로 조회합니다.
- GitHub에 서비스 계정 키, 비밀번호, 개인정보를 올리지 않습니다.
- Vercel에는 정적 사이트로 배포합니다. 배포 URL에서 회원가입·로그인·예약·관리자 기능을 별도로 확인합니다.

현재 작업 환경에서 Python 실행 파일을 찾지 못해 로컬 서버와 실제 Firebase 연결은 확인하지 못했습니다. Firebase Console에서 Rules 게시, Authentication 설정, 최초 관리자 등록을 마친 뒤 HTTP 서버와 배포 환경에서 실제 인증 및 권한 흐름을 확인해야 합니다.
