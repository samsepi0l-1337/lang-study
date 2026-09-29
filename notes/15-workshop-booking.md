---
title: "워크숍 좌석 예약"
slug: workshop-booking
order: 15
level: "중급"
minutes: 40
tags: [JavaScript]
summary: "시작 시각과 이름, 좌석 수 규칙을 서비스에 두고 언어 워크숍 좌석을 예약합니다."
---

# 워크숍 좌석 예약

이 노트는 samsepi0l이 프로그래밍 언어 워크숍의 좌석 예약을 정리한 것입니다. 좌석은 메모리에 둡니다. 워크숍은 언어, 제목, 시작 시각, 좌석 수를 가집니다. 시작 시각 `startsAt`은 유닉스 에폭 밀리초 정수입니다. 예약은 워크숍 id와 이름으로 이루어집니다.

화면이 버튼을 숨기는 것만으로는 규칙이 되지 않습니다. `curl`이나 테스트는 그 버튼을 거치지 않습니다. `examples/workshop-booking/booking.js`의 `createService`가 성공과 실패를 결정하고, `server.js`는 그 결과의 `code`를 상태 코드로 바꿉니다. 테스트는 HTTP를 열지 않습니다.

## 이 장을 끝내면

- 지난 시작 시각, 같은 이름, 초과 좌석이 각각 다른 `code`로 거절되는 순서를 설명합니다.
- 한 워크숍 안에서의 신원이 계정이 아니라 이름 문자열인 이유와 한계를 말합니다.
- 그 규칙이 서비스에 있어야 하는 이유를 화면과 테스트의 차이로 설명합니다.

## 거절 순서는 한 함수에 고정합니다

`reserve(workshopId, name)`의 검사는 순서가 고정입니다.

1. 워크숍이 없으면 `not_found`입니다.
2. `startsAt < now`이면 `past`입니다. 시작 시각이 시계와 같으면 아직 지난 것이 아니므로 예약할 수 있습니다.
3. 이름이 없거나 공백이거나 40자를 넘으면 `invalid`입니다.
4. 같은 워크숍에 같은 이름이 있으면 `duplicate`입니다.
5. 그 워크숍의 예약 수가 `seats` 이상이면 `full`입니다.

지난 워크숍이 동시에 만석이어도 `past`가 먼저입니다. 호출자는 시간이 지났다는 이유를 좌석 부족보다 먼저 봅니다. `addWorkshop`은 지난 시각도 기록으로 남깁니다. 등록과 예약은 다른 규칙입니다. 좌석 수는 1 이상 500 이하의 정수입니다.

`listWorkshops`의 `reserved`는 예약 배열을 세어 만듭니다. 인원 필드를 따로 저장하지 않으므로 두 수가 어긋나지 않습니다. `open`은 `startsAt >= now`인 표시일 뿐이고, 예약 허용을 대신하지 않습니다. 목록을 믿는 클라이언트도 `reserve`를 다시 통과합니다.

## 신원은 워크숍과 이름의 쌍입니다

예약 행의 키는 예약 id입니다. 사람의 신원은 `(workshopId, name)`입니다. 이름 앞뒤 공백은 제거합니다. 대소문자는 구분합니다. `samsepi0l`과 `SamSepi0l`은 이 연습에서 다른 참가자입니다. 같은 이름은 다른 워크숍에 각각 한 번씩 예약할 수 있습니다. 전역 금지가 아닙니다.

계정, 비밀번호, 좌석 번호는 없습니다. 좌석은 개수만 셉니다. 누가 몇 번 자리인지는 범위 밖입니다. 같은 이름을 쓰는 두 사람을 이 서비스는 구분하지 못합니다. 그 한계를 화면 문구로 숨기지 않습니다. 이름 중복을 좌석 검사보다 먼저 보는 이유는, 같은 표기가 남은 좌석을 두 번 차지하면 `reserved`가 사람 수처럼 보이기 때문입니다.

## 규칙은 서비스에 있고 화면은 클라이언트일 뿐입니다

비활성화된 버튼은 그 브라우저의 클릭만 막습니다. `node:http`로 같은 함수를 호출하는 다른 프로그램은 버튼을 모릅니다. `booking.test.js`는 `createService`만 불러 성공, 중복, 만석, 과거를 확인합니다. 규칙을 핸들러나 화면에만 두면 이 테스트가 회귀를 잡지 못합니다.

서버의 상태 코드는 규칙을 다시 적지 않습니다. `invalid`는 400, `not_found`는 404, `past`와 `duplicate`와 `full`은 409입니다. 성공한 워크숍과 예약은 201이고 본문은 만들어진 객체입니다.

`createService(now = Date.now)`의 기본값은 시각이 아니라 `Date.now` 함수입니다. 기본 인자는 호출 때 평가되므로 `Date.now`는 함수 참조로 들어가고, `clock`이 예약마다 `now()`를 호출합니다. `Date.now()`를 기본값으로 두면 서비스를 만든 시각에 시계가 고정됩니다. 테스트는 `() => current`를 넘겨 그 변수를 앞으로 옮깁니다. 시스템 시계를 되돌리지 않습니다.

서버는 `import.meta.url`이 실행 파일과 같을 때만 `listen`합니다. 테스트를 위해 모듈을 import해도 포트가 열리지 않습니다. 직접 실행하면 기본 포트는 8091이고, 열 개 언어의 미래 워크숍을 시드합니다. 시드는 `server.js`에만 있으므로 테스트의 빈 서비스와 섞이지 않습니다.

## 한 번의 예약이 지나가는 순서

좌석이 2인 Rust 워크숍의 `startsAt`이 시계보다 한 시간 뒤라고 둡니다. `samsepi0l`의 첫 `reserve`는 예약 행을 만들고 `ok`가 true입니다. 같은 이름에 앞뒤 공백을 붙여 다시 부르면 `text`가 공백을 자른 뒤 `duplicate`를 반환합니다. `ada`는 두 번째 좌석이라 성공하고, `grace`는 `full`입니다.

시작 시각을 1밀리초 전으로 둔 Haskell 워크숍은 좌석이 남아 있어도 `past`입니다. 시계를 그 Rust 워크숍의 시작 시각보다 뒤로 옮기면, 이미 만석인 그 워크숍도 먼저 `past`를 반환합니다. 이 순서는 `booking.test.js`가 고정합니다. 서버를 띄우면 같은 함수가 `POST /reservations`의 201 또는 409가 됩니다.

## 예제

파일은 `examples/workshop-booking/booking.js`, `server.js`, `booking.test.js`입니다. `package.json`의 `"type"`은 `module`입니다.

`examples/workshop-booking/booking.js`의 시계와 시그니처입니다.

```javascript
export function createService(now = Date.now) {
  const workshops = [];
  const reservations = [];
  let nextWorkshopId = 1;
  let nextReservationId = 1;

  function clock() {
    const value = typeof now === 'function' ? now() : now;
    const time = Number(value);
    if (!Number.isFinite(time)) {
      throw new Error('시계가 올바른 밀리초를 반환하지 않습니다.');
    }
    return time;
  }
```

`examples/workshop-booking/booking.js`의 `reserve`입니다. 분기는 위에서 아래로만 통과합니다.

```javascript
  function reserve(workshopId, name) {
    const id = Number(workshopId);
    const workshop = workshops.find((row) => row.id === id);
    if (!workshop) {
      return { ok: false, code: 'not_found', error: '없는 워크숍입니다.' };
    }
    const time = clock();
    if (workshop.startsAt < time) {
      return { ok: false, code: 'past', error: '시작 시각이 지난 워크숍은 예약할 수 없습니다.' };
    }
    const attendee = text(name, 40);
    if (!attendee) {
      return { ok: false, code: 'invalid', error: '예약자 이름이 필요합니다.' };
    }
    const duplicate = reservations.some((row) => row.workshopId === workshop.id && row.name === attendee);
    if (duplicate) {
      return { ok: false, code: 'duplicate', error: '같은 이름은 이 워크숍에 한 번만 예약할 수 있습니다.' };
    }
    const taken = reservations.filter((row) => row.workshopId === workshop.id).length;
    if (taken >= workshop.seats) {
      return { ok: false, code: 'full', error: '좌석이 모두 찼습니다.' };
    }
```

`examples/workshop-booking/booking.test.js`는 주입한 시계로 네 가지 결과를 고정합니다.

```javascript
const first = service.reserve(rust.workshop.id, 'samsepi0l');
assert.equal(first.ok, true);
assert.equal(first.reservation.name, 'samsepi0l');
assert.equal(service.listWorkshops().find((row) => row.id === rust.workshop.id).reserved, 1);

const duplicate = service.reserve(rust.workshop.id, ' samsepi0l ');
assert.equal(duplicate.ok, false);
assert.equal(duplicate.code, 'duplicate');
```

같은 디렉터리에서 `node booking.test.js`를 실행합니다. 의존성 설치는 없습니다. 서버를 띄우면 `GET /workshops`, `POST /workshops`, `GET /reservations`, `POST /reservations`를 사용할 수 있습니다.

```bash
node booking.test.js
PORT=8091 node server.js
```

예약 본문은 `{"workshopId":1,"name":"samsepi0l"}`입니다. 성공은 201, 같은 이름의 재요청은 409와 `duplicate`입니다.

## 연습

1. 좌석이 1이고 `startsAt`이 현재 시계와 같은 워크숍을 만든 뒤 한 명을 예약합니다. 시계를 1밀리초 앞으로 옮기고 다른 이름으로 다시 예약해 `code`가 `past`인지 확인합니다.
2. 같은 이름을 다른 `workshopId`에 예약합니다. 성공하면 신원이 전역 이름이 아니라는 점을 `duplicate` 조건의 `workshopId` 비교에서 확인합니다.
3. `seats`가 0인 `addWorkshop`과 공백 이름의 `reserve`가 모두 `invalid`인지 확인합니다. 만석인 `full`과 입력 오류가 다른 분기인 이유를 적습니다.

## 스스로 확인

1. 지난 워크숍의 예약 버튼을 숨기면 규칙이 끝난 것입니까?

아닙니다. 숨김은 그 화면의 클릭만 줄입니다. `reserve`를 직접 부르는 테스트와 HTTP 클라이언트는 버튼을 보지 않습니다. 허용 여부는 `startsAt < now`를 서비스가 계산해야 합니다.

2. startsAt과 now가 같으면 왜 예약이 됩니까?

거절 조건은 시작 시각이 시계보다 작은 경우입니다. 같은 밀리초는 아직 과거가 아닙니다. `open`도 `startsAt >= now`라서 목록 표시와 예약 판정이 이 경계에서 일치합니다.

3. 같은 이름이 다른 워크숍에서는 왜 됩니까?

중복 검사는 `workshopId`와 잘라 낸 이름이 둘 다 같을 때만 참입니다. 워크숍마다 명단이 따로 있습니다. 언어 공부 모임 전체를 한 계정으로 묶는 기능은 이 장에 없습니다.

4. 기본 인자 Date.now와 Date.now()는 어떻게 다릅니까?

괄호가 없으면 함수가 전달되어 예약마다 현재 시각을 읽습니다. 괄호가 있으면 서비스를 만드는 순간의 숫자가 기본값이 되어 이후 예약이 그 시각에 고정됩니다. 테스트가 시계를 주입할 수 있는 형태는 함수입니다.

5. 만석인 지난 워크숍의 code는 무엇입니까?

`past`입니다. 존재 확인 다음, 이름과 중복과 좌석보다 앞에 시각을 검사하기 때문입니다. 좌석이 남아 있어도 지난 워크숍은 같은 `code`입니다. 서버는 그 값을 409로 보냅니다.
