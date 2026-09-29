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
