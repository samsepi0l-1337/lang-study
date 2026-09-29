import assert from 'node:assert/strict';
import { createService } from './booking.js';

let current = 1_750_000_000_000;
const service = createService(() => current);

const rust = service.addWorkshop({
  language: 'Rust',
  title: '소유권 모델 실습',
  startsAt: current + 3_600_000,
  seats: 2,
});
assert.equal(rust.ok, true);

const first = service.reserve(rust.workshop.id, 'samsepi0l');
assert.equal(first.ok, true);
assert.equal(first.reservation.name, 'samsepi0l');
assert.equal(service.listWorkshops().find((row) => row.id === rust.workshop.id).reserved, 1);

const duplicate = service.reserve(rust.workshop.id, ' samsepi0l ');
assert.equal(duplicate.ok, false);
assert.equal(duplicate.code, 'duplicate');

const second = service.reserve(rust.workshop.id, 'ada');
assert.equal(second.ok, true);

const full = service.reserve(rust.workshop.id, 'grace');
assert.equal(full.ok, false);
assert.equal(full.code, 'full');

const past = service.addWorkshop({
  language: 'Haskell',
  title: '순수 함수와 타입',
  startsAt: current - 1,
  seats: 4,
});
assert.equal(past.ok, true);
const late = service.reserve(past.workshop.id, 'samsepi0l');
assert.equal(late.ok, false);
assert.equal(late.code, 'past');

const otherWorkshop = service.addWorkshop({
  language: 'Go',
  title: '작은 HTTP 서버',
  startsAt: current,
  seats: 1,
});
const sameName = service.reserve(otherWorkshop.workshop.id, 'samsepi0l');
assert.equal(sameName.ok, true);

const missing = service.reserve(404, 'samsepi0l');
assert.equal(missing.code, 'not_found');

const invalid = service.addWorkshop({
  language: 'Zig',
  title: '할당자',
  startsAt: current + 10,
  seats: 0,
});
assert.equal(invalid.code, 'invalid');

current += 3_600_001;
const closed = service.reserve(rust.workshop.id, 'linus');
assert.equal(closed.code, 'past');

console.log('booking.test.js: 통과');
