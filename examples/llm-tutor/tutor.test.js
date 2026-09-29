import assert from "node:assert/strict";
import { answer } from "./tutor.js";

const question = "Rust의 메모리 안전은 무엇으로 돕나요?";
const { messages, reply } = answer(question);

assert.equal(messages.length, 3);
assert.equal(messages[0].role, "system");
assert.equal(messages[1].role, "user");
assert.equal(messages[1].content, question);
assert.equal(messages[2].role, "assistant");
assert.equal(messages[2].content, reply);
assert.match(reply, /Rust/);
assert.match(reply, /소유권|메모리/);

const aboutGo = answer("Go의 동시성은 무엇으로 표현하나요?");
assert.match(aboutGo.reply, /Go/);
assert.match(aboutGo.reply, /고루틴/);

const algorithm = answer("알고리즘의 복잡도를 묻습니다");
assert.doesNotMatch(algorithm.reply, /고루틴/);

console.log("ok");
