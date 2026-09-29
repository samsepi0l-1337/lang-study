---
title: "코드 조각 피드"
slug: snippet-feed
order: 16
level: "중급"
minutes: 45
tags: [JavaScript]
summary: "언어별 코드 조각을 id 커서로 나누고, 사용자 이름 단위로 추천을 토글합니다."
---

# 코드 조각 피드

이 노트는 samsepi0l이 언어별 코드 조각 피드를 정리한 것입니다. 순서는 시간이 아니라 id입니다. 조각은 `id`, `language`, `title`, `code`, `author`, `likes`를 가집니다. 작성자가 정하는 값은 언어, 제목, 코드, 작성자입니다. id와 추천 수는 피드가 정합니다.

화면은 `examples/snippet-feed/public/index.html`이고, 목록과 등록과 추천은 `feed.js`의 함수를 HTTP로 얇게 감쌉니다. `feed.test.js`는 서버를 띄우지 않습니다. 포트와 JSON 파싱이 커서 계산과 섞이면, 실패한 이유가 규칙인지 요청 형식인지 구분하기 어렵습니다.

## 이 장을 끝내면

- `list`가 `{ items, nextCursor }`를 만들 때 커서와 언어 필터를 어떤 순서로 적용하는지 설명합니다.
- 추천이 증가 카운터가 아니라 이름 집합의 토글인 이유를 말합니다.
- 같은 프로세스가 HTML과 JSON을 제공해도 테스트 대상은 피드 모듈인 이유를 구분합니다.

## 조각은 클라이언트가 id와 추천을 정하지 못합니다

`addPost`는 `language`, `title`, `author`의 앞뒤 공백을 제거하고 빈 값을 거절합니다. 언어와 작성자는 40자, 제목은 80자까지입니다. `code`는 공백만 있으면 거절하고, 내용이 있으면 들여쓰기를 유지한 채 저장합니다. 상한은 4000자입니다. 본문에 `id`나 `likes`가 있어도 복사하지 않습니다. 새 id는 1부터 증가하고 처음 추천 수는 0입니다.

이 거절은 예약 장의 서비스와 같은 위치에 있습니다. 라우트 핸들러가 필드를 골라 복사하면, 테스트를 핸들러 없이 실행할 때 그 선택이 사라집니다. `addPost`가 `{ ok:false, code:'invalid' }`를 반환하면 서버는 400을 고르기만 합니다.

## 커서는 마지막으로 본 id입니다

순서는 `id` 오름차순으로 고정합니다. 지금은 추가만 하므로 배열 순서와 id 순서가 같습니다. 그래도 반환 전에 id로 정렬해, 순서가 삽입 실수에 기대지 않게 합니다. `list`는 `{ items, nextCursor }`를 반환합니다.

`limit`의 기본값은 20이고 상한은 50입니다. 정수가 아니거나 1보다 작으면 20으로 되돌립니다. 거절하지 않고 기본값을 쓰는 이유는 화면의 실수가 빈 오류가 되지 않게 하기 위해서입니다. 화면은 10개씩 요청합니다. 기본값과 화면 값이 다른 것은 버그가 아니라 계약이 둘이라는 뜻입니다.

커서가 없으면 앞에서 `limit`개를 자릅니다. 커서가 양의 정수면 `id`가 그 값보다 큰 조각만 남긴 뒤 자릅니다. `nextCursor`는 이번 페이지의 마지막 id입니다. 남은 조각이 없으면 `null`입니다. 정수가 아닌 커서는 `{ items: [], nextCursor: null }`입니다. 알 수 없는 문자열을 첫 페이지로 되돌리면 클라이언트가 같은 페이지를 반복합니다.

언어 필터는 커서보다 먼저입니다. `language`는 저장된 문자열과 정확히 같아야 합니다. `Go`와 `go`는 다릅니다. 필터된 줄에서 `id > cursor`를 적용하므로, Rust 조각의 id를 커서로 넘기고 `language=Go`를 주면 id가 더 큰 Go만 남습니다. 커서는 필터 안의 위치 번호가 아니라 전역 id입니다.

삭제가 없고 id가 증가만 하는 지금 데이터에서는 오프셋도 같은 페이지를 만들 수 있습니다. 커서를 마지막 id로 두는 이유는 계약이 `이 id의 다음`이기 때문입니다. 이미 넘긴 id는 다시 주지 않습니다. 새로 추가된 조각은 더 큰 id를 받으므로 다음 페이지 쪽에 붙습니다. 앞 페이지를 밀지 않습니다.

예를 들면 Python 1, Go 2, Rust 3, Go 4입니다. `limit` 2의 첫 페이지는 1과 2이고 `nextCursor`는 2입니다. 그 커서로 다시 물으면 3과 4이며 `nextCursor`는 `null`입니다. Go만 `limit` 1로 보면 첫 항목은 2이고 다음 커서는 2, 그다음은 4입니다.

## 추천은 이름 집합의 토글입니다

`toggleLike(postId, user)`는 조각마다 `Set`을 가집니다. 이름이 없으면 넣고 `liked`는 true입니다. 있으면 빼고 `liked`는 false입니다. `likes`는 집합의 크기입니다. 본문의 숫자로 올리지 않습니다. 같은 이름의 두 번째 호출은 추천을 취소합니다. 다른 이름은 독립입니다. 앞뒤 공백은 같은 사용자로 봅니다.

사용자 이름은 계정이 아닙니다. 로그인 없이 토글하려면 호출자가 이름을 보내야 하고, 그 이름은 위조할 수 있습니다. 이 피드는 그 한계를 인증으로 해결하지 않습니다. 카운터만 증가시키면 새로고침이나 재요청마다 수가 커지므로, 토글에는 누구의 추천인지가 필요합니다. 없는 조각은 `not_found`, 빈 `user`는 `invalid`입니다.

## 화면은 같은 서버의 클라이언트입니다

`server.js`를 직접 실행하면 기본 포트 8092에서 수신합니다. `GET /`와 `GET /index.html`은 `public/index.html`을 돌려줍니다. `GET /api/posts`는 `list`의 쿼리 `language`, `cursor`, `limit`를 전달합니다. `POST /api/posts`의 JSON은 조각을 만들고 201로 그 객체를 반환합니다. `POST /api/posts/:id/like`의 JSON은 `user`가 필요합니다. 성공은 200과 `{ liked, post }`입니다.

직접 실행할 때만 열 개 언어의 짧은 예시를 시드합니다. 테스트가 import하는 `createFeed`는 비어 있습니다. 모듈을 import하는 것만으로 `listen`하지 않도록, 실행 파일의 URL이 `import.meta.url`과 같을 때만 포트를 엽니다.

화면은 `fetch`로 같은 출처의 API를 부릅니다. 조각의 코드는 `textContent`로 넣습니다. HTML로 해석하지 않습니다. 코드 조각에 태그가 있어도 문서 구조가 되면 안 되기 때문입니다. 추천 뒤에는 목록을 처음부터 다시 읽어 집합 크기를 화면에 맞춥니다.

## 예제

파일은 `examples/snippet-feed/feed.js`, `feed.test.js`, `server.js`, `public/index.html`입니다.

`examples/snippet-feed/feed.js`의 `list`입니다. 필터, 정렬, 커서, 잘라 내기가 이 순서입니다.

```javascript
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
```

`examples/snippet-feed/feed.js`의 `toggleLike`입니다. 집합이 추천 수의 기준입니다.

```javascript
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
```

`examples/snippet-feed/public/index.html`은 다음 커서를 쿼리로 넘깁니다. `reset`이 아니면 이전 `nextCursor`를 붙입니다.

```javascript
    async function loadPage(reset) {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (languageSelect.value) {
        params.set('language', languageSelect.value);
      }
      if (!reset && nextCursor !== null) {
        params.set('cursor', String(nextCursor));
      }
      const page = await requestJson(`/api/posts?${params.toString()}`);
```

추천 요청도 같은 파일에 있습니다. 본문 필드는 `user` 하나입니다.

```javascript
        const result = await requestJson(`/api/posts/${id}/like`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ user }),
        });
```

같은 디렉터리에서 `node feed.test.js`를 실행합니다. 설치는 없습니다. 화면을 보려면 서버를 직접 실행합니다.

```bash
node feed.test.js
PORT=8092 node server.js
```

테스트는 추가, `limit` 2의 두 페이지, Go 필터와 커서, Rust id를 Go 필터에 넘기는 경우, 같은 이름의 추천 취소, 다른 이름의 추천, 본문 `likes` 무시를 확인합니다.

## 연습

1. 언어가 번갈아 나오는 조각 네 개를 넣고 `limit` 2로 두 번 `list`합니다. 두 번째 인자의 `cursor`가 첫 결과의 `nextCursor`와 같고, 두 번째 `nextCursor`는 `null`인지 확인합니다.
2. Go만 `limit` 1로 본 뒤, Go가 아닌 조각의 id를 `cursor`로 넘기고 `language`는 `Go`로 유지합니다. 남는 항목의 id가 그 커서보다 큰지 확인합니다.
3. 같은 `user`로 `toggleLike`를 두 번 호출해 `likes`가 다시 0이 되는지 보고, 다른 `user`로 한 번 더 호출해 1이 되는지 확인합니다. `addPost` 본문의 `likes`는 결과에 반영되지 않아야 합니다.

## 스스로 확인

1. 지금 데이터만 보면 오프셋도 되지 않습니까?

추가만 하고 지우지 않으면 오프셋도 같은 조각을 순서대로 줄 수 있습니다. 커서는 그래도 마지막 id를 기준으로 `id가 더 큰 것`을 계약으로 고정합니다. 앞에 줄을 끼워 넣는 변화가 생겨도 이미 반환한 id를 다음 페이지에 다시 넣지 않습니다.

2. language=Go이고 cursor가 Rust 조각의 id이면 무엇이 나옵니까?

Go이면서 그 id보다 큰 조각만 나옵니다. 커서를 찾기 위해 Rust 행이 필터 안에 있을 필요는 없습니다. 비교는 필터된 목록의 위치 번호가 아니라 id 값입니다.

3. 등록 본문에 likes를 넣어도 0인 이유는 무엇입니까?

`addPost`가 입력에서 언어, 제목, 코드, 작성자만 읽기 때문입니다. 추천 수는 `Set`의 크기이고 처음 집합은 비어 있습니다. 클라이언트가 수를 지정하면 토글과 숫자가 어긋납니다.

4. 같은 이름의 두 번째 추천은 왜 줄어듭니까?

그 이름이 집합에 있으면 제거하고 `liked`를 false로 반환합니다. 무조건 증가하는 카운터는 같은 요청을 다시 보내면 수가 변합니다. 다른 이름은 같은 집합의 다른 원소이므로 서로의 토글을 취소하지 않습니다.

5. 테스트를 server.js가 아니라 feed.js에 둔 이유는 무엇입니까?

페이지의 순서, 필터, 추천은 `list`와 `toggleLike`에 있기 때문입니다. HTTP 테스트는 포트, 본문 파싱, 상태 코드까지 같이 실패합니다. 서버는 `ok`와 `code`를 상태 코드로 옮기고, HTML은 그 JSON을 `fetch`로 표시합니다.
