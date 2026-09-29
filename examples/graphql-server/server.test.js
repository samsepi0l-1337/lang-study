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
