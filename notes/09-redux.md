---
title: "Redux로 상태 설계하기"
slug: redux
order: 9
level: "중급"
minutes: 40
tags: [Redux]
summary: "언어 목록, 선택, 즐겨찾기를 스토어 하나와 순수 리듀서 전이로 고정합니다."
---

# Redux로 상태 설계하기

이 노트는 samsepi0l이 언어 카탈로그의 공유 상태를 Redux의 최소 형태로 정리한 것입니다. 목록이 열 개 언어를 보여주고 상세가 그중 하나를 가리키며 즐겨찾기가 같은 id를 켜고 끈다면, 그 값은 한 트리에 있어야 합니다. 컴포넌트마다 복사본을 두면 어느 값이 최신인지 테스트로 말하기 어렵습니다.

상태는 트리 하나에 두고, 그 트리를 바꾸는 함수는 순수하게 유지합니다. 예제는 `@reduxjs/toolkit`을 설치하지 않습니다. `year`는 이 노트가 고정한 최초 공개 연도이고, Rust는 2010입니다.

## 이 장을 끝내면

- 단일 스토어, 액션, 순수 리듀서, `dispatch`, `subscribe`를 구분합니다.
- 도메인 상태인 `languages`와 UI 상태인 `selectedId`, `favorites`를 한 객체에 명시합니다.
- `language/added`, `language/selected`, `favorite/toggled`가 이전 상태를 바꾸지 않는지 확인합니다.

## 상태 트리는 하나입니다

`initialState`는 세 필드를 가집니다.

`languages`는 `{ id, name, year, paradigm }`의 배열입니다. id는 1부터 10까지의 숫자입니다. Python이 1이고 Haskell이 10입니다. 이름, 연도, 패러다임은 화면이 생기기 전에 정해 둔 사실이므로 도메인 상태입니다.

`selectedId`는 언어 id 또는 `null`입니다. 처음에는 `null`이며, 아직 고르지 않았음을 값으로 남깁니다. `favorites`는 언어 id의 배열이고 문자열이 아닙니다.

검색창에 치는 글자처럼 그 입력만 알면 되는 값은 넣지 않습니다. 목록과 상세가 같은 선택과 같은 즐겨찾기를 봐야 하면, UI 상태라도 스토어에 둡니다. 숨기면 화면이 각자 다른 답을 가지고, 명시하면 전이를 테스트할 수 있습니다.

스토어를 언어용과 즐겨찾기용으로 나누지 않습니다. 한 번의 클릭을 두 트리가 나누어 설명하면 순서가 흔들립니다.

## 액션은 일어난 일의 기록입니다

액션은 `type`과 `payload`를 가진 평범한 객체입니다. 리듀서는 `type` 문자열만 보고 분기합니다. 슬래시는 영역과 동작을 나눌 뿐 특별한 문법이 아닙니다.

`language/added`의 payload는 `{ id, name, year, paradigm }`입니다. 예제는 중복 id를 검사하지 않습니다. id는 호출자가 정합니다. `language/selected`의 payload는 숫자 id입니다. 그 id가 목록에 있는지는 보지 않습니다. 없는 선택을 막을지는 화면이나 다음 액션의 몫입니다.

`favorite/toggled`의 payload도 숫자 id입니다. `favorites`에 있으면 빼고, 없으면 뒤에 붙입니다. 순서는 토글한 순서를 유지합니다. 오타가 난 `type`은 `default`로 빠져 상태가 그대로입니다.

## 리듀서는 순수 함수입니다

`languagesReducer(state, action)`은 다음 상태를 반환합니다. 같은 입력은 같은 결과를 내고, 받은 객체와 배열을 고치지 않으며, 네트워크나 현재 시각을 읽지 않습니다. `state`가 `undefined`이면 매개변수 기본값으로 `initialState`를 씁니다.

배열에 `push`하면 이전 상태가 바뀝니다. 다음 상태는 새 객체와 새 배열입니다. 언어 객체 자체는 얕게 재사용합니다. `dispatch` 뒤에 payload의 필드를 고치면 스토어 안의 객체가 같이 바뀌므로, 넣은 뒤에는 고치지 않습니다.

초기 상태에서 payload `4`로 `favorite/toggled`를 적용하면 `favorites`는 `[4]`인 새 배열입니다. 같은 액션을 다시 적용하면 `[]`입니다. 그 두 전이에서 `languages` 참조와 `selectedId`는 유지됩니다. 모르는 `type`이면 받은 state 참조를 그대로 반환합니다.

## dispatch와 subscribe

`createStore(reducer, preloadedState)`는 현재 상태를 변수 하나에 둡니다. `getState`는 그 참조를 반환합니다. 복사본이 아니므로 호출자가 필드를 직접 고치면 스토어가 오염됩니다. 갱신은 `dispatch`로만 합니다.

`dispatch`는 리듀서로 다음 상태를 계산하고, 구독 함수를 호출한 뒤 액션을 반환합니다. 알림 도중 해제가 목록을 줄여도 다음 리스너를 건너뛰지 않도록, 호출 전에 리스너 배열을 복사합니다. `subscribe`는 해제 함수를 반환합니다. 해제 뒤에도 `dispatch`는 상태를 갱신하고, 그 리스너만 다시 호출되지 않습니다.

생성 직후 `{ type: "@@INIT" }`을 dispatch합니다. 구독자가 아직 없으므로 리스너는 돌지 않습니다. `preloadedState`가 없으면 리듀서 기본값이 채워집니다. 객체를 넘기면 `@@INIT`은 `default`로 빠지고 그 객체가 현재 상태가 됩니다. 시드 열 개는 state가 `undefined`일 때만 들어옵니다.

## Redux Toolkit은 나중 선택지입니다

액션 문자열과 `switch`를 직접 쓰면 전이가 파일 안에 드러납니다. 상태가 커지면 같은 형태의 코드가 늘어납니다. Redux Toolkit의 `configureStore`와 `createSlice`는 불변 갱신과 액션 생성자를 줄여 줍니다. 이 장의 예제는 그 패키지 없이 `node store.test.js`로 동작합니다.

## 예제

`examples/redux`에서 의존성 설치 없이 `node store.test.js`를 실행합니다. 전이가 틀리면 테스트가 예외를 던집니다.

`examples/redux/package.json`

```json
{
  "name": "redux-languages",
  "private": true,
  "type": "module"
}
```

`examples/redux/store.js`

```javascript
export const initialState = {
  languages: [
    { id: 1, name: "Python", year: 1991, paradigm: "다중 패러다임" },
    { id: 2, name: "JavaScript", year: 1995, paradigm: "다중 패러다임" },
    { id: 3, name: "Go", year: 2009, paradigm: "명령형" },
    { id: 4, name: "Rust", year: 2010, paradigm: "다중 패러다임" },
    { id: 5, name: "TypeScript", year: 2012, paradigm: "다중 패러다임" },
    { id: 6, name: "Kotlin", year: 2011, paradigm: "객체지향" },
    { id: 7, name: "Elixir", year: 2011, paradigm: "함수형" },
    { id: 8, name: "Zig", year: 2016, paradigm: "명령형" },
    { id: 9, name: "Dart", year: 2011, paradigm: "객체지향" },
    { id: 10, name: "Haskell", year: 1990, paradigm: "함수형" },
  ],
  selectedId: null,
  favorites: [],
};

export function languagesReducer(state = initialState, action) {
  switch (action.type) {
    case "language/added":
      return {
        ...state,
        languages: [...state.languages, action.payload],
      };
    case "language/selected":
      return { ...state, selectedId: action.payload };
    case "favorite/toggled": {
      const id = action.payload;
      const exists = state.favorites.includes(id);
      const favorites = exists
        ? state.favorites.filter((item) => item !== id)
        : [...state.favorites, id];
      return { ...state, favorites };
    }
    default:
      return state;
  }
}

export function createStore(reducer, preloadedState) {
  let state = preloadedState;
  const listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);
    for (const listener of listeners.slice()) listener();
    return action;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index !== -1) listeners.splice(index, 1);
    };
  }

  dispatch({ type: "@@INIT" });
  return { getState, dispatch, subscribe };
}
```

`examples/redux/store.test.js`

```javascript
import { createStore, initialState, languagesReducer } from "./store.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const seeded = languagesReducer(undefined, { type: "@@INIT" });
assert(seeded.languages.length === 10, "시드 개수");
assert(seeded.languages[0].id === 1 && seeded.languages[0].name === "Python", "python");
assert(seeded.languages[9].id === 10 && seeded.languages[9].name === "Haskell", "haskell");
assert(seeded.selectedId === null, "선택 없음");
assert(seeded.favorites.length === 0, "즐겨찾기 없음");

const added = languagesReducer(seeded, {
  type: "language/added",
  payload: { id: 11, name: "Lua", year: 1993, paradigm: "다중 패러다임" },
});
assert(seeded.languages.length === 10, "추가가 이전 배열을 바꾸면 안 됩니다");
assert(added.languages !== seeded.languages, "언어 배열은 새 참조입니다");
assert(added.languages.length === 11 && added.languages[10].name === "Lua", "Lua 추가");

const selected = languagesReducer(added, { type: "language/selected", payload: 4 });
assert(selected.selectedId === 4, "Rust 선택");
assert(added.selectedId === null, "선택이 이전 상태를 바꾸면 안 됩니다");

const on = languagesReducer(selected, { type: "favorite/toggled", payload: 4 });
assert(on.favorites.length === 1 && on.favorites[0] === 4, "즐겨찾기 추가");
assert(on.favorites !== selected.favorites, "즐겨찾기 배열은 새 참조입니다");
const off = languagesReducer(on, { type: "favorite/toggled", payload: 4 });
assert(off.favorites.length === 0, "즐겨찾기 해제");
assert(on.favorites.length === 1, "해제가 이전 배열을 바꾸면 안 됩니다");

const kept = languagesReducer(off, { type: "language/unknown" });
assert(kept === off, "모르는 액션은 같은 상태를 반환합니다");

const store = createStore(languagesReducer);
assert(store.getState().languages.length === 10, "스토어 시드");
let calls = 0;
const stop = store.subscribe(() => {
  calls += 1;
});
store.dispatch({ type: "language/selected", payload: 7 });
assert(store.getState().selectedId === 7, "dispatch 선택");
assert(calls === 1, "subscribe 호출");
stop();
store.dispatch({ type: "favorite/toggled", payload: 7 });
assert(calls === 1, "unsubscribe 이후에는 리스너가 돌지 않습니다");
assert(store.getState().favorites[0] === 7, "해제 뒤에도 dispatch는 상태를 바꿉니다");

const custom = createStore(languagesReducer, {
  languages: [{ id: 8, name: "Zig", year: 2016, paradigm: "명령형" }],
  selectedId: 8,
  favorites: [8],
});
assert(custom.getState().languages.length === 1, "preloadedState 언어");
assert(custom.getState().selectedId === 8, "preloadedState 선택");
assert(custom.getState().favorites[0] === 8, "preloadedState 즐겨찾기");
assert(initialState.favorites.length === 0, "모듈 초기 상태는 그대로입니다");

console.log("store.test.js passed");
```

## 연습

1. `language/removed`를 추가합니다. payload는 id 숫자입니다. 없는 id를 지워도 언어 배열이 그대로인지 실패하는 테스트를 먼저 만들고, 그다음 새 배열로 제거합니다.
2. `favorite/toggled`가 목록에 없는 id도 넣는 현재 동작을, 목록에 있는 id만 토글하도록 바꿉니다. 없는 id를 보내는 테스트가 먼저 실패해야 합니다.
3. 리스너 안에서 다시 `dispatch`하면 알림이 중첩됩니다. 재진입을 막을지, 허용하되 순서를 고정할지 한 문장으로 정하고 그 결정을 테스트로 고정합니다.

## 스스로 확인

1. 리듀서 안에서 원격 호출을 하면 왜 테스트가 불안정해집니까?

같은 액션인데도 응답에 따라 다음 상태가 달라지고, 함수가 순수하지 않게 됩니다. 원격 결과가 끝나면 그 값을 payload로 하는 별도의 액션을 dispatch합니다.

2. `selectedId`를 상세 화면의 지역 상태에만 두면 무엇이 깨집니까?

목록과 상세가 서로의 선택을 모릅니다. 스토어에 두면 두 화면이 같은 값을 읽고 같은 `language/selected`로 바꿉니다.

3. 같은 id로 `favorite/toggled`를 두 번 적용하면 `favorites`는 어떻게 됩니까?

한 번은 추가되고 한 번은 빠져 그 id가 없는 상태로 돌아옵니다. 다른 id는 유지됩니다.

4. 모르는 `type`을 dispatch하면 왜 `getState()` 참조가 같습니까?

`default`가 받은 state를 그대로 반환하고, 스토어는 그 반환값을 현재 상태로 저장하기 때문입니다.

5. `preloadedState`를 넘기면 시드 열 개가 왜 사라질 수 있습니까?

생성 때의 `@@INIT`은 `default`로 빠지고, 넘긴 객체가 그대로 현재 상태가 됩니다. 시드는 state가 `undefined`일 때만 적용됩니다.
