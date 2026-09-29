export const languages = [
  { slug: "python", name: "Python", year: 1991, paradigm: "다중 패러다임", summary: "들여쓰기로 블록을 나누고, 동적 타입으로 스크립트와 데이터 처리를 작성합니다." },
  { slug: "javascript", name: "JavaScript", year: 1995, paradigm: "다중 패러다임", summary: "브라우저와 서버 런타임에서 이벤트 루프와 비동기 호출을 다룹니다." },
  { slug: "go", name: "Go", year: 2009, paradigm: "명령형", summary: "고루틴과 채널로 동시성을 표현하고, 문법은 작게 유지합니다." },
  { slug: "rust", name: "Rust", year: 2010, paradigm: "다중 패러다임", summary: "소유권과 빌림으로 메모리 안전을 컴파일 시점에 검사합니다." },
  { slug: "typescript", name: "TypeScript", year: 2012, paradigm: "다중 패러다임", summary: "JavaScript에 정적 타입을 얹고, 기존 파일부터 점진적으로 도입합니다." },
  { slug: "kotlin", name: "Kotlin", year: 2011, paradigm: "객체지향", summary: "널 가능 타입을 타입 시스템에서 구분하고 JVM 바이트코드로 컴파일합니다." },
  { slug: "elixir", name: "Elixir", year: 2011, paradigm: "함수형", summary: "BEAM 프로세스와 패턴 매칭으로 동시성과 분기를 작성합니다." },
  { slug: "zig", name: "Zig", year: 2016, paradigm: "명령형", summary: "호출자가 넘긴 할당자를 쓰고, comptime으로 컴파일 시점 코드를 실행합니다." },
  { slug: "dart", name: "Dart", year: 2011, paradigm: "객체지향", summary: "널 안전과 AOT 컴파일로 클라이언트 UI를 작성합니다." },
  { slug: "haskell", name: "Haskell", year: 1990, paradigm: "함수형", summary: "순수 함수가 기본이고, 효과는 타입으로 구분합니다." },
];

export function getLanguage(slug) {
  return languages.find((language) => language.slug === slug) ?? null;
}
