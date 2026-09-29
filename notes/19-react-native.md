---
title: "React Native로 언어 카드"
slug: react-native
order: 19
level: "초급"
minutes: 40
tags: [React Native]
summary: "복습 규칙만 순수 함수로 두고, 언어 카드 화면은 네이티브 뷰로 분리합니다."
---

# React Native로 언어 카드

## 도입

이 장은 samsepi0l이 React Native로 언어 카드를 나누어 정리한 노트입니다. 갱신 모델은 React와 같고, 결과물은 HTML 문서가 아니라 기기의 네이티브 뷰입니다. 카드마다 연속 정답 횟수인 `streak`이 있고, 학습자가 `again` 또는 `good`으로 복습합니다.

로직은 `examples/react-native/model.js`에만 있습니다. 화면은 `LanguageCards.js`입니다. 테스트는 `model.test.js`이며 `node model.test.js`로 실행합니다. `package.json`의 `"type": "module"` 때문에 `import`를 그대로 쓸 수 있습니다. 테스트는 `react-native`를 불러오지 않습니다.

## 이 장을 끝내면

- React Native에 DOM이 없고 `View`의 기본 축이 세로라는 점을 설명합니다.
- `FlatList`가 행을 나눠 그리는 이유와 `keyExtractor`의 역할을 말합니다.
- 순수 함수 `review`와 화면 컴포넌트를 나눠 테스트합니다.

## DOM이 없습니다

브라우저의 `div`, `span`, `document`는 여기 없습니다. `View`와 `Text`는 HTML 태그가 아니라 네이티브 뷰에 대응하는 React 원소입니다. 글자는 `Text` 안에 둡니다. `View` 안에 글자 노드를 직접 넣지 않습니다.

누르는 면은 `Pressable`이고 콜백 이름은 `onPress`입니다. `onClick`이 아닙니다. 스타일은 CSS 파일이 아니라 `StyleSheet.create`의 객체입니다. 속성 이름은 `marginBottom`처럼 낙타 표기입니다.

## View의 기본 축

`View`는 플렉스 상자이고, 기본 `flexDirection`은 `'column'`입니다. 웹 CSS 플렉스의 기본값 `'row'`와 반대입니다. `styles.screen`은 축을 다시 지정하지 않으므로 제목, 목록, 상세가 위에서 아래로 쌓입니다. `flex: 1`은 부모가 준 세로 공간을 화면이 차지하게 합니다.

가로로 놓을 때만 `flexDirection: "row"`를 적습니다. 카드 행은 이름과 연속 횟수를 양 끝으로 나누고, 복습 버튼 줄도 가로입니다. 기본이 세로라는 사실을 거스를 때만 축을 적는 것이 이 파일의 규칙입니다.

## FlatList

카드가 많아지면 행 전체를 한 번에 만들 이유가 없습니다. `FlatList`는 `data` 전체를 한 번에 만들지 않고, 보이는 구간과 그 근처만 `renderItem`으로 만듭니다. `ScrollView` 안에 `map`으로 `View`를 전부 넣는 방식과 그 점이 다릅니다.

`keyExtractor`는 행의 안정된 문자열을 반환합니다. 예제는 `item.id`를 씁니다. 인덱스를 키로 쓰면 순서가 바뀔 때 다른 카드가 같은 칸으로 오인될 수 있습니다. `review`는 객체를 새로 만들지만 `id`는 유지하므로, 복습 후에도 같은 행으로 남습니다.

## 순수 로직과 화면

`createDeck`은 카드 배열을 새로 만듭니다. 각 카드의 `streak`은 0입니다. `review(card, grade)`는 인자를 고치지 않고 새 객체를 반환합니다. 전개 구문이 `id`, `name`, `summary`를 유지합니다.

`grade`가 `"again"`이면 `streak`은 0입니다. 이미 0이어도 0입니다. `"good"`이면 현재 값에 1을 더합니다. 그 외의 등급은 `unknown grade` 메시지로 예외를 던지고, 던지기 전에 카드를 수정하지 않습니다. `"easy"`는 허용되지 않습니다.

화면의 `gradeSelected`는 선택된 `id`에만 `review`를 적용해 배열을 갈아 끼웁니다. 선택된 카드가 없으면 상세 영역을 그리지 않습니다. `find`가 못 찾으면 `undefined`이고, `?? null`로 화면 쪽 빈 값을 `null`에 모읍니다.

`LanguageCards.js`는 `react-native`를 불러오므로 Node로 실행하지 않습니다. 기기가 필요한 부분과 규칙이 필요한 부분을 나눈 이유가 그것입니다. 규칙이 바뀌면 `model.test.js`만으로 확인하고, 레이아웃은 컴포넌트에 남깁니다.

## 예제

`examples/react-native/model.js` 전체입니다.

```javascript
export function createDeck() {
  return [
    {
      id: "dart",
      name: "Dart",
      summary: "널 안전과 Future를 갖춘 언어",
      streak: 0,
    },
    {
      id: "rust",
      name: "Rust",
      summary: "소유권으로 메모리를 다루는 언어",
      streak: 0,
    },
    {
      id: "haskell",
      name: "Haskell",
      summary: "순수 함수와 타입으로 짜는 언어",
      streak: 0,
    },
  ];
}

export function review(card, grade) {
  if (grade === "again") {
    return { ...card, streak: 0 };
  }
  if (grade === "good") {
    return { ...card, streak: card.streak + 1 };
  }
  throw new Error(`unknown grade: ${grade}`);
}
```

`examples/react-native/model.test.js` 전체입니다.

```javascript
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
```

`examples/react-native/LanguageCards.js` 전체입니다. 이 파일은 Node로 실행하지 않습니다.

```javascript
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { createDeck, review } from "./model.js";

export default function LanguageCards() {
  const [deck, setDeck] = useState(() => createDeck());
  const [selectedId, setSelectedId] = useState(() => createDeck()[0].id);
  const selected = deck.find((card) => card.id === selectedId) ?? null;

  function gradeSelected(grade) {
    setDeck((current) =>
      current.map((card) =>
        card.id === selectedId ? review(card, grade) : card,
      ),
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>언어 카드</Text>
      <FlatList
        data={deck}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedId(item.id)} style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
            <Text>연속 {item.streak}</Text>
          </Pressable>
        )}
      />
      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.name}>{selected.name}</Text>
          <Text>{selected.summary}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => gradeSelected("again")}
              style={styles.button}
            >
              <Text>again</Text>
            </Pressable>
            <Pressable
              onPress={() => gradeSelected("good")}
              style={styles.button}
            >
              <Text>good</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  name: { fontSize: 16, marginBottom: 4 },
  detail: { paddingTop: 16 },
  actions: { flexDirection: "row", marginTop: 8 },
  button: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
});
```

## 연습

1. `review`에 `"good"`을 세 번 이은 결과의 `streak`이 3인지 테스트로 확인합니다.
2. `"hard"`를 넘겨 예외가 나고, 원래 카드의 `streak`은 그대로인지 확인합니다.
3. `review`가 새 객체 대신 `card.streak`을 직접 고치면 `model.test.js`의 어느 단언이 깨지는지 적습니다.

## 스스로 확인

### 1. `LanguageCards`의 루트 `View`에 축을 적지 않으면 자식은 어느 방향으로 쌓입니까?

답: 세로입니다. React Native의 `View`는 기본 `flexDirection`이 `'column'`입니다.

### 2. 왜 `div`로 카드 한 장을 만들 수 없습니까?

답: React Native에는 DOM이 없습니다. 영역은 `View`, 글자는 `Text`, 누름은 `Pressable`이 담당합니다.

### 3. `FlatList`의 `keyExtractor`가 `id`를 반환해야 하는 이유는 무엇입니까?

답: 복습은 객체를 바꾸지만 같은 카드는 같은 `id`를 유지해야 하기 때문입니다. 인덱스는 순서가 바뀌면 신원이 흔들립니다.

### 4. `model.js`가 `react-native`를 불러오지 않는 이유는 무엇입니까?

답: 복습 규칙을 Node에서 그대로 테스트하기 위해서입니다. 화면 의존이 섞이면 `model.test.js`가 기기 없이 실행되지 않습니다.

### 5. `"good"`은 기존 카드를 어떻게 바꿉니까?

답: 바꾸지 않습니다. `streak`만 1 증가한 새 객체를 반환합니다. `"again"`은 `streak`이 0인 새 객체를 반환합니다.
