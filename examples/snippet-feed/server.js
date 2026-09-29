import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createFeed } from './feed.js';

const root = dirname(fileURLToPath(import.meta.url));

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('본문이 너무 큽니다.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.trim() === '') {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          reject(new Error('JSON 객체 본문이 필요합니다.'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('JSON 본문을 해석할 수 없습니다.'));
      }
    });
    req.on('error', reject);
  });
}

export function createApp(feed) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    try {
      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
        const html = await readFile(join(root, 'public', 'index.html'));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/posts') {
        const cursor = url.searchParams.get('cursor');
        const limit = url.searchParams.get('limit');
        sendJson(
          res,
          200,
          feed.list({
            language: url.searchParams.get('language') || undefined,
            cursor: cursor === null || cursor === '' ? undefined : Number(cursor),
            limit: limit === null || limit === '' ? undefined : Number(limit),
          }),
        );
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/posts') {
        const body = await readJson(req);
        const created = feed.addPost(body);
        if (!created.ok) {
          sendJson(res, 400, { error: created.error, code: created.code });
          return;
        }
        sendJson(res, 201, created.post);
        return;
      }
      const like = url.pathname.match(/^\/api\/posts\/(\d+)\/like$/);
      if (req.method === 'POST' && like) {
        const body = await readJson(req);
        const result = feed.toggleLike(Number(like[1]), body.user);
        if (!result.ok) {
          const status = result.code === 'not_found' ? 404 : 400;
          sendJson(res, status, { error: result.error, code: result.code });
          return;
        }
        sendJson(res, 200, { liked: result.liked, post: result.post });
        return;
      }
      sendJson(res, 404, { error: '없는 경로입니다.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
      sendJson(res, 400, { error: message });
    }
  });
}

function seed(feed) {
  const samples = [
    ['Python', '길이 함수', 'def typed_len(text: str) -> int:\n    return len(text)\n'],
    ['JavaScript', '언어 라벨', 'const label = (name) => `lang:${name}`;\n'],
    ['Go', '언어 라벨', 'func Label(name string) string {\n    return "lang:" + name\n}\n'],
    ['Rust', '언어 라벨', 'fn label(name: &str) -> String {\n    format!("lang:{name}")\n}\n'],
    ['TypeScript', '언어 라벨', 'export function label(name: string): string {\n  return `lang:${name}`;\n}\n'],
    ['Kotlin', '언어 라벨', 'fun label(name: String): String = "lang:$name"\n'],
    ['Elixir', '언어 라벨', 'def label(name) when is_binary(name), do: "lang:" <> name\n'],
    ['Zig', '접두 확인', 'const std = @import("std");\n\nfn startsWithLang(name: []const u8) bool {\n    return std.mem.startsWith(u8, name, "lang");\n}\n'],
    ['Dart', '언어 라벨', "String label(String name) => 'lang:$name';\n"],
    ['Haskell', '언어 라벨', 'label :: String -> String\nlabel name = "lang:" ++ name\n'],
  ];
  for (const [language, title, code] of samples) {
    feed.addPost({ language, title, code, author: 'samsepi0l' });
  }
}

function runningAsMain() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (runningAsMain()) {
  const port = Number(process.env.PORT ?? 8092);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT가 올바른 포트가 아닙니다: ${process.env.PORT}`);
  }
  const feed = createFeed();
  seed(feed);
  createApp(feed).listen(port, () => {
    console.log(`코드 조각 피드 수신: ${port}`);
  });
}
