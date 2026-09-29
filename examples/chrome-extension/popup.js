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
