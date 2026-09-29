export function createFeed() {
  const posts = [];
  const likers = new Map();
  let nextId = 1;

  function addPost(input) {
    const source = input ?? {};
    const language = text(source.language, 40);
    const title = text(source.title, 80);
    const author = text(source.author, 40);
    const code = typeof source.code === 'string' ? source.code : '';
    if (!language || !title || !author || code.trim() === '' || [...code].length > 4000) {
      return {
        ok: false,
        code: 'invalid',
        error: 'language, title, code, author가 올바라야 합니다.',
      };
    }
    const post = {
      id: nextId,
      language,
      title,
      code,
      author,
      likes: 0,
    };
    nextId += 1;
    posts.push(post);
    likers.set(post.id, new Set());
    return { ok: true, post: snapshot(post) };
  }

  function list(query = {}) {
    const size = normalizeLimit(query.limit);
    const language = query.language ? String(query.language) : '';
    let rows = posts
      .filter((post) => !language || post.language === language)
      .slice()
      .sort((left, right) => left.id - right.id);
    const cursor = normalizeCursor(query.cursor);
    if (cursor.invalid) {
      return { items: [], nextCursor: null };
    }
    if (cursor.id !== null) {
      rows = rows.filter((post) => post.id > cursor.id);
    }
    const items = rows.slice(0, size).map((post) => snapshot(post));
    const nextCursor = rows.length > size ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  function toggleLike(postId, user) {
    const id = Number(postId);
    const post = posts.find((row) => row.id === id);
    if (!post) {
      return { ok: false, code: 'not_found', error: '없는 조각입니다.' };
    }
    const name = text(user, 40);
    if (!name) {
      return { ok: false, code: 'invalid', error: 'user가 필요합니다.' };
    }
    const names = likers.get(post.id);
    let liked;
    if (names.has(name)) {
      names.delete(name);
      liked = false;
    } else {
      names.add(name);
      liked = true;
    }
    post.likes = names.size;
    return { ok: true, liked, post: snapshot(post) };
  }

  function snapshot(post) {
    return {
      id: post.id,
      language: post.language,
      title: post.title,
      code: post.code,
      author: post.author,
      likes: likers.get(post.id).size,
    };
  }

  return { addPost, list, toggleLike };
}

function text(value, max) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed || [...trimmed].length > max) {
    return '';
  }
  return trimmed;
}

function normalizeLimit(limit) {
  if (limit === undefined || limit === null || limit === '') {
    return 20;
  }
  const size = Number(limit);
  if (!Number.isInteger(size) || size < 1) {
    return 20;
  }
  return Math.min(size, 50);
}

function normalizeCursor(cursor) {
  if (cursor === undefined || cursor === null || cursor === '') {
    return { invalid: false, id: null };
  }
  const id = Number(cursor);
  if (!Number.isInteger(id) || id < 1) {
    return { invalid: true, id: null };
  }
  return { invalid: false, id };
}
