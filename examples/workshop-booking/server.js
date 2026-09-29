import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createService } from './booking.js';

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

function statusFor(code) {
  if (code === 'not_found') {
    return 404;
  }
  if (code === 'invalid') {
    return 400;
  }
  return 409;
}

export function createApp(service) {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    try {
      if (req.method === 'GET' && url.pathname === '/workshops') {
        sendJson(res, 200, service.listWorkshops());
        return;
      }
      if (req.method === 'POST' && url.pathname === '/workshops') {
        const body = await readJson(req);
        const created = service.addWorkshop(body);
        if (!created.ok) {
          sendJson(res, statusFor(created.code), { error: created.error, code: created.code });
          return;
        }
        sendJson(res, 201, created.workshop);
        return;
      }
      if (req.method === 'GET' && url.pathname === '/reservations') {
        const raw = url.searchParams.get('workshopId');
        if (raw === null || raw === '') {
          sendJson(res, 200, service.listReservations());
          return;
        }
        const workshopId = Number(raw);
        if (!Number.isInteger(workshopId)) {
          sendJson(res, 400, { error: 'workshopId는 정수여야 합니다.', code: 'invalid' });
          return;
        }
        sendJson(res, 200, service.listReservations(workshopId));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/reservations') {
        const body = await readJson(req);
        const result = service.reserve(body.workshopId, body.name);
        if (!result.ok) {
          sendJson(res, statusFor(result.code), { error: result.error, code: result.code });
          return;
        }
        sendJson(res, 201, result.reservation);
        return;
      }
      sendJson(res, 404, { error: '없는 경로입니다.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
      sendJson(res, 400, { error: message });
    }
  });
}

function seed(service) {
  const base = Date.now();
  const day = 86_400_000;
  const rows = [
    ['Python', '타입 힌트와 데이터 모델', 12],
    ['JavaScript', '이벤트 루프와 비동기 함수', 12],
    ['Go', '표준 라이브러리 HTTP와 뮤텍스', 8],
    ['Rust', '소유권과 빌림', 8],
    ['TypeScript', '구조적 타입과 내로잉', 10],
    ['Kotlin', 'null 안전과 데이터 클래스', 10],
    ['Elixir', '프로세스와 메시지', 8],
    ['Zig', '할당자와 오류 값', 6],
    ['Dart', '비동기 화면과 아이솔레이트', 8],
    ['Haskell', '순수 함수와 대수적 타입', 6],
  ];
  rows.forEach(([language, title, seats], index) => {
    service.addWorkshop({
      language,
      title,
      startsAt: base + (index + 1) * day,
      seats,
    });
  });
}

function runningAsMain() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return import.meta.url === pathToFileURL(entry).href;
}

if (runningAsMain()) {
  const port = Number(process.env.PORT ?? 8091);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT가 올바른 포트가 아닙니다: ${process.env.PORT}`);
  }
  const service = createService();
  seed(service);
  createApp(service).listen(port, () => {
    console.log(`워크숍 좌석 예약 수신: ${port}`);
  });
}
