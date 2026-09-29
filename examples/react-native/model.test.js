import assert from "node:assert/strict";
import { createDeck, review } from "./model.js";

const deck = createDeck();
assert.equal(deck.length, 3);
assert.equal(deck[0].name, "Dart");
assert.equal(deck[0].streak, 0);

const once = review(deck[0], "good");
assert.equal(once.streak, 1);
assert.equal(deck[0].streak, 0);

const twice = review(once, "good");
assert.equal(twice.streak, 2);
const reset = review(twice, "again");
assert.equal(reset.streak, 0);
assert.equal(review(reset, "again").streak, 0);

assert.throws(() => review(deck[0], "easy"), /unknown grade/);
assert.equal(deck[0].streak, 0);

const fresh = createDeck();
assert.notEqual(fresh[0], deck[0]);
assert.equal(fresh[0].streak, 0);

console.log("model.test.js passed");
