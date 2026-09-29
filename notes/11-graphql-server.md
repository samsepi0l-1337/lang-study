---
title: "GraphQL 서버"
slug: graphql-server
order: 11
level: "중급"
minutes: 40
tags: [GraphQL]
summary: "언어 카탈로그를 스키마와 리졸버로 나누고, 포트를 열지 않은 채 graphql()로 쿼리와 뮤테이션을 실행합니다."
---

# GraphQL 서버

이 노트는 samsepi0l이 언어 카탈로그의 GraphQL 서버를 `graphql` 패키지만으로 정리한 것입니다. 스키마가 필드와 널 여부를 먼저 정하고, 리졸버는 메모리 배열을 읽거나 고칩니다. 테스트는 HTTP 포트를 열지 않고 `run(query, variables)`만 호출합니다.

시드 id는 `python`, `javascript`, `go`, `rust`, `typescript`, `kotlin`, `elixir`, `zig`, `dart`, `haskell`입니다. `year`는 이 노트가 고정한 최초 공개 연도입니다.

## 이 장을 끝내면

- `Language`, `Query`, `Mutation`에서 널 허용이 응답 모양을 어떻게 바꾸는지 설명합니다.
- 변수, 리졸버 인자, 메모리 db 갱신, `errors` 배열을 구분합니다.
- 쿼리 둘과 뮤테이션 하나를 포트 없이 실행합니다.

## 스키마가 응답의 모양을 고정합니다

`buildSchema`에 넣는 타입은 세 개입니다. `Language`의 `id`, `name`, `paradigm`, `year`는 모두 `!`라서 널이 아닙니다. `languages(paradigm: String)`의 반환은 `[Language!]!`입니다. 목록과 원소 모두 널이 아니고, 일치가 없어도 `null`이 아니라 `[]`입니다. 인자 `paradigm`은 생략할 수 있습니다.

인자가 `null` 또는 `undefined`이면 열 개를 모두 반환합니다. 문자열이면 패러다임이 완전히 같은 언어만, 시드 순서대로 반환합니다. `함수형`은 Elixir와 Haskell입니다. 빈 문자열은 값이 있는 조건이라 일치가 없으면 빈 배열입니다.

`language(id: ID!)`는 id가 필수이고 반환은 널을 허용합니다. 없는 id는 오류가 아니라 `null`입니다. `addLanguage`는 `name`, `paradigm`, `year`가 필수이고 반환 `Language`는 널이 아닙니다. 다른 타입은 추가하지 않습니다. 테스트가 필드 타입 문자열을 확인합니다.

## 리졸버는 db 배열을 직접 고칩니다

`db.languages`는 프로세스 메모리의 배열입니다. 요청마다 새 배열을 만들지 않습니다. 뮤테이션이 `push`하고, 같은 프로세스의 다음 `run`이 그 변화를 봅니다. 프로세스가 끝나면 사라집니다.

`graphql`은 루트 객체의 함수를 `(args, context, info)`로 호출합니다. 이 예제는 첫 인자만 씁니다. `addLanguage`는 이름의 앞뒤 공백을 빼고 소문자로 만든 뒤 공백을 `-`로 바꿔 id로 씁니다. `Lua`는 `lua`가 됩니다. 같은 id가 있으면 예외를 던집니다. 반환 타입이 널을 허용하지 않으므로 그 필드는 `null`이 되고, 오류는 `errors`에 남습니다. 배열 길이는 늘지 않습니다.

`run(query, variables)`는 `graphql({ schema, source, rootValue, variableValues })`의 결과를 반환합니다. 변수는 쿼리 문자열 밖의 값입니다. `$paradigm` 같은 선언과 객체 키를 맞춥니다. 문자열을 이어 붙이면 따옴표가 문서를 깨뜨립니다.

## 포트는 직접 실행할 때만 엽니다

`start`는 `POST /graphql`만 받습니다. 본문은 `{ query, variables }` JSON입니다. `query`가 문자열이 아니거나 JSON이 깨지면 HTTP 400입니다. `graphql()`이 돌려준 결과는 검증 오류가 있어도 HTTP 200이고, 본문에 `errors`가 있을 수 있습니다. GraphiQL은 붙이지 않습니다. 다른 경로는 404입니다.

`import.meta.url`이 이 파일의 실행 경로와 같을 때만 8787을 엽니다. `server.test.js`는 `run`, `schema`, `db`만 import하므로 listen하지 않습니다. 테스트가 포트를 잡으면 환경과 프로세스 수명에 묶입니다.

## 예제

`examples/graphql-server`에서 `npm install` 한 뒤 `node server.test.js`를 실행합니다. `node server.js`는 `POST http://127.0.0.1:8787/graphql`만 엽니다.

`examples/graphql-server/package.json`

```json
{
  "name": "language-graphql-server",
  "private": true,
  "type": "module",
  "dependencies": {
    "graphql": "16.14.2"
  }
}
```

`examples/graphql-server/server.js`

```javascript
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildSchema, graphql } from "graphql";

export const db = {
  languages: [
    { id: "python", name: "Python", paradigm: "다중 패러다임", year: 1991 },
    { id: "javascript", name: "JavaScript", paradigm: "다중 패러다임", year: 1995 },
    { id: "go", name: "Go", paradigm: "명령형", year: 2009 },
    { id: "rust", name: "Rust", paradigm: "다중 패러다임", year: 2010 },
    { id: "typescript", name: "TypeScript", paradigm: "다중 패러다임", year: 2012 },
    { id: "kotlin", name: "Kotlin", paradigm: "객체지향", year: 2011 },
    { id: "elixir", name: "Elixir", paradigm: "함수형", year: 2011 },
    { id: "zig", name: "Zig", paradigm: "명령형", year: 2016 },
    { id: "dart", name: "Dart", paradigm: "객체지향", year: 2011 },
    { id: "haskell", name: "Haskell", paradigm: "함수형", year: 1990 },
  ],
};

export const schema = buildSchema(`
  type Language {
    id: ID!
    name: String!
    paradigm: String!
    year: Int!
  }

  type Query {
    languages(paradigm: String): [Language!]!
    language(id: ID!): Language
  }

  type Mutation {
    addLanguage(name: String!, paradigm: String!, year: Int!): Language!
  }
`);

function languages({ paradigm }) {
  if (paradigm == null) return db.languages;
  return db.languages.filter((language) => language.paradigm === paradigm);
}

function language({ id }) {
  return db.languages.find((item) => item.id === id) ?? null;
}

function addLanguage({ name, paradigm, year }) {
  const id = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (db.languages.some((item) => item.id === id)) {
    throw new Error(`이미 있는 id입니다: ${id}`);
  }
  const created = { id, name, paradigm, year };
  db.languages.push(created);
  return created;
}

const rootValue = { languages, language, addLanguage };

export function run(query, variables) {
  return graphql({
    schema,
    source: query,
    rootValue,
    variableValues: variables,
  });
}

export function start(port = 8787) {
  const server = createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/graphql") {
      res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ errors: [{ message: "POST /graphql only" }] }));
      return;
    }
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString("utf8");
      const body = JSON.parse(raw || "{}");
      if (typeof body.query !== "string") {
        res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ errors: [{ message: "query 문자열이 필요합니다" }] }));
        return;
      }
      const result = await run(body.query, body.variables);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ errors: [{ message: String(error.message ?? error) }] }));
    }
  });
  return server.listen(port);
}

// 이 파일을 직접 실행할 때만 포트를 엽니다. import 되면 listen 하지 않습니다.
const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === entry) {
  start(8787);
  console.log("POST http://127.0.0.1:8787/graphql");
}
```

`examples/graphql-server/server.test.js`

```javascript
import { db, run, schema } from "./server.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const languageFields = schema.getType("Language").getFields();
assert(String(languageFields.id.type) === "ID!", "id");
assert(String(languageFields.name.type) === "String!", "name");
assert(String(languageFields.paradigm.type) === "String!", "paradigm");
assert(String(languageFields.year.type) === "Int!", "year");

const queryFields = schema.getQueryType().getFields();
assert(String(queryFields.languages.type) === "[Language!]!", "languages");
assert(String(queryFields.languages.args[0].type) === "String", "paradigm 인자");
assert(String(queryFields.language.type) === "Language", "language");
assert(String(queryFields.language.args[0].type) === "ID!", "id 인자");

const addField = schema.getMutationType().getFields().addLanguage;
assert(String(addField.type) === "Language!", "addLanguage");
const addArgs = Object.fromEntries(addField.args.map((arg) => [arg.name, String(arg.type)]));
assert(addArgs.name === "String!" && addArgs.paradigm === "String!" && addArgs.year === "Int!", "뮤테이션 인자");

const listed = await run(
  `query Languages($paradigm: String) {
    languages(paradigm: $paradigm) { id name paradigm year }
  }`,
  { paradigm: "함수형" },
);
if (listed.errors) throw new Error(listed.errors.map((error) => error.message).join("\n"));
assert(
  listed.data.languages.map((language) => language.id).join(",") === "elixir,haskell",
  "함수형 언어만, 시드 순서",
);

const one = await run(
  `query One($id: ID!) {
    language(id: $id) { id name year }
  }`,
  { id: "zig" },
);
if (one.errors) throw new Error(one.errors.map((error) => error.message).join("\n"));
assert(one.data.language.name === "Zig" && one.data.language.year === 2016, "zig");

const before = db.languages.length;
const added = await run(
  `mutation Add($name: String!, $paradigm: String!, $year: Int!) {
    addLanguage(name: $name, paradigm: $paradigm, year: $year) { id name paradigm year }
  }`,
  { name: "Lua", paradigm: "다중 패러다임", year: 1993 },
);
if (added.errors) throw new Error(added.errors.map((error) => error.message).join("\n"));
assert(added.data.addLanguage.id === "lua", "생성된 id");
assert(db.languages.length === before + 1 && db.languages.at(-1).name === "Lua", "db에 반영");

const duplicate = await run(
  `mutation Add($name: String!, $paradigm: String!, $year: Int!) {
    addLanguage(name: $name, paradigm: $paradigm, year: $year) { id }
  }`,
  { name: "Lua", paradigm: "다중 패러다임", year: 1993 },
);
assert(duplicate.errors?.some((error) => error.message.includes("lua")), "중복 id 오류");
assert(db.languages.length === before + 1, "중복은 db를 늘리지 않습니다");

console.log("server.test.js passed");
```

## 연습

1. `renameLanguage(id: ID!, name: String!): Language`를 추가합니다. id는 바꾸지 않고 이름만 바꿉니다. 없는 id는 `errors`에 들어가게 하고 테스트가 그 배열을 확인합니다.
2. 패러다임 비교를 대소문자 무시로 바꿀지 정합니다. 지금의 완전 일치 테스트는 깨지 않게 두고, `함수형`이 Elixir와 Haskell만 남기는지 유지합니다.
3. `server.test.js`에서는 `start`를 호출하지 않습니다. 서버를 직접 실행했을 때만 `POST /graphql`이 JSON을 반환하는지 따로 확인합니다.

## 스스로 확인

1. `languages`의 결과가 비어 있을 때 왜 `null`이 아닙니까?

반환 타입이 `[Language!]!`라서 목록은 항상 배열입니다. 원소가 없으면 `[]`입니다.

2. `language(id: "cobol")`의 `data`와 `errors`는 어떻게 됩니까?

반환 타입이 널을 허용하므로 `data.language`는 `null`입니다. 못 찾은 것만으로는 `errors`가 생기지 않습니다.

3. `addLanguage`가 예외를 던지면 포트를 열지 않아도 어떻게 알 수 있습니까?

`run`이 `graphql()`의 결과 객체를 반환합니다. 리졸버 예외는 `errors`의 `message`로 들어오고 `data.addLanguage`는 `null`입니다.

4. 테스트가 8787을 listen하면 안 되는 이유는 무엇입니까?

테스트는 함수 호출만으로 쿼리와 뮤테이션을 확인해야 합니다. `node server.js`로 직접 실행할 때만 `start`가 호출됩니다.

5. 클라이언트가 id를 넘기지 않는 이유는 무엇입니까?

뮤테이션 인자는 `name`, `paradigm`, `year`입니다. id는 서버가 이름에서 만들고, 같은 id면 예외로 중복을 막습니다.
