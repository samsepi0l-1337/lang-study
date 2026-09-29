---
title: "Canvas로 언어 지도 그리기"
slug: canvas-sketch
order: 6
level: "초급"
minutes: 40
tags: [JavaScript, Canvas]
summary: "언어 카드의 좌표를 모델로 두고, 포인터로 옮긴 뒤 실행 취소로 직전 배치를 복원합니다."
---

# Canvas로 언어 지도 그리기

이 노트는 samsepi0l이 캔버스에 언어 카드 열 개의 배치를 그리는 방법을 정리한 것입니다. 카드의 이름과 좌표가 상태이고, 화면은 그 상태를 다시 그린 결과입니다. 외부 라이브러리는 쓰지 않습니다. `examples/canvas-sketch/index.html` 하나만 열면 됩니다.

## 이 장을 끝내면

- 캔버스의 원점, 논리 좌표, 장치 픽셀 비율을 구분해 클릭 위치를 맞춥니다.
- 경로를 채워 카드를 그리고, 사각형 비교로 어떤 카드를 집었는지 판정합니다.
- 좌표 복사본을 스택에 넣어 드래그와 지우기를 한 단계 되돌립니다.

## 좌표계는 왼쪽 위가 원점입니다

x는 오른쪽으로, y는 아래로 증가합니다. `canvas.width`와 `canvas.height`는 비트맵 픽셀 수이고, CSS로 보이는 크기와 다를 수 있습니다. 예제는 `devicePixelRatio`만큼 비트맵을 키운 뒤 변환으로 논리 좌표를 유지합니다. 카드의 `x`, `y`는 논리 좌표입니다. 포인터는 `getBoundingClientRect`의 CSS 픽셀을 논리 너비에 맞춰 나눕니다.

```javascript
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.round(VIEW_W * dpr);
canvas.height = Math.round(VIEW_H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

`canvas.width`에 다시 숫자를 넣으면 비트맵과 변환 행렬이 초기화됩니다. 크기를 정한 다음에 `setTransform`을 호출합니다. 테두리 대신 `outline`을 쓰는 이유는 테두리가 박스에 포함되어 클릭 좌표가 밀리기 때문입니다. 논리 크기는 가로 740, 세로 172입니다. 5열 2행이고 카드는 132×64입니다.

실수: CSS `width`만 키우고 속성 `width`는 300에 둡니다. 그림이 늘어나 흐려지고, 이벤트 좌표를 논리 너비로 환산하지 않으면 히트 테스트가 빗나갑니다.

## 경로를 채우고 같은 경로를 따라 긋습니다

카드 하나는 `beginPath`, `rect`, `fill`, `stroke`입니다. `fill`은 현재 경로를 지우지 않으므로 같은 사각형을 이어서 그을 수 있습니다. 글자는 `fillText`이며 경로가 아닙니다. 매 프레임 `clearRect(0, 0, VIEW_W, VIEW_H)`로 논리 화면을 비운 뒤 배열 전체를 다시 그립니다. 변환이 걸린 `clearRect`도 논리 좌표로 동작합니다. 이전 위치만 부분적으로 지우지 않습니다.

```javascript
ctx.beginPath();
ctx.rect(card.x, card.y, card.w, card.h);
ctx.fill();
ctx.stroke();
```

실수: `beginPath` 없이 `rect`를 반복합니다. 이전 카드의 경로가 남아 다음 `fill`이 합쳐집니다. 예제는 카드마다 경로를 새로 엽니다.

## 히트 테스트는 픽셀 색을 읽지 않습니다

점이 카드 안인지는 사각형 부등식입니다. 오른쪽과 아래 변은 `<`로 두어 경계가 맞닿아도 한 카드만 집히게 합니다. 검사는 배열의 끝에서 시작합니다. 나중에 그린 카드가 위에 있으므로 겹치면 그쪽을 집습니다.

```javascript
for (let i = cards.length - 1; i >= 0; i -= 1) {
  const card = cards[i];
  if (x >= card.x && x < card.x + card.w && y >= card.y && y < card.y + card.h) return i;
}
```

`pointerdown`에서 집은 카드를 배열 끝으로 옮기면 다음 프레임에 위에 그려집니다. 그 전에 스냅샷을 넣습니다. `setPointerCapture`가 있어야 포인터가 캔버스 밖으로 나가도 `pointermove`와 `pointerup`이 옵니다. `touch-action: none`이 없으면 브라우저가 드래그를 스크롤로 가져가 포인터가 취소됩니다. 빈 곳을 누르면 스택에 넣지 않습니다.

실수: `getImageData`로 색을 읽어 카드를 구분합니다. 가장자리 픽셀이 흔들리고, 되돌릴 좌표가 남지 않습니다.

## 모델이 진실이고 픽셀은 출력입니다

상태는 `cards`와 `undoStack`입니다. 스택에는 카드마다 얕게 복사한 새 배열을 넣습니다. 같은 배열을 그대로 넣으면 이후 좌표 변경이 과거 기록까지 바꿉니다. 필드는 원시 값이므로 얕은 복사로 충분합니다.

```javascript
function snapshot() {
  return cards.map((card) => ({ ...card }));
}
```

드래그 시작과 지우기 직전에 `push`합니다. 실행 취소는 `pop`한 배열로 `cards`를 바꾸고 `draw`를 다시 호출합니다. 지우기는 픽셀만 문지르는 일이 아닙니다. `cards`를 빈 배열로 둔 뒤 다시 그립니다. 직전 스냅샷이 있으므로 한 번 실행 취소하면 비우기 전의 좌표와 순서가 돌아옵니다. 스택이 비어 있으면 아무 일도 하지 않습니다. 드래그 중에 실행 취소를 누르면 `drag`도 끊어 이후 `pointermove`가 옛 인덱스를 밀지 않게 합니다.

실수: 캔버스를 이미지 주소로 저장했다가 되돌립니다. 이미지에는 이름과 히트 영역이 분리되어 있지 않아 다음 드래그를 이을 수 없습니다.

## 예제

`examples/canvas-sketch/index.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>언어 지도</title>
  <style>
    body { margin: 24px; color: #1c1917; font: 16px/1.5 sans-serif; }
    h1 { margin: 0 0 8px; font-size: 22px; }
    p { margin: 0 0 12px; }
    button { margin-right: 8px; font: inherit; }
    canvas { display: block; background: #fff; outline: 1px solid #d6d3d1; touch-action: none; }
  </style>
</head>
<body>
  <h1>언어 지도</h1>
  <p>카드를 끌어 좌표를 바꿉니다. 지우기는 카드 모델을 비운 뒤 다시 그리고, 실행 취소는 그 직전 좌표를 되돌립니다.</p>
  <p>
    <button id="undo" type="button">실행 취소</button>
    <button id="clear" type="button">지우기</button>
  </p>
  <canvas id="board"></canvas>
  <script>
    const NAMES = ["Python", "JavaScript", "Go", "Rust", "TypeScript", "Kotlin", "Elixir", "Zig", "Dart", "Haskell"];
    const COLORS = ["#243e73", "#9a3412", "#0f766e", "#6b3fa0", "#9f1239", "#1d4ed8", "#b45309", "#3f6212", "#0e7490", "#4c1d95"];
    const COLS = 5;
    const CARD_W = 132;
    const CARD_H = 64;
    const GAP = 12;
    const ORIGIN = 16;
    const VIEW_W = ORIGIN * 2 + COLS * CARD_W + (COLS - 1) * GAP;
    const VIEW_H = ORIGIN * 2 + 2 * CARD_H + GAP;

    const canvas = document.querySelector("#board");
    const ctx = canvas.getContext("2d");
    let cards = layout();
    const undoStack = [];
    let drag = null;

    function layout() {
      return NAMES.map((name, index) => {
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        return {
          name: name,
          x: ORIGIN + col * (CARD_W + GAP),
          y: ORIGIN + row * (CARD_H + GAP),
          w: CARD_W,
          h: CARD_H,
          color: COLORS[index]
        };
      });
    }

    function snapshot() {
      return cards.map((card) => ({ ...card }));
    }

    function fitCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = VIEW_W + "px";
      canvas.style.height = VIEW_H + "px";
      canvas.width = Math.round(VIEW_W * dpr);
      canvas.height = Math.round(VIEW_H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      cards.forEach((card) => {
        ctx.beginPath();
        ctx.rect(card.x, card.y, card.w, card.h);
        ctx.fillStyle = card.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#111827";
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "15px sans-serif";
        ctx.textBaseline = "middle";
        ctx.fillText(card.name, card.x + 10, card.y + card.h / 2);
      });
    }

    function pointOf(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) * (VIEW_W / rect.width),
        y: (event.clientY - rect.top) * (VIEW_H / rect.height)
      };
    }

    function hitIndex(x, y) {
      for (let i = cards.length - 1; i >= 0; i -= 1) {
        const card = cards[i];
        if (x >= card.x && x < card.x + card.w && y >= card.y && y < card.y + card.h) return i;
      }
      return -1;
    }

    canvas.addEventListener("pointerdown", (event) => {
      const point = pointOf(event);
      const index = hitIndex(point.x, point.y);
      if (index < 0) return;
      undoStack.push(snapshot());
      const card = cards.splice(index, 1)[0];
      cards.push(card);
      drag = { dx: point.x - card.x, dy: point.y - card.y };
      canvas.setPointerCapture(event.pointerId);
      draw();
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const point = pointOf(event);
      const card = cards[cards.length - 1];
      card.x = point.x - drag.dx;
      card.y = point.y - drag.dy;
      draw();
    });

    function endDrag() {
      drag = null;
    }

    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    document.querySelector("#undo").addEventListener("click", () => {
      const previous = undoStack.pop();
      if (!previous) return;
      cards = previous;
      drag = null;
      draw();
    });

    document.querySelector("#clear").addEventListener("click", () => {
      undoStack.push(snapshot());
      cards = [];
      drag = null;
      draw();
    });

    fitCanvas();
    draw();
  </script>
</body>
</html>
```

## 연습

1. 카드 모서리를 둥글게 그리되 히트 테스트는 사각형으로 유지합니다. 둥근 모서리 밖을 집는 경우가 생기는 이유를 한 줄로 적습니다.
2. 스택이 비어 있을 때 실행 취소 버튼을 비활성화합니다. 드래그 시작, 드래그 종료, 지우기, 실행 취소 중 언제 `disabled`를 다시 계산하는지도 적습니다.
3. 두 카드가 겹칠 때 나중에 집은 카드가 위에 보이는 이유를 배열 순서로 설명합니다.

## 스스로 확인

1. 캔버스에서 y가 증가하는 방향은 어디입니까?

아래입니다. 원점은 왼쪽 위이고, 수학 좌표처럼 위가 아닙니다.

2. `devicePixelRatio`가 2일 때 카드의 `x`는 비트맵 픽셀입니까?

아닙니다. `x`는 논리 좌표입니다. `setTransform`이 그 값을 비트맵 픽셀로 늘립니다.

3. 왜 `fill` 뒤에 바로 `stroke`를 호출할 수 있습니까?

`fill`이 현재 경로를 제거하지 않기 때문입니다. 그 전에 `beginPath`와 `rect`로 사각형을 만들어 둡니다.

4. 히트 테스트는 왜 배열의 뒤에서 시작합니까?

뒤에 있는 카드가 나중에 그려져 위에 보이기 때문입니다. 겹친 지점의 클릭은 보이는 카드를 집어야 합니다.

5. 실행 취소 스택에 `cards`를 그대로 `push`하면 무엇이 깨집니까?

이후의 좌표 변경이 스택 안의 같은 객체를 바꿉니다. 되돌릴 과거 좌표가 남지 않습니다.
