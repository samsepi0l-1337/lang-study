import assert from "node:assert/strict";
import { Signaling } from "./signaling.js";

const room = new Signaling();
assert.equal(room.state, "idle");
assert.equal(room.offer("v=0 offer"), "have-offer");
assert.equal(room.state, "have-offer");
assert.equal(room.offerSdp, "v=0 offer");

assert.throws(() => room.offer("v=0 again"), /double-offer/);
assert.equal(room.state, "have-offer");
assert.equal(room.offerSdp, "v=0 offer");

assert.equal(room.answer("v=0 answer"), "connected");
assert.equal(room.state, "connected");
assert.equal(room.answerSdp, "v=0 answer");
assert.throws(() => room.offer("v=0 late"), /double-offer/);
assert.throws(() => room.answer("v=0 late"), /answer requires have-offer/);

const early = new Signaling();
assert.throws(() => early.answer("v=0 early"), /answer requires have-offer/);
assert.equal(early.state, "idle");
assert.throws(() => early.offer(""), /non-empty string/);
assert.equal(early.state, "idle");

console.log("signaling.test.js passed");
