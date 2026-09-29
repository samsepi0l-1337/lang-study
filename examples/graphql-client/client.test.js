import { run } from "../graphql-server/server.js";
import { executeAgainst, normalize } from "./client.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const listQuery = `
  query LanguagesByParadigm($paradigm: String) {
    languages(paradigm: $paradigm) {
      id
      name
      paradigm
      year
    }
  }
`;

const oneQuery = `
  query LanguageById($id: ID!) {
    language(id: $id) {
      id
      name
      paradigm
      year
    }
  }
`;

const addQuery = `
  mutation AddLanguage($name: String!, $paradigm: String!, $year: Int!) {
    addLanguage(name: $name, paradigm: $paradigm, year: $year) {
      id
      name
      paradigm
      year
    }
  }
`;

const data = await executeAgainst(run, listQuery, { paradigm: "함수형" });
const cache = normalize(data.languages);
assert(cache.haskell.name === "Haskell", "haskell 캐시");
assert(cache.elixir.paradigm === "함수형", "elixir 캐시");
assert(cache.python === undefined, "이번 결과에는 python이 없습니다");
assert(Object.keys(cache).sort().join(",") === "elixir,haskell", "캐시 키");

const python = await executeAgainst(run, oneQuery, { id: "python" });
cache[python.language.id] = python.language;
assert(cache.python.name === "Python", "id로 합칩니다");
assert(cache.haskell.year === 1990, "이미 있던 엔티티는 남습니다");

const missing = await executeAgainst(run, oneQuery, { id: "cobol" });
assert(missing.language === null, "없는 언어는 null");

const created = await executeAgainst(run, addQuery, {
  name: "Lua",
  paradigm: "다중 패러다임",
  year: 1993,
});
assert(created.addLanguage.id === "lua", "뮤테이션 id");
cache[created.addLanguage.id] = created.addLanguage;
assert(cache.lua.year === 1993, "뮤테이션 결과를 캐시에 넣습니다");

const brokenQuery = `
  query {
    languages {
      missing
    }
  }
`;

let failed = false;
try {
  await executeAgainst(run, brokenQuery);
} catch (error) {
  failed = Array.isArray(error.errors) && error.errors.length > 0;
  if (!failed) throw error;
}
assert(failed, "errors가 있으면 예외를 던집니다");

console.log("client.test.js passed");
