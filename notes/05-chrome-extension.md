---
title: "브라우저 확장 프로그램"
slug: chrome-extension
order: 5
level: "초급"
minutes: 45
tags: [JavaScript, Chrome]
summary: "Manifest V3 팝업으로 오늘의 언어를 고르고, 루프백 데모에서만 언어 이름을 표시합니다."
---

# 브라우저 확장 프로그램

이 노트는 samsepi0l이 Chrome 확장의 최소 구성을 정리한 것입니다. 팝업은 네트워크 없이 언어 열 개를 가지고 날짜로 오늘의 항목을 고릅니다. 저장은 `chrome.storage.local` 한 키입니다. 페이지를 바꾸는 스크립트는 `http://127.0.0.1`의 데모로 한정합니다. `popup.js`는 번들러 없는 일반 스크립트입니다.

## 이 장을 끝내면

- `manifest.json`에 액션 팝업, `storage` 권한, 콘텐츠 스크립트 일치 패턴을 적습니다.
- 팝업에서 배열을 그리고, 마지막 선택을 `storage.local`에 남깁니다.
- `<all_urls>`와 파일 URL을 쓰지 않는 이유를 데모 주소로 설명합니다.

## 매니페스트가 권한의 경계입니다

아이콘을 눌렀을 때 열리는 문서는 `action.default_popup`입니다. 백그라운드 작업이 없으므로 서비스 워커는 두지 않습니다. 팝업의 `document`는 열린 탭의 `document`가 아닙니다. 탭의 글자를 바꾸려면 콘텐츠 스크립트가 필요합니다.

`permissions`에는 호출하는 API만 적습니다. `chrome.storage.local`에는 `"storage"`가 필요합니다. `host_permissions`는 확장 페이지가 그 호스트로 `fetch`할 때 필요합니다. 그 호출이 없으므로 키 자체를 두지 않습니다. 주입 범위는 `content_scripts.matches`입니다.

```json
"permissions": ["storage"],
"content_scripts": [
  {
    "matches": ["http://127.0.0.1/*"],
    "js": ["content.js"],
    "css": ["styles.css"]
  }
]
```

규칙은 세 가지입니다. `matches`에 `<all_urls>`를 넣지 않습니다. 포트를 생략한 `http://127.0.0.1/*`는 그 호스트의 모든 포트를 맞춥니다. `file://`는 다른 패턴이고, 사용자가 확장 설정에서 파일 URL 접근을 켜야 붙습니다. 이 예제는 그 권한을 요청하지 않습니다.

실수: 팝업에서 `document.querySelector`로 현재 탭의 제목을 읽습니다. 읽는 문서는 팝업 자신입니다.

## 오늘의 언어와 storage.local

목록은 `popup.js` 안의 배열입니다. 오늘의 인덱스는 연중 일수를 길이로 나눈 나머지입니다. `Date.UTC`로 연·월·일을 자르면 서머타임으로 하루 길이가 바뀌어도 인덱스가 밀리지 않습니다. 1월 1일의 일수는 1이고, 인덱스는 `(일수 - 1) % 길이`입니다.

```javascript
const start = Date.UTC(date.getFullYear(), 0, 0);
const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
const day = Math.floor((today - start) / 86400000);
```

"다른 언어"는 화면 인덱스만 바꿉니다. "이 언어 저장"만 `{ lastLanguage: lang }`을 기록합니다. 팝업을 다시 열면 오늘은 날짜로 다시 그리고, 마지막 저장은 `get`으로 따로 보여 줍니다. 이 값은 웹 페이지의 `localStorage`와 오리진이 다릅니다. `chrome` 객체가 없으면 파일로 연 팝업이므로 저장만 포기합니다.

실수: DOM 노드나 함수를 저장합니다. 구조적 복제가 되는 평문만 들어갑니다. 콜백에서 `chrome.runtime.lastError`를 보지 않으면 권한 누락이 빈 저장처럼 보입니다.

## 콘텐츠 스크립트는 데모에서만 본문을 바꿉니다

같은 호스트의 다른 로컬 페이지에도 스크립트와 스타일이 주입됩니다. `content.js`는 루트의 `data-lotd-demo`가 `"1"`일 때만 텍스트 노드를 바꿉니다. 표식이 없으면 반환합니다. 스타일 선택자는 `body.lotd-popup`과 `mark.lang-hit`뿐이라 다른 페이지의 본문 색은 바뀌지 않습니다.

```javascript
if (document.documentElement.dataset.lotdDemo === "1") {
  // 여기서만 텍스트 노드를 mark.lang-hit으로 바꿉니다.
}
```

정규식은 언어 이름 열 개의 단어 경계입니다. `\b`는 ASCII 단어 경계라 `Go는`의 조사 앞을 경계로 봅니다. `Algorithm`, `python3`, `go to`는 일치하지 않습니다. `script`, `style`, 이미 만든 `mark.lang-hit` 안은 건너뜁니다. 노드를 바꾸는 동안 `TreeWalker`를 진행하면 다음 텍스트를 놓치므로, 대상을 배열에 모은 뒤 바꿉니다. `run_at`을 생략하면 `document_idle`이라 `body`가 있습니다.

순서는 고정합니다. 확장 관리 페이지에서 `examples/chrome-extension`을 압축해제된 확장으로 불러옵니다. 그 폴더에서 `python3 -m http.server 8765`를 실행하고 `http://127.0.0.1:8765/demo.html`을 엽니다. `localhost`와 `file://`는 패턴 밖이라 표시가 생기지 않습니다.

## 예제

`examples/chrome-extension/manifest.json`

```json
{
  "manifest_version": 3,
  "name": "오늘의 언어",
  "version": "1.0.0",
  "description": "로컬 목록에서 오늘의 언어를 보여주고, 데모 페이지의 언어 이름만 표시합니다.",
  "action": {
    "default_title": "오늘의 언어",
    "default_popup": "popup.html"
  },
  "permissions": ["storage"],
  "content_scripts": [
    {
      "matches": ["http://127.0.0.1/*"],
      "js": ["content.js"],
      "css": ["styles.css"]
    }
  ]
}
```

`examples/chrome-extension/popup.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>오늘의 언어</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="lotd-popup">
  <h1>오늘의 언어</h1>
  <p id="today"></p>
  <h2 id="name"></h2>
  <p id="meta"></p>
  <p id="summary"></p>
  <button id="save" type="button">이 언어 저장</button>
  <button id="next" type="button">다른 언어</button>
  <h2>마지막 저장</h2>
  <p id="saved">아직 없습니다.</p>
  <script src="popup.js"></script>
</body>
</html>
```

`examples/chrome-extension/popup.js`

```javascript
"use strict";

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

const nameEl = document.querySelector("#name");
const metaEl = document.querySelector("#meta");
const summaryEl = document.querySelector("#summary");
const todayEl = document.querySelector("#today");
const savedEl = document.querySelector("#saved");
const storage = globalThis.chrome && chrome.storage && chrome.storage.local;

function dayIndex(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const day = Math.floor((today - start) / 86400000);
  return (day - 1) % LANGUAGES.length;
}

let index = dayIndex(new Date());

function render(lang) {
  nameEl.textContent = lang.name;
  metaEl.textContent = lang.year + " · " + lang.paradigm;
  summaryEl.textContent = lang.summary;
}

function renderSaved(lang) {
  if (!lang || !lang.name) {
    savedEl.textContent = "아직 없습니다.";
    return;
  }
  savedEl.textContent = lang.name + " · " + lang.year;
}

todayEl.textContent = new Date().toLocaleDateString("ko-KR");
render(LANGUAGES[index]);

if (!storage) {
  savedEl.textContent = "확장 팝업에서만 저장됩니다.";
} else {
  storage.get("lastLanguage", (data) => {
    if (chrome.runtime.lastError) {
      savedEl.textContent = "저장소를 쓰지 못했습니다.";
      return;
    }
    renderSaved(data.lastLanguage);
  });
}

document.querySelector("#save").addEventListener("click", () => {
  if (!storage) return;
  const lang = LANGUAGES[index];
  storage.set({ lastLanguage: lang }, () => {
    if (chrome.runtime.lastError) {
      savedEl.textContent = "저장소를 쓰지 못했습니다.";
      return;
    }
    renderSaved(lang);
  });
});

document.querySelector("#next").addEventListener("click", () => {
  index = (index + 1) % LANGUAGES.length;
  render(LANGUAGES[index]);
});
```

`examples/chrome-extension/content.js`

```javascript
"use strict";

const PATTERN = /\b(?:TypeScript|JavaScript|Python|Kotlin|Haskell|Elixir|Rust|Dart|Zig|Go)\b/g;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);

function accepted(node) {
  const parent = node.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.closest("mark.lang-hit")) {
    return NodeFilter.FILTER_REJECT;
  }
  PATTERN.lastIndex = 0;
  return PATTERN.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
}

function replaceText(node) {
  const text = node.nodeValue;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  PATTERN.lastIndex = 0;
  for (let match = PATTERN.exec(text); match; match = PATTERN.exec(text)) {
    if (match.index > cursor) {
      fragment.append(document.createTextNode(text.slice(cursor, match.index)));
    }
    const mark = document.createElement("mark");
    mark.className = "lang-hit";
    mark.textContent = match[0];
    fragment.append(mark);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
  node.parentNode.replaceChild(fragment, node);
}

if (document.documentElement.dataset.lotdDemo === "1") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: accepted
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceText);
}
```

`examples/chrome-extension/demo.html`

```html
<!DOCTYPE html>
<html lang="ko" data-lotd-demo="1">
<head>
  <meta charset="utf-8">
  <title>언어 이름 데모</title>
  <style>
    body { margin: 32px auto; max-width: 40rem; font: 16px/1.6 sans-serif; color: #1c1917; }
    code { font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>로컬 서버로 엽니다</h1>
  <p>이 파일을 <code>file://</code>로 열면 콘텐츠 스크립트가 붙지 않습니다. 확장은 <code>http://127.0.0.1/*</code>만 일치시키고, 파일 URL 권한은 요청하지 않습니다.</p>
  <p><code>examples/chrome-extension</code>에서 <code>python3 -m http.server 8765</code>를 실행한 뒤 <code>http://127.0.0.1:8765/demo.html</code>을 엽니다. 그 전에 같은 폴더를 압축해제된 확장으로 불러옵니다. <code>localhost</code>는 패턴에 없습니다.</p>
  <h2>본문</h2>
  <p>Python은 들여쓰기로 블록을 구분합니다. JavaScript는 브라우저의 기본 언어입니다. Go는 고루틴으로 동시 작업을 나눕니다. Rust는 소유권을, TypeScript는 타입 표기를 다룹니다.</p>
  <p>Kotlin은 널 가능성을 타입으로 구분합니다. Elixir는 프로세스로 실패를 격리합니다. Zig는 할당자를 호출자가 넘깁니다. Dart는 UI용 AOT를, Haskell은 순수 함수를 중심으로 둡니다.</p>
  <p>Algorithm, python3, go to는 언어 이름이 아니므로 표시하지 않습니다.</p>
</body>
</html>
```

`examples/chrome-extension/styles.css`

```css
body.lotd-popup {
  box-sizing: border-box;
  width: 280px;
  margin: 0;
  padding: 12px 14px 16px;
  color: #1c1917;
  background: #faf7f2;
  font: 14px/1.45 sans-serif;
}

body.lotd-popup h1,
body.lotd-popup h2 {
  margin: 0 0 6px;
  font-size: 16px;
}

body.lotd-popup h2 {
  margin-top: 12px;
  font-size: 13px;
}

body.lotd-popup p {
  margin: 0 0 8px;
}

body.lotd-popup button {
  margin: 0 6px 0 0;
  padding: 4px 8px;
  font: inherit;
}

mark.lang-hit {
  padding: 0 0.12em;
  color: #1c1917;
  background: #f6e27a;
}
```

## 연습

1. 연중 일수 대신 요일로 인덱스를 만듭니다. 저장 키 이름은 `lastLanguage`로 둡니다.
2. 같은 서버에 표식 없는 HTML을 두고 언어 이름이 그대로인지 확인합니다. 표식을 넣으면 어디가 바뀌는지도 적습니다.
3. `permissions`에서 `storage`를 뺀 뒤 저장을 누릅니다. `lastError`가 어느 콜백에 생기는지 적습니다.

## 스스로 확인

1. 팝업의 `document`와 열린 탭의 `document`는 같은 객체입니까?

아닙니다. 팝업은 확장의 별도 문서입니다. 탭의 본문은 콘텐츠 스크립트가 다룹니다.

2. `chrome.storage.local`을 쓰려면 매니페스트에 무엇을 적습니까?

`permissions`에 `"storage"`를 적습니다. `host_permissions`로는 대신할 수 없습니다.

3. 왜 `<all_urls>`를 쓰지 않습니까?

주입 범위가 모든 사이트로 넓어지기 때문입니다. 이 예제는 `http://127.0.0.1/*`만 맞춥니다.

4. 오늘의 언어와 마지막 저장은 어떻게 다릅니까?

오늘은 연중 일수로 매번 계산합니다. 마지막 저장은 버튼을 눌렀을 때의 객체이고, 날짜가 바뀌어도 덮어쓰지 않습니다.

5. `demo.html`을 파일로 열면 왜 이름이 표시되지 않습니까?

콘텐츠 스크립트 패턴이 `http://127.0.0.1/*`뿐이고, 파일 URL 접근을 요청하지 않기 때문입니다.
