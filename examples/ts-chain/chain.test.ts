import assert from "node:assert/strict";
import { Chain, emptyPreviousHash, hashBlock } from "./chain.ts";

const chain = new Chain();
assert.equal(chain.validate(), true);

const first = chain.append(
  {
    language: "Dart",
    title: "널을 타입에 적는다",
    text: "String? 는 값이 없을 수 있음을 타입으로 말합니다.",
  },
  "2026-04-01T00:00:00.000Z",
);
const second = chain.append(
  {
    language: "TypeScript",
    title: "제안을 블록에 남긴다",
    text: "각 블록은 언어 제안 하나와 이전 해시를 가집니다.",
  },
  "2026-04-02T00:00:00.000Z",
);

assert.equal(chain.validate(), true);
assert.equal(first.index, 0);
assert.equal(second.index, 1);
assert.equal(first.previousHash, emptyPreviousHash);
assert.equal(second.previousHash, first.hash);
assert.equal(first.hash.length, 64);
assert.notEqual(first.hash, second.hash);

const savedText = first.proposal.text;
first.proposal.text = "본문을 갈아 끼운 제안";
assert.equal(chain.validate(), false);
first.proposal.text = savedText;
assert.equal(chain.validate(), true);

second.previousHash = emptyPreviousHash;
second.hash = hashBlock({
  index: second.index,
  timestamp: second.timestamp,
  proposal: second.proposal,
  previousHash: second.previousHash,
});
assert.notEqual(second.previousHash, first.hash);
assert.equal(chain.validate(), false);

console.log("chain.test.ts passed");
