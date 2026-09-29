import assert from 'node:assert/strict';
import { createFeed } from './feed.js';

function post(feed, language, title, code = `${language} snippet`) {
  const result = feed.addPost({
    language,
    title,
    code,
    author: 'samsepi0l',
  });
  assert.equal(result.ok, true);
  return result.post;
}

const feed = createFeed();
const python = post(feed, 'Python', '길이 함수', 'def typed_len(text: str) -> int:\n    return len(text)\n');
const goFirst = post(feed, 'Go', '라벨 함수');
const rust = post(feed, 'Rust', '라벨 함수');
const goSecond = post(feed, 'Go', '슬라이스 복사');

assert.equal(python.id, 1);
assert.equal(python.likes, 0);
assert.equal(goFirst.id, 2);
assert.equal(rust.id, 3);
assert.equal(goSecond.id, 4);
assert.equal(python.code.includes('typed_len'), true);

const firstPage = feed.list({ limit: 2 });
assert.deepEqual(
  firstPage.items.map((item) => item.id),
  [1, 2],
);
assert.equal(firstPage.nextCursor, 2);

const secondPage = feed.list({ cursor: firstPage.nextCursor, limit: 2 });
assert.deepEqual(
  secondPage.items.map((item) => item.id),
  [3, 4],
);
assert.equal(secondPage.nextCursor, null);

const goOnly = feed.list({ language: 'Go', limit: 1 });
assert.deepEqual(
  goOnly.items.map((item) => item.id),
  [2],
);
assert.equal(goOnly.nextCursor, 2);

const goRest = feed.list({ language: 'Go', cursor: goOnly.nextCursor, limit: 1 });
assert.deepEqual(
  goRest.items.map((item) => item.id),
  [4],
);
assert.equal(goRest.nextCursor, null);

const afterRust = feed.list({ language: 'Go', cursor: rust.id, limit: 10 });
assert.deepEqual(
  afterRust.items.map((item) => item.id),
  [4],
);

const liked = feed.toggleLike(goFirst.id, 'samsepi0l');
assert.equal(liked.ok, true);
assert.equal(liked.liked, true);
assert.equal(liked.post.likes, 1);

const withdrawn = feed.toggleLike(goFirst.id, ' samsepi0l ');
assert.equal(withdrawn.ok, true);
assert.equal(withdrawn.liked, false);
assert.equal(withdrawn.post.likes, 0);

const other = feed.toggleLike(goFirst.id, 'ada');
assert.equal(other.liked, true);
assert.equal(other.post.likes, 1);
assert.equal(feed.list({ language: 'Go', limit: 10 }).items[0].likes, 1);

const missing = feed.toggleLike(99, 'samsepi0l');
assert.equal(missing.ok, false);
assert.equal(missing.code, 'not_found');

const bad = feed.addPost({ language: 'Go', title: '   ', code: 'x', author: 'samsepi0l' });
assert.equal(bad.ok, false);

const forged = feed.addPost({
  language: 'Zig',
  title: '할당자',
  code: 'const std = @import("std");\n',
  author: 'samsepi0l',
  likes: 40,
  id: 1,
});
assert.equal(forged.ok, true);
assert.equal(forged.post.likes, 0);
assert.notEqual(forged.post.id, 1);

const invalidCursor = feed.list({ cursor: 'next', limit: 2 });
assert.deepEqual(invalidCursor, { items: [], nextCursor: null });

console.log('feed.test.js: 통과');
