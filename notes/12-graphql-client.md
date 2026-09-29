---
title: "GraphQL 클라이언트"
slug: graphql-client
order: 12
level: "중급"
minutes: 40
tags: [GraphQL]
summary: "executeAgainst가 data를 반환하거나 errors를 던지고, normalize가 언어를 id 맵으로 접습니다."
---

# GraphQL 클라이언트

이 노트는 samsepi0l이 GraphQL 실행 결과를 화면이 소비하는 방식으로 정리한 것입니다. 서버의 `run`은 `{ data, errors }`를 반환합니다. 화면마다 이 객체를 풀어 쓰면, 오류가 있는데도 목록을 그리는 곳이 생깁니다. `executeAgainst(run, query, variables)`는 성공이면 `data`만 반환하고, `errors`가 있으면 예외를 던집니다. `normalize`는 언어 배열을 id 맵으로 바꿉니다.

클라이언트 폴더에는 `graphql` 패키지를 두지 않습니다. 테스트는 `examples/graphql-server`에 설치된 패키지를, 상대 경로로 가져온 `run`을 통해 사용합니다.

## 이 장을 끝내면

- 쿼리 문서, 변수, 뮤테이션 반환 필드를 구분합니다.
- `errors`가 있으면 `data`를 성공으로 보지 않는 이유를 설명합니다.
- `normalize`로 만든 id 맵에 다른 쿼리 결과를 같은 키로 합칩니다.

## 문서는 문자열이고 값은 변수입니다

쿼리는 문자열이지만 스키마가 검증합니다. 필요한 필드만 중괄호 안에 적습니다. 목록이면 `languages`의 선택 집합을, 한 건이면 `language`를 적습니다. 변수를 문서 안에 이어 붙이면 따옴표와 특수 문자가 쿼리를 깨뜨립니다.

문서는 `$paradigm: String`처럼 선언하고, 세 번째 인자로 `{ paradigm: "함수형" }`을 넘깁니다. `run`이 그 객체를 GraphQL 변수로 전달합니다. `$id: ID!`는 필수입니다. 변수를 빼면 결과가 `errors`가 되고 이 클라이언트는 예외를 던집니다. 없는 id를 넘기면 스키마가 널을 허용하므로 `data.language`는 `null`이고 예외는 아닙니다.

## 뮤테이션도 문서입니다

`addLanguage`는 서버의 메모리 배열을 바꿉니다. 만든 언어를 받으려면 반환 필드 `id`, `name`, `paradigm`, `year`를 적습니다. 필드를 비우면 스키마 검증이 실패합니다. 변수는 `$name`, `$paradigm`, `$year`이고 id는 클라이언트가 만들지 않습니다.

성공하면 `data.addLanguage`가 언어 객체입니다. 그 객체를 id 키로 맵에 넣으면, 다음 목록을 다시 받기 전에 방금 만든 값을 찾을 수 있습니다. 이 맵은 응답 저장소가 아니라 이미 받은 객체를 id로 정리한 표입니다.

## errors가 있으면 성공이 아닙니다

`graphql()`은 검증 실패와 리졸버 예외를 대개 던지지 않고 `errors` 배열로 돌려줍니다. `data`가 일부 채워진 채 `errors`가 함께 올 수도 있습니다. `executeAgainst`는 그 배열의 길이가 1 이상이면 `Error`를 던지고, 원본 배열을 예외의 `errors` 속성에 붙입니다. 일부만 채워진 결과를 성공으로 넘기지 않기 위해서입니다. `run` 자체가 예외를 던지면 그 예외는 그대로 올라갑니다.

테스트의 `languages { missing }`은 이 경로로 실패합니다. 예외의 `errors`가 비어 있지 않은 배열인지 확인합니다.

## id 하나가 언어 하나입니다

같은 언어가 목록과 단건에 모두 나올 수 있습니다. 화면마다 배열을 따로 두면 같은 id의 이름이 두 벌이 됩니다. `normalize`는 `Object.create(null)` 객체에 id를 키로 언어를 넣습니다. 프로토타입 키가 없어 id가 `constructor` 같은 이름과 부딪히지 않습니다. 같은 id가 다시 오면 나중 값이 덮어씁니다.

만료 시간, 요청 중복 제거, 낙관적 갱신은 없습니다. 핵심은 엔티티를 id당 한 칸에 둔다는 점입니다. 테스트는 `함수형` 목록으로 `elixir`와 `haskell`을 넣고, `python` 단건을 같은 맵에 합친 뒤 이전 엔티티가 남는지 봅니다. 이어서 `Lua` 뮤테이션 결과도 `lua` 키에 넣습니다.

## 예제

`examples/graphql-server`에서 먼저 `npm install`을 합니다. 그다음 `examples/graphql-client`에서 `node client.test.js`를 실행합니다. 클라이언트 패키지의 `type`은 `module`이고 의존성은 없습니다.

`examples/graphql-client/package.json`

```json
{
  "name": "language-graphql-client",
  "private": true,
  "type": "module"
}
```

`examples/graphql-client/client.js`

```javascript
export async function executeAgainst(run, query, variables) {
  const result = await run(query, variables);
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    const failure = new Error(result.errors.map((error) => error.message).join("\n"));
    failure.errors = result.errors;
    throw failure;
  }
  return result.data;
}

export function normalize(languages) {
  const byId = Object.create(null);
  for (const language of languages) {
    byId[language.id] = language;
  }
  return byId;
}
```

`examples/graphql-client/client.test.js`

```javascript
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
```

## 연습

1. `data`와 `errors`가 함께 오면 지금처럼 던지는 동작을 기본값으로 유지합니다. 호출자가 부분 데이터를 원할 때만 결과 객체를 그대로 돌려주는 인자를 추가하고, 기본 호출 테스트는 깨지지 않게 합니다.
2. 이미 있는 id에 `year`가 다른 객체를 `normalize`하면 덮어쓰는지 테스트로 고정합니다. 이전 객체를 남기도록 정책을 바꿀 때는 그 테스트를 먼저 실패시킵니다.
3. `ID!` 변수를 생략한 문서를 `executeAgainst`에 넘기고, `errors`가 붙은 예외가 나는지 확인합니다. 값을 쿼리 문자열에 이어 붙이지 않습니다.

## 스스로 확인

1. 패러다임을 쿼리 문자열에 이어 붙이지 않는 이유는 무엇입니까?

따옴표와 특수 문자가 문서를 깨뜨립니다. `$paradigm`을 선언하고 변수 객체로 값을 넘깁니다.

2. `errors`가 있는데 `data`도 있으면 이 클라이언트는 어떻게 합니까?

`Error`를 던지고 원본 배열을 `errors` 속성에 붙입니다. `data`만 반환하지 않습니다.

3. `language(id: "cobol")`은 왜 예외가 아닙니까?

스키마가 그 필드의 널을 허용합니다. `data.language`가 `null`이고 `errors`는 없습니다.

4. 정규화 맵의 키는 무엇입니까?

언어의 `id`입니다. `함수형` 쿼리 뒤에는 `elixir`와 `haskell`이 있고, 단건 쿼리로 `python`을 같은 객체에 넣습니다.

5. 클라이언트 폴더에 `graphql`이 없어도 테스트가 되는 이유는 무엇입니까?

`client.test.js`가 `../graphql-server/server.js`의 `run`을 상대 경로로 import합니다. `graphql` 패키지는 그 서버 폴더에 있습니다.
