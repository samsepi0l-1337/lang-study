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
