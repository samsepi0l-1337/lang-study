---
title: "언어 튜터 서비스 구조"
slug: llm-tutor
order: 22
level: "초급"
minutes: 40
tags: [LLM]
summary: "로컬 카탈로그에서 언어 설명을 고르고, 역할이 나뉜 메시지를 화면에 나누어 그립니다."
---

# 언어 튜터 서비스 구조

이 장은 samsepi0l이 언어 튜터의 요청 모양을 공부하려고 정리한 노트입니다.
다루는 언어는 Python, JavaScript, Go, Rust, TypeScript, Kotlin, Elixir, Zig, Dart, Haskell입니다.
모델 회사의 계정은 만들지 않습니다.
저장소에 키를 붙여 넣지도 않습니다.
확인할 것은 역할, 컨텍스트 윈도, 로컬 카탈로그 검색, 그리고 이미 만든 답을 화면에 나누어 그리는 방법입니다.

## 이 장을 끝내면

- system, user, assistant가 한 번의 호출에서 맡는 일을 구분합니다.
- 열 개 설명을 매번 붙이지 않고, 질문에 맞는 문장만 고르는 이유를 말합니다.
- 이미 완성된 답을 조각으로 나누어 채팅 화면에 이어 붙입니다.

## 세 역할

한 번의 질문과 답은 메시지 배열입니다.
각 원소는 role과 content를 가집니다.

system은 튜터의 계약입니다.
이 예제는 열 개 언어의 로컬 카탈로그만 읽고, 그 밖 사실은 만들지 말라고 적습니다.
사용자에게 보여 주려고 만든 문장이 아니라, 답의 범위를 고정하는 문장입니다.

user는 이번 질문입니다.
입력칸의 문자열이 그대로 content가 됩니다.
예제는 이전 대화를 저장하지 않으므로 user는 항상 한 개입니다.

assistant는 카탈로그에서 고른 결과입니다.
함수가 돌려주는 reply와 마지막 메시지의 content는 같습니다.
테스트가 그 둘을 하나로 묶어 확인합니다.

역할을 섞으면 나중에 모델을 붙여도 어디를 바꿀지 헷갈립니다.
검색은 user를 보고, 화면은 assistant를 그리고, 한계는 system에만 둡니다.

## 컨텍스트 윈도

컨텍스트 윈도는 한 번의 호출에 넣는 텍스트의 상한입니다.
단위는 글자 수가 아니라 토큰입니다.
토큰은 모델이 자르는 조각이라 같은 문장이라도 글자 수와 같지 않습니다.
같은 뜻이어도 한국어가 영어보다 토큰을 더 쓰는 경우가 흔합니다.
창의 크기는 모델마다 다르므로 이 노트는 특정 숫자를 적지 않습니다.

상한 안에는 system, 이전 대화, 검색으로 붙인 문장, 이번 질문이 함께 들어갑니다.
창이 차면 오래된 턴을 버리거나 짧게 줄입니다.
이 예제는 이력을 쌓지 않습니다.
배열은 system, user, assistant에서 끝납니다.

짧은 사실 열 개라면 창에 다 넣어도 됩니다.
그래도 질문과 맞는 것만 고릅니다.
고르는 자리를 지금 두면, 설명이 길어져도 호출의 모양은 그대로입니다.

이 장은 모델을 호출하지 않습니다.
messages는 나중에 보낼 요청의 모양만 갖춥니다.
주소도 없고 키도 없습니다.

## 로컬 카탈로그

언어마다 이름, 키워드, 사실 한 문장이 있습니다.
사실은 그 언어를 공부할 때 먼저 붙잡는 특징 하나입니다.

- Python은 들여쓰기로 블록을 나타내고, 동적 타입으로 값을 다룹니다.
- JavaScript는 이벤트 루프 위에서 비동기 작업을 이어 갑니다.
- Go는 고루틴으로 가벼운 동시 실행을 표현합니다.
- Rust는 소유권으로 메모리 안전을 돕습니다.
- TypeScript의 타입은 컴파일되면 JavaScript로 지워집니다.
- Kotlin은 널 가능 여부를 타입으로 구분합니다.
- Elixir는 BEAM의 가벼운 프로세스로 상태를 격리합니다.
- Zig는 메모리 할당자를 호출하는 쪽에서 넘깁니다.
- Dart는 사운드 널 안전성을 타입 시스템에 둡니다.
- Haskell은 순수 함수와 지연 평가를 기본으로 합니다.

Rust 문장은 소유권이 메모리 안전을 돕는다는 뜻입니다.
unsafe 블록은 그 검사 밖에 둘 수 있습니다.
그래서 이 문장은 모든 메모리 오류가 불가능하다는 뜻이 아닙니다.

검색은 키워드입니다.
임베딩도, 네트워크 검색도 아닙니다.
이름이 질문에 들어가면 이 크기에서는 키워드로 충분합니다.

라틴 키워드는 단어 경계로 맞춥니다.
go를 그냥 포함으로 보면 algorithm 안의 go에 Go 설명이 따라 나옵니다.
js도 JSON 안에 걸리지 않게 같은 방식으로 자릅니다.
golang은 별도 키워드입니다.
한글 한 글자 키워드는 넣지 않았습니다.
고는 알고리즘 안에 들어 있습니다.

맞는 항목이 없으면 열 개 이름만 돌려주고 사실은 만들지 않습니다.
그 안내 문장에도 Go라는 철자는 있습니다.
테스트는 고루틴이라는 사실 문장이 없는지로 오탐을 가립니다.
이름 목록에 철자가 있는 것과 사실을 고른 것은 다릅니다.
두 언어가 맞으면 사실을 줄바꿈으로 이어 붙입니다.

## 준비된 답을 나누어 그리기

운영 중인 모델의 스트리밍은 토큰이 생기는 대로 보내는 일입니다.
이 예제는 그 경로가 아닙니다.
answer가 reply 전체를 만든 뒤에, 브라우저가 그 문자열을 12자씩 잘라 40밀리초마다 붙입니다.
기다리는 시간은 모델의 지연이 아니라 화면 연습입니다.

부분 문자열만 도착해도 말풍선이 깨지지 않는지 보려는 것입니다.
질문과 답은 textContent로만 넣습니다.
HTML로 해석하지 않습니다.

파일은 두 벌입니다.
`examples/llm-tutor/tutor.js`는 Node ESM입니다.
`examples/llm-tutor/public/index.html`은 같은 카탈로그와 mentions, answer를 스크립트에 다시 적습니다.
file://에서는 모듈 import가 막히는 브라우저가 있어서 복사했습니다.
페이지 쪽에는 export가 없고, HTML 안에 들어가며 들여쓰기가 달라집니다.
사실을 고치면 두 파일을 같이 고칩니다.
`examples/llm-tutor/package.json`의 type은 module입니다.
이 설정이 있어야 `node tutor.test.js`가 import를 실행합니다.

페이지는 system을 첫 질문에만 보여 줍니다.
배열 안에는 매 호출마다 system이 들어 있습니다.
화면에서 생략해도 배열에서 생략되는 것은 아닙니다.

## 예제

`examples/llm-tutor/tutor.js`의 answer는 검색 결과로 messages와 reply를 만듭니다.

```javascript
export function answer(question) {
  const text = String(question ?? "");
  const hits = catalog.filter((item) =>
    item.keywords.some((keyword) => mentions(text, keyword)),
  );
  const reply =
    hits.length === 0
      ? `카탈로그에서 언어를 찾지 못했습니다. 이름 후보: ${catalog
          .map((item) => item.name)
          .join(", ")}.`
      : hits.map((item) => `${item.name}: ${item.fact}`).join("\n");
  const messages = [
    { role: "system", content: SYSTEM },
    { role: "user", content: text },
    { role: "assistant", content: reply },
  ];
  return { messages, reply };
}
```

`examples/llm-tutor/tutor.test.js`는 Rust가 들어간 질문의 답에 Rust와 소유권 또는 메모리가 있는지 봅니다.

```javascript
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
```

`examples/llm-tutor/public/index.html`은 완성된 reply를 잘라 그립니다.

```javascript
    function streamInto(node, text) {
      const size = 12;
      let index = 0;
      node.textContent = "";
      return new Promise((resolve) => {
        const timer = setInterval(() => {
          index += size;
          node.textContent = text.slice(0, index);
          if (index >= text.length) {
            clearInterval(timer);
            node.textContent = text;
            resolve();
          }
        }, 40);
      });
    }
```

`examples/llm-tutor`에서 `node tutor.test.js`를 실행합니다.
통과하면 ok가 출력됩니다.
페이지는 서버 없이 파일을 열어 확인합니다.

## 연습

1. Rust 키워드를 하나 더 넣고 `tutor.js`와 `public/index.html`을 같이 고칩니다. 테스트를 다시 실행합니다.
2. 질문에 Rust와 Go를 모두 넣어 답이 두 줄인지 확인합니다. 없는 사실을 보태지 않습니다.
3. streamInto의 size를 바꿉니다. 바뀌는 것은 화면 속도뿐이고, reply의 내용이 아니어야 합니다.

## 스스로 확인

### 1. system 메시지는 사용자에게 보여 주는 인사입니까?

답: 아닙니다. 카탈로그 밖 사실을 만들지 말라는 계약입니다. 페이지가 첫 턴에 보여 주는 것은 배열에 들어 있다는 뜻이지, 인사는 아닙니다.

### 2. 이 예제의 messages에는 이전 질문이 누적됩니까?

답: 누적되지 않습니다. 한 호출은 system, user, assistant 세 메시지입니다. 이력을 넣으면 컨텍스트 윈도 안에서 오래된 턴을 줄여야 합니다.

### 3. 왜 go 키워드를 부분 문자열로 찾지 않습니까?

답: algorithm처럼 다른 단어 안의 go에 Go 사실이 붙기 때문입니다. 라틴 키워드는 앞뒤가 글자가 아닐 때만 맞춥니다.

### 4. 스트리밍 함수는 모델이 토큰을 보낼 때까지 기다립니까?

답: 기다리지 않습니다. answer가 답을 모두 만든 뒤에 그 문자열을 12자씩 나눕니다. 네트워크 호출이 없습니다.

### 5. 페이지는 왜 tutor.js를 import하지 않습니까?

답: 파일을 서버 없이 열면 브라우저가 모듈 import를 막는 경우가 있습니다. 그래서 카탈로그와 함수를 페이지 안에 다시 적었습니다. 사실을 고치면 두 곳을 같이 고칩니다.
