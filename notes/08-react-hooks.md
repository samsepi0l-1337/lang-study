---
title: "React Hooks"
slug: react-hooks
order: 8
level: "중급"
minutes: 50
tags: [JavaScript, React]
summary: "언어 메모 화면에서 상태, 효과, ref, 메모, 디바운스 훅의 호출 순서와 의존성을 맞춥니다."
---

# React Hooks

이 노트는 samsepi0l이 언어 메모 화면으로 훅의 규칙과 오래된 클로저를 정리한 것입니다. 검색어는 입력에 바로 반영되고, 목록은 400ms 동안 입력이 멈춘 뒤에 걸러집니다. 언어를 고르면 문서 제목이 그 이름으로 바뀝니다. 포커스 버튼은 검색 입력으로 커서를 옮깁니다. 예제 파일은 `useState`, `useEffect`, `useRef`, `useMemo`, `useDebouncedValue`를 올바른 의존성으로 호출합니다. 아래의 잘못된 예는 노트에만 있고 파일에는 없습니다.

사전 장과 같이 JSX 없이 `createElement`를 쓰고, 같은 import map으로 React 18.3.1을 불러옵니다. `examples/react-hooks`를 로컬 서버로 엽니다.

## 이 장을 끝내면

- 훅을 조건문 밖, 컴포넌트 위쪽에서만 호출하는 이유를 설명합니다.
- 효과의 의존성이 비었을 때 제목이 첫 언어에 고정되는 이유를 지적합니다.
- 디바운스 값과 ref로, 잠시 뒤의 콜백이 최신 언어 이름을 읽게 만듭니다.

## 훅은 매 렌더에서 같은 순서로 호출합니다

훅은 React 함수 컴포넌트나 커스텀 훅 안에서만 호출합니다. `if`, `for`, 중첩 함수 안에서는 호출하지 않습니다. React는 호출 순서로 상태 칸을 찾기 때문입니다. 순서가 바뀌면 검색어 자리에 선택한 이름이 들어갑니다.

`use`로 시작하는 `useDebouncedValue`가 커스텀 훅입니다. 그 안에서도 같은 규칙이 적용됩니다. `App`은 이 훅을 매 렌더마다 한 번, 조건 분기보다 앞에서 호출합니다. 파일의 `App`은 훅을 모두 호출한 뒤에야 상세를 삼항 연산으로 고릅니다. 그 삼항은 훅 호출이 아닙니다.

### 잘못된 예

```javascript
if (query) {
  debouncedQuery = useDebouncedValue(query, 400);
}
```

검색어가 생겼다 없어질 때마다 훅 개수가 바뀝니다. 예제 파일은 `useDebouncedValue(query, 400)`를 무조건 호출합니다.

## 효과는 커밋 뒤에 실행합니다

문서 제목을 렌더 도중에 바꾸면 계산과 브라우저 부수 효과가 섞입니다. 제목은 `useEffect`에 둡니다. 효과는 화면이 커밋된 뒤에 실행되고, 의존성이 이전 커밋과 같으면 건너뜁니다. 예제 파일의 효과는 다음입니다.

```javascript
useEffect(() => {
  document.title = selectedName + " · 언어 메모";
}, [selectedName]);
```

`selectedName`이 바뀌면 제목을 다시 씁니다. 첫 값은 `"Python"`이라 마운트 직후에도 한 번 맞춰집니다. 포커스 버튼은 이 의존성에 없으므로 제목을 바꾸지 않습니다.

### 잘못된 예

```javascript
useEffect(() => {
  document.title = selectedName + " · 언어 메모";
}, []);
```

의존성 배열이 비어 있으면 마운트 때 한 번만 실행됩니다. 그때의 `selectedName`은 `"Python"`입니다. 이후 Rust를 골라도 제목은 Python에 남습니다. 빈 배열은 "최신 상태와 무관하다"는 선언입니다. 파일의 수정본은 `[selectedName]`을 넣습니다.

정리 함수는 다음 효과 전과 언마운트 때 호출됩니다. 제목 효과는 되돌릴 구독이 없습니다. 디바운스 효과는 이전 타이머를 `clearTimeout`으로 지웁니다. 지우지 않으면 빠른 입력마다 타이머가 남아 지난 검색어가 나중에 적용됩니다.

```javascript
useEffect(() => {
  const id = setTimeout(() => setDebounced(value), delay);
  return () => clearTimeout(id);
}, [value, delay]);
```

개발용 StrictMode는 효과를 두 번 돌려 정리 누락을 드러냅니다. 이 파일은 그 모드를 켜지 않습니다. 그래도 타이머는 정리합니다.

## ref는 렌더를 일으키지 않는 칸입니다

`useRef(null)`의 `.current`를 바꿔도 그것만으로 다시 그리지 않습니다. 검색 입력에 `ref: searchRef`를 넘기면 커밋 뒤 `searchRef.current`가 그 DOM 노드입니다. 포커스 버튼은 `focus()`만 호출합니다. 마운트 전의 `current`는 `null`입니다. 버튼은 첫 커밋 뒤에만 누르므로 그때는 노드가 있습니다.

선택한 이름의 최신 값은 두 번째 ref에 복사합니다. 이 복사는 효과 안이므로 렌더 중 부수 효과가 아닙니다.

```javascript
useEffect(() => {
  selectedRef.current = selectedName;
}, [selectedName]);
```

"2초 뒤 선택 기록"은 `setTimeout` 안에서 `selectedRef.current`를 읽습니다. 기다리는 동안 다른 언어를 고르면 ref가 새 효과로 갱신되므로, 2초 뒤에 남는 이름은 그때의 선택입니다.

## 오래된 클로저는 그 렌더의 변수를 붙잡습니다

`setTimeout`과 `setInterval` 콜백은 그 함수를 만든 렌더의 지역 변수를 기억합니다. 의존성이나 ref 없이 그 변수를 쓰면 나중 렌더와 어긋납니다.

### 잘못된 예

```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState("Rust");

function start() {
  setInterval(() => {
    setCount(count + 1);
    console.log(name);
  }, 1000);
}
```

`start`를 한 번 호출하면 콜백의 `count`는 그 렌더의 0이고 `name`은 `"Rust"`입니다. 이름을 Haskell로 바꿔도 인터벌은 매번 `setCount(1)`을 호출하고 Rust를 출력합니다. `count + 1`이 최신 횟수가 아니라, 클로저에 갇힌 0에 1을 더한 값이기 때문입니다.

횟수만 올릴 때는 `setCount((value) => value + 1)`처럼 직전 상태를 받습니다. 이름처럼 최신 값을 읽어야 하면 의존성 배열에 넣거나, 파일처럼 ref에 최신 이름을 복사하고 콜백은 ref만 읽습니다. 제목 효과의 수정은 의존성 배열이고, 2초 기록의 수정은 ref입니다.

`useMemo`도 그 렌더의 값을 닫습니다. 파일은 디바운스된 문자열만 보고 목록을 거르며 의존성도 그것뿐입니다.

```javascript
const visible = useMemo(() => {
  const needle = debouncedQuery.trim().toLowerCase();
  return LANGUAGES.filter((lang) => lang.name.toLowerCase().includes(needle));
}, [debouncedQuery]);
```

실수: 의존성에 `query`를 넣습니다. 목록이 입력 즉시 바뀌어 디바운스가 무의미해집니다. `LANGUAGES`는 컴포넌트 밖 상수라 의존성에 넣지 않습니다. 열 개짜리 `filter`는 비용이 작습니다. 메모는 의존성을 드러내는 용도이지, 모든 계산에 씌우는 장식이 아닙니다.

## 예제

`examples/react-hooks/index.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>언어 메모</title>
  <style>
    body { margin: 24px; color: #1c1917; font: 16px/1.5 sans-serif; }
    main { max-width: 720px; }
    h1 { margin: 0 0 12px; font-size: 22px; }
    input { margin-left: 8px; font: inherit; }
    button { margin-right: 8px; font: inherit; }
    ul { margin: 12px 0; padding-left: 18px; }
    li { margin: 4px 0; }
    button[aria-pressed="true"] { outline: 2px solid #243e73; }
  </style>
</head>
<body>
  <div id="root"></div>
  <!-- 브라우저는 JSX를 컴파일하지 않습니다. createElement로 그대로 실행합니다. -->
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client"
    }
  }
  </script>
  <script type="module">
    import React, { useEffect, useMemo, useRef, useState } from "react";
    import { createRoot } from "react-dom/client";

    const LANGUAGES = [
      { name: "Python", year: 1991, paradigm: "다중 패러다임", summary: "들여쓰기로 블록을 나타냅니다." },
      { name: "JavaScript", year: 1995, paradigm: "다중 패러다임", summary: "브라우저에서 동작하는 기본 언어입니다." },
      { name: "Go", year: 2009, paradigm: "절차형", summary: "고루틴으로 동시 작업을 나눕니다." },
      { name: "Rust", year: 2010, paradigm: "시스템", summary: "소유권으로 메모리 안전을 검사합니다." },
      { name: "TypeScript", year: 2012, paradigm: "정적 타입", summary: "JavaScript에 타입 표기를 더합니다." },
      { name: "Kotlin", year: 2011, paradigm: "객체지향", summary: "널 가능성을 타입으로 구분합니다." },
      { name: "Elixir", year: 2011, paradigm: "함수형", summary: "프로세스 단위로 실패를 격리합니다." },
      { name: "Zig", year: 2016, paradigm: "시스템", summary: "할당자를 호출자가 넘깁니다." },
      { name: "Dart", year: 2011, paradigm: "객체지향", summary: "UI를 염두에 둔 AOT 컴파일을 지원합니다." },
      { name: "Haskell", year: 1990, paradigm: "순수 함수형", summary: "부작용을 타입으로 분리합니다." }
    ];

    function h(type, props, ...children) {
      return React.createElement(type, props, ...children);
    }

    function useDebouncedValue(value, delay) {
      const [debounced, setDebounced] = useState(value);
      useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
      }, [value, delay]);
      return debounced;
    }

    function App() {
      const [query, setQuery] = useState("");
      const [selectedName, setSelectedName] = useState("Python");
      const [logged, setLogged] = useState("");
      const debouncedQuery = useDebouncedValue(query, 400);
      const searchRef = useRef(null);
      const selectedRef = useRef(selectedName);
      const visible = useMemo(() => {
        const needle = debouncedQuery.trim().toLowerCase();
        return LANGUAGES.filter((lang) => lang.name.toLowerCase().includes(needle));
      }, [debouncedQuery]);
      const selected = LANGUAGES.find((lang) => lang.name === selectedName) || null;

      useEffect(() => {
        document.title = selectedName + " · 언어 메모";
      }, [selectedName]);

      useEffect(() => {
        selectedRef.current = selectedName;
      }, [selectedName]);

      function logLater() {
        setTimeout(() => setLogged(selectedRef.current), 2000);
      }

      return h("main", null,
        h("h1", null, "언어 메모"),
        h("p", null, "입력은 바로 보이고, 목록은 입력이 잠시 멈춘 뒤에 걸러집니다."),
        h("label", null, "이름 검색", h("input", {
          ref: searchRef,
          value: query,
          onChange: (event) => setQuery(event.target.value)
        })),
        h("p", null,
          h("button", { type: "button", onClick: () => searchRef.current.focus() }, "검색창으로 포커스"),
          h("button", { type: "button", onClick: logLater }, "2초 뒤 선택 기록")
        ),
        h("p", null, "적용된 검색: " + (debouncedQuery || "(전체)")),
        h("p", null, "2초 뒤 기록: " + (logged || "(아직 없음)")),
        h("ul", null, visible.map((lang) => h("li", { key: lang.name }, h("button", {
          type: "button",
          onClick: () => setSelectedName(lang.name),
          "aria-pressed": lang.name === selectedName
        }, lang.name)))),
        selected
          ? h("article", null,
              h("h2", null, selected.name),
              h("p", null, selected.year + " · " + selected.paradigm),
              h("p", null, selected.summary))
          : h("p", null, "선택한 언어가 없습니다.")
      );
    }

    createRoot(document.querySelector("#root")).render(h(App));
  </script>
</body>
</html>
```

## 연습

1. 지연을 800ms로 바꿉니다. 검색어가 빈 문자열이 되면 타이머 없이 바로 빈 값을 적용하도록 `useDebouncedValue`를 고칩니다.
2. 포커스 버튼을 누른 뒤 문서 제목이 유지되는지 확인합니다. 제목 효과의 의존성에 `query`가 없는 이유를 한 줄로 적습니다.
3. `useMemo`를 빼도 목록이 같은지 확인합니다. 의존성이 틀린 메모가 계산을 그냥 두는 것보다 나쁜 경우를 하나 적습니다.

## 스스로 확인

1. 훅을 조건문 안에서 호출하면 무엇이 깨집니까?

렌더마다 훅 호출 순서가 달라져 React가 다른 상태 칸을 읽습니다.

2. 제목 효과의 의존성이 빈 배열이면 제목은 언제 바뀝니까?

마운트 때 한 번만 바뀝니다. 첫 `selectedName`인 Python에 고정됩니다.

3. `searchRef.current`를 바꿔도 화면이 다시 그려지지 않는 이유는 무엇입니까?

ref 변경은 상태 갱신이 아니기 때문입니다. 포커스는 DOM 노드의 `focus`를 직접 호출합니다.

4. `setCount(count + 1)`이 인터벌 안에서 멈추는 이유는 무엇입니까?

콜백이 인터벌을 만든 렌더의 `count`를 기억하기 때문입니다. 직전 상태를 받는 갱신 함수나 ref가 필요합니다.

5. 디바운스 효과는 왜 타이머 식별자를 정리합니까?

다음 입력이나 언마운트 뒤에 이전 타이머가 `setDebounced`를 호출하면 지난 검색어가 나중에 적용되기 때문입니다.
