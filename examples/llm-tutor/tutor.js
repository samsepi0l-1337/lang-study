/**
 * 열 개 언어의 로컬 튜터입니다.
 * 네트워크와 API 키는 사용하지 않습니다.
 */

export const catalog = [
  {
    name: "Python",
    keywords: ["python", "파이썬"],
    fact: "Python은 들여쓰기로 블록을 나타내고, 동적 타입으로 값을 다룹니다.",
  },
  {
    name: "JavaScript",
    keywords: ["javascript", "js", "자바스크립트"],
    fact: "JavaScript는 이벤트 루프 위에서 비동기 작업을 이어 갑니다.",
  },
  {
    name: "Go",
    keywords: ["go", "golang"],
    fact: "Go는 고루틴으로 가벼운 동시 실행을 표현합니다.",
  },
  {
    name: "Rust",
    keywords: ["rust", "러스트"],
    fact: "Rust는 소유권으로 메모리 안전을 돕습니다.",
  },
  {
    name: "TypeScript",
    keywords: ["typescript", "타입스크립트"],
    fact: "TypeScript의 타입은 컴파일되면 JavaScript로 지워집니다.",
  },
  {
    name: "Kotlin",
    keywords: ["kotlin", "코틀린"],
    fact: "Kotlin은 널 가능 여부를 타입으로 구분합니다.",
  },
  {
    name: "Elixir",
    keywords: ["elixir", "엘릭서"],
    fact: "Elixir는 BEAM의 가벼운 프로세스로 상태를 격리합니다.",
  },
  {
    name: "Zig",
    keywords: ["zig", "지그"],
    fact: "Zig는 메모리 할당자를 호출하는 쪽에서 넘깁니다.",
  },
  {
    name: "Dart",
    keywords: ["dart", "다트"],
    fact: "Dart는 사운드 널 안전성을 타입 시스템에 둡니다.",
  },
  {
    name: "Haskell",
    keywords: ["haskell", "하스켈"],
    fact: "Haskell은 순수 함수와 지연 평가를 기본으로 합니다.",
  },
];

const SYSTEM =
  "당신은 열 개 언어의 로컬 카탈로그만 읽는 튜터입니다. 고른 문장만 답하고, 카탈로그 밖 사실은 만들지 않습니다.";

function mentions(text, keyword) {
  if (/^[a-z0-9]+$/i.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(
      text,
    );
  }
  return text.toLowerCase().includes(keyword.toLowerCase());
}

export function answer(question) {
  const text = String(question ?? "");
  const hits = catalog.filter((item) =>
    item.keywords.some((keyword) => mentions(text, keyword)),
  );
  const reply =
    hits.length === 0
      ? `카탈로그에서 언어를 찾지 못했습니다. 이름 후보: ${catalog
          .map((item) => item.name)
          .join(", ")}.`
      : hits.map((item) => `${item.name}: ${item.fact}`).join("\n");
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: text },
    { role: "assistant", content: reply },
  ];
  return { messages, reply };
}
