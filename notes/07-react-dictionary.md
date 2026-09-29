---
title: "React로 언어 사전 만들기"
slug: react-dictionary
order: 7
level: "초급"
minutes: 40
tags: [JavaScript, React]
summary: "이름 검색과 선택 상태를 부모에 두고, 목록과 상세는 props로만 언어 데이터를 받습니다."
---

# React로 언어 사전 만들기

이 노트는 samsepi0l이 React 18로 언어 사전 한 화면을 만드는 방법을 정리한 것입니다. 데이터는 파일 안의 배열 열 개이고, 필드는 이름, 연도, 패러다임, 한 줄 설명입니다. 상태는 검색어와 선택한 이름뿐이며 둘 다 `useState`입니다. 브라우저는 JSX를 컴파일하지 않으므로 예제는 `createElement`를 호출합니다. JSX의 `<SearchBox query={query} />`는 `h(SearchBox, { query: query })`와 같은 호출입니다.

import map은 `https://esm.sh/react@18.3.1`과 `https://esm.sh/react-dom@18.3.1/client`만 가리킵니다. 루트는 `createRoot`로 만듭니다. 모듈 스크립트는 `file://`에서 막히는 경우가 많습니다. `examples/react-dictionary`에서 로컬 서버를 띄운 뒤 `http://127.0.0.1`로 엽니다.

## 이 장을 끝내면

- 검색어와 선택 이름을 부모 상태에 두고 자식은 props와 콜백만 받습니다.
- 이름 부분 문자열로 목록을 거르고, 고른 행의 상세를 같은 배열에서 찾습니다.
- 목록의 `key`로 인덱스 대신 언어 이름을 쓰는 이유를 설명합니다.

## props는 부모가 내려 주는 값입니다

`SearchBox`는 검색 문자열과 그 문자열을 바꾸는 함수를 받습니다. 입력의 `value`가 `query`이므로 이 입력은 제어 컴포넌트입니다. 자식이 부모 변수에 직접 대입하지 않습니다. `onChange`에서 `onQuery`를 호출하면 부모가 `setQuery`로 다시 렌더합니다.

```javascript
function SearchBox({ query, onQuery }) {
  return h("label", null, "이름 검색", h("input", {
    value: query,
    onChange: (event) => onQuery(event.target.value)
  }));
}
```

`LanguageList`는 이미 걸러진 배열, 선택된 이름, 선택 콜백을 받습니다. `LanguageDetail`은 언어 객체 또는 `null`만 받습니다. 상세가 목록의 내부를 읽지 않습니다. 둘 다 부모를 통해서만 만납니다. 이 방향이 단방향 데이터 흐름입니다. 데이터는 아래로, 알림은 콜백으로 위로 갑니다.

실수: 입력에 `value`만 주고 `onChange`를 빼면 상태가 갱신되지 않아 글자가 붙지 않습니다. 상태를 두지 않고 DOM만 읽으면 상세와 목록이 서로 다른 문자열을 보게 됩니다.

## 상태 둘이면 화면이 결정됩니다

`App`의 상태는 `query`와 `selectedName`입니다. 첫 선택은 `null`이라 상세는 안내 문장입니다. 보이는 목록은 렌더 중에 계산하는 파생 값이라 따로 저장하지 않습니다.

```javascript
const visible = LANGUAGES.filter((lang) => {
  return lang.name.toLowerCase().includes(query.trim().toLowerCase());
});
```

비교 전에 `trim`과 `toLowerCase`를 하므로 `"  go "`도 Go에 맞습니다. 패러다임과 설명은 검색하지 않습니다. 선택 상세는 걸러진 배열이 아니라 원본 `LANGUAGES`에서 이름으로 찾습니다. 검색으로 행이 사라져도 이미 고른 설명은 남습니다.

실수: 필터 결과를 `useState`에 넣고 `useEffect`로 검색어와 맞춥니다. 목록이 한 박자 늦고, 이 장에서 필요한 훅은 `useState`뿐입니다.

## 목록의 key는 이름입니다

`map`으로 만든 각 `li`의 `key`는 `lang.name`입니다. 이 배열에서 이름은 유일합니다. React는 key로 렌더 사이의 같은 항목을 맞춥니다. 인덱스를 key로 쓰면 필터로 순서가 바뀔 때, 행 안에 둔 지역 상태가 다른 언어에 붙을 수 있습니다. 이 예제의 버튼은 지역 상태가 없어도 key는 데이터 신원에 둡니다.

```javascript
items.map((lang) => h("li", { key: lang.name }, h("button", {
  type: "button",
  onClick: () => onSelect(lang.name),
  "aria-pressed": selectedName === lang.name
}, lang.name)))
```

규칙은 부모가 `createElement`에 key를 넘기는 것입니다. 자식 컴포넌트 안에서 자기 key를 만들 수 없습니다. `aria-pressed`는 선택 여부이고, 스타일은 그 속성을 보고 테두리를 그립니다. 선택 여부를 버튼 바깥의 전역 변수에 두지 않습니다.

실수: key를 배열 인덱스나 `Math.random()`으로 줍니다. 인덱스는 신원이 아니고, 난수는 매 렌더가 새 항목이라 입력이 포커스를 잃습니다.

## 예제

`examples/react-dictionary/index.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>언어 사전</title>
  <style>
    body { margin: 24px; color: #1c1917; font: 16px/1.5 sans-serif; }
    main { max-width: 720px; }
    h1 { margin: 0 0 12px; font-size: 22px; }
    .layout { display: grid; grid-template-columns: 220px 1fr; gap: 16px; margin-top: 16px; }
    input { margin-left: 8px; font: inherit; }
    button { font: inherit; }
    ul { margin: 0; padding-left: 18px; }
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
    import React, { useState } from "react";
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

    function SearchBox({ query, onQuery }) {
      return h("label", null, "이름 검색", h("input", {
        value: query,
        onChange: (event) => onQuery(event.target.value)
      }));
    }

    function LanguageList({ items, selectedName, onSelect }) {
      if (items.length === 0) return h("p", null, "일치하는 이름이 없습니다.");
      return h("ul", null, items.map((lang) => h("li", { key: lang.name }, h("button", {
        type: "button",
        onClick: () => onSelect(lang.name),
        "aria-pressed": selectedName === lang.name
      }, lang.name))));
    }

    function LanguageDetail({ lang }) {
      if (!lang) return h("p", null, "이름을 고르면 설명이 나옵니다.");
      return h("article", null,
        h("h2", null, lang.name),
        h("p", null, lang.year + " · " + lang.paradigm),
        h("p", null, lang.summary)
      );
    }

    function App() {
      const [query, setQuery] = useState("");
      const [selectedName, setSelectedName] = useState(null);
      const visible = LANGUAGES.filter((lang) => {
        return lang.name.toLowerCase().includes(query.trim().toLowerCase());
      });
      const selected = LANGUAGES.find((lang) => lang.name === selectedName) || null;
      return h("main", null,
        h("h1", null, "언어 사전"),
        h(SearchBox, { query: query, onQuery: setQuery }),
        h("div", { className: "layout" },
          h(LanguageList, { items: visible, selectedName: selectedName, onSelect: setSelectedName }),
          h(LanguageDetail, { lang: selected })
        )
      );
    }

    createRoot(document.querySelector("#root")).render(h(App));
  </script>
</body>
</html>
```

## 연습

1. 이름뿐 아니라 패러다임도 검색에 포함합니다. 필터 함수는 `App` 안에 둡니다.
2. 선택한 이름이 `visible`에 없으면 상세를 비웁니다. `selectedName`을 지울지, 상세만 `null`로 계산할지 하나를 고르고 차이를 적습니다.
3. `key`를 배열 인덱스로 바꿉니다. 각 행이 자기 입력 상태를 가지면 필터 뒤에 그 상태가 어느 언어에 붙는지 설명합니다.

## 스스로 확인

1. 검색 입력의 현재 글자는 어디에 있습니까?

`App`의 `query` 상태에 있습니다. `SearchBox`는 그 값을 props로 받아 표시만 합니다.

2. 자식이 선택을 바꾸려면 어떻게 합니까?

부모가 내려 준 `onSelect`를 호출합니다. 자식이 `selectedName`에 직접 대입하지 않습니다.

3. 상세는 왜 `visible`이 아니라 `LANGUAGES`에서 찾습니까?

선택은 검색 결과와 별도 상태이기 때문입니다. 걸러져 행이 없어도 고른 이름은 유효합니다.

4. 파생 목록을 상태로 두지 않는 이유는 무엇입니까?

`query`만 있으면 렌더 중에 계산할 수 있기 때문입니다. 두 곳을 갱신하면 서로 어긋납니다.

5. 인덱스를 key로 쓰면 어떤 문제가 있습니까?

항목 순서가 바뀔 때 React가 다른 언어를 같은 행으로 여깁니다. 행에 붙은 지역 상태가 엉뚱한 이름에 남습니다.
