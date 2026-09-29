---
title: "TypeScript로 블록 잇기"
slug: ts-chain
order: 21
level: "중급"
minutes: 40
tags: [TypeScript]
summary: "언어 제안을 해시로 잇는 목록을 TypeScript로 만들고 변조를 검증으로 찾습니다."
---

# TypeScript로 블록 잇기

## 도입

이 장은 samsepi0l이 언어 제안을 해시로 잇는 목록으로 정리한 노트입니다. 결제나 자산 이동을 다루지 않습니다. 각 블록은 언어 제안 하나를 기록하고, 바로 앞 블록의 해시를 가리킵니다.

제안은 `language`, `title`, `text` 세 필드입니다. 예를 들면 Dart의 널 안전이나 TypeScript의 타입 소거에 대한 짧은 문장입니다. 블록을 추가할 때 난이도를 맞추는 퍼즐은 풀지 않습니다. `chain.ts`의 한 줄 주석이 말하듯 작업 증명은 의도적으로 생략합니다.

예제는 `examples/ts-chain`에 있습니다. 그 디렉터리에서 다음을 실행합니다.

`node --experimental-strip-types chain.test.ts`

의존 패키지는 없습니다. 해시는 `node:crypto`의 sha256입니다.

## 이 장을 끝내면

- 블록의 필드와, 해시가 자기 자신을 제외한 이유를 설명합니다.
- `append`가 이전 해시로 블록을 잇는 방식과 `validate`의 세 검사를 말합니다.
- 본문 변조와 링크 변조가 서로 다른 이유로 검증에 실패한다는 점을 구분합니다.

## 블록에 적는 제안

블록 필드는 `index`, `timestamp`, `proposal`, `previousHash`, `hash`입니다. `index`는 목록에서의 위치이고 0부터 시작합니다. `timestamp`는 호출자가 넘기는 문자열입니다. 테스트가 시각을 고정할 수 있게 하려고 클래스 안에서 시계를 읽지 않습니다.

첫 블록의 `previousHash`는 64개의 `'0'`입니다. sha256을 십육진수로 적으면 64자라서 길이를 맞춘 자리 표시이며, 숨은 블록의 해시가 아닙니다. 상수 이름은 `emptyPreviousHash`입니다. 다음 블록의 `previousHash`는 바로 앞 블록의 `hash`입니다.

`blocks`는 일부러 공개되어 있습니다. 테스트가 필드를 고친 뒤 `validate`가 거짓이 되는지 보려는 이음새입니다. 라이브러리라면 바깥에서 못 고치게 감싸겠지만, 이 파일의 목적은 변조가 검증에서 드러나는 모습을 보여주는 것입니다.

## 해시를 고정된 순서로 계산합니다

`hash`는 `hash` 필드를 뺀 나머지 필드의 sha256입니다. 해시를 입력에 포함하면 그 값이 자기 자신을 포함해야 하므로 계산이 닫히지 않습니다. `canonical`은 객체를 새로 만들어 `index`, `timestamp`, `proposal`, `previousHash` 순서로만 `JSON.stringify`합니다. `proposal` 안에서도 `language`, `title`, `text` 순서를 고정합니다.

호출자가 필드를 다른 순서로 만든 객체라도, 해시 입력의 키 순서는 달라지지 않습니다. 같은 값이면 같은 문자열이 되고, 그 문자열의 sha256 십육진수가 `hash`입니다. 테스트는 그 길이가 64인지도 확인합니다.

## 잇기와 검증

`append`는 현재 길이를 `index`로 삼고, 마지막 블록이 없으면 `emptyPreviousHash`를, 있으면 그 블록의 `hash`를 `previousHash`로 삼습니다. 그 본문으로 `hashBlock`을 계산한 다음 배열 끝에 넣습니다. 반환값은 방금 넣은 블록입니다.

`validate`는 빈 목록을 참으로 봅니다. 블록이 있으면 앞에서부터 세 가지를 봅니다. 첫째, `index`가 현재 위치와 같은지 봅니다. 둘째, `bodyOf`로 `hash`를 제외한 본문을 다시 해시해 저장된 `hash`와 같은지 봅니다. 셋째, `previousHash`가 첫 블록이면 0의 열이고, 아니면 바로 앞 블록의 `hash`와 같은지 봅니다. 하나라도 어긋나면 거짓입니다.

작업 증명을 넣지 않았으므로 해시 앞에 0이 몇 개인지 보지 않습니다. 정당한 블록을 만드는 비용과 변조를 알아채는 비용은 이 구조에서 해시 계산 한 번으로 같습니다. 수업이 보여 주려는 것은 비용의 비대칭이 아니라 링크입니다.

## 변조

제안의 `text`를 바꾸면 정규화된 JSON이 달라집니다. 저장된 `hash`는 예전 문자열로 만들어졌으므로 다시 계산한 값과 다릅니다. `validate`는 거짓입니다. 문장을 되돌리면 다시 참입니다. 이것이 본문 변조입니다.

링크 변조는 따로 볼 수 있습니다. `previousHash`를 0의 열로 바꾸고, 그 새 본문에 맞춰 `hash`까지 다시 계산하면 블록 하나만 보면 해시가 맞습니다. 그래도 두 번째 블록의 `previousHash`는 첫 블록의 `hash`가 아니므로 `validate`는 거짓입니다. 자기 해시만 맞추는 것으로는 목록의 이음이 복구되지 않습니다.

타입 별칭은 이 검증에 참여하지 않습니다. 실행되는 것은 필드와 해시뿐입니다.

## 타입은 실행 코드에 남지 않습니다

`Proposal`, `Block`, `BlockBody`는 `type` 별칭입니다. Node가 타입을 지울 때 이 별칭과 매개변수의 타입 표기는 사라집니다. 열거형 `enum`은 실행용 객체를 만들어야 해서 지우기만 하는 경로에서는 거절됩니다. 그래서 이 파일은 열거형 대신 별칭과 객체를 사용합니다. 상태가 몇 개로 제한되는 값은 문자열 유니언으로 적는 편이 같은 이유로 안전합니다.

상대 경로는 `./chain.ts`입니다. 컴파일 결과인 `.js`를 만들지 않고, 러너가 TypeScript 파일을 직접 읽기 때문입니다. `package.json`의 `"type": "module"`은 이 디렉터리를 ECMAScript 모듈로 취급합니다. Node는 타입을 검사하지 않습니다. 표기가 틀려도 지워지면 실행될 수 있으므로, 동작은 `chain.test.ts`의 단언이 확인합니다.

## 예제

`examples/ts-chain/chain.ts` 전체입니다.

```typescript
import { createHash } from "node:crypto";

export const emptyPreviousHash = "0".repeat(64);

export type Proposal = {
  language: string;
  title: string;
  text: string;
};

export type Block = {
  index: number;
  timestamp: string;
  proposal: Proposal;
  previousHash: string;
  hash: string;
};

type BlockBody = {
  index: number;
  timestamp: string;
  proposal: Proposal;
  previousHash: string;
};

function canonical(body: BlockBody): string {
  const proposal = body.proposal;
  return JSON.stringify({
    index: body.index,
    timestamp: body.timestamp,
    proposal: {
      language: proposal.language,
      title: proposal.title,
      text: proposal.text,
    },
    previousHash: body.previousHash,
  });
}

export function hashBlock(body: BlockBody): string {
  return createHash("sha256").update(canonical(body)).digest("hex");
}

function bodyOf(block: Block): BlockBody {
  return {
    index: block.index,
    timestamp: block.timestamp,
    proposal: block.proposal,
    previousHash: block.previousHash,
  };
}

// 작업 증명은 의도적으로 생략합니다. 해시로 블록을 잇는 목록만 다룹니다.
export class Chain {
  blocks: Block[] = [];

  append(proposal: Proposal, timestamp: string): Block {
    const previous = this.blocks[this.blocks.length - 1];
    const body: BlockBody = {
      index: this.blocks.length,
      timestamp,
      proposal,
      previousHash: previous === undefined ? emptyPreviousHash : previous.hash,
    };
    const block: Block = { ...body, hash: hashBlock(body) };
    this.blocks.push(block);
    return block;
  }

  validate(): boolean {
    for (let index = 0; index < this.blocks.length; index += 1) {
      const block = this.blocks[index];
      if (block.index !== index) {
        return false;
      }
      if (hashBlock(bodyOf(block)) !== block.hash) {
        return false;
      }
      const expectedPrevious =
        index === 0 ? emptyPreviousHash : this.blocks[index - 1].hash;
      if (block.previousHash !== expectedPrevious) {
        return false;
      }
    }
    return true;
  }
}
```

`examples/ts-chain/chain.test.ts` 전체입니다.

```typescript
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
```

## 연습

1. 언어 제안을 하나 더 `append`하고, `index`가 2이며 `previousHash`가 두 번째 블록의 `hash`인지 확인합니다.
2. 첫 블록의 `timestamp`만 바꾼 뒤 `validate`가 거짓이 되는지 보고, 원래 시각으로 되돌립니다.
3. 두 블록의 제안 문장은 그대로 두고 순서만 바꿨을 때 검증이 실패하는 이유를 `index`와 `previousHash`로 설명합니다.

## 스스로 확인

### 1. `hash` 필드를 해시 입력에 넣지 않는 이유는 무엇입니까?

답: 해시 값이 자기 자신을 입력으로 포함해야 하면 그 입력을 해시하기 전에 결과를 알 수 없기 때문입니다.

### 2. 첫 블록의 `previousHash`가 0으로만 이루어진 이유는 무엇입니까?

답: 앞에 블록이 없다는 표시를 해시와 같은 길이의 문자열로 고정하기 위해서입니다. 숨은 앞 블록이 있는 것은 아닙니다.

### 3. `previousHash`를 고치고 그 블록의 `hash`를 다시 계산했는데도 검증이 실패하는 이유는 무엇입니까?

답: 블록 내부의 해시는 맞을 수 있어도, `previousHash`가 실제 이전 블록의 `hash`와 다르면 링크 검사가 실패하기 때문입니다.

### 4. 왜 해시 앞에 0이 몇 개 필요한지 검사하지 않습니까?

답: 작업 증명을 의도적으로 생략했기 때문입니다. 이 구조는 난이도 퍼즐이 아니라 해시로 잇는 목록입니다.

### 5. 테스트가 `./chain.js`가 아니라 `./chain.ts`를 불러오는 이유는 무엇입니까?

답: 타입을 지우는 실행기가 TypeScript 파일을 직접 읽기 때문입니다. 별도의 컴파일 산출물을 만들지 않습니다.
