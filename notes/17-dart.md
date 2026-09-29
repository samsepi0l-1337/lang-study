---
title: "Dart 언어의 기본"
slug: dart
order: 17
level: "중급"
minutes: 40
tags: [Dart]
summary: "널 안전, final과 const, Future를 한 파일의 언어 카드 보고서로 확인합니다."
---

# Dart 언어의 기본

## 도입

이 장은 samsepi0l이 Dart의 타입과 비동기 값을 언어 카드로 정리한 노트입니다. 문장은 세미콜론으로 끝나고, 이름에는 타입을 붙일 수 있습니다. 화면 프레임워크는 다루지 않습니다. 카드는 언어의 이름, 계통, 발표 연도, 태그를 갖고, 프로그램은 그 카드로 짧은 보고서를 만듭니다.

예제는 `examples/dart/languages.dart` 한 파일입니다. 외부 패키지 없이 코어 라이브러리만 사용합니다. `Future`, `List`, `Map`, `Set`, `StringBuffer`는 `dart:core`에 있습니다. 최상위 `main`이 보고서를 출력합니다. `examples/dart`에서 `dart run languages.dart`를 실행합니다.

파일이나 네트워크를 기다리지 않습니다. 같은 입력이면 오프라인에서도 같은 보고서가 나옵니다.

## 이 장을 끝내면

- `String`과 `String?`의 차이, 그리고 널 검사 뒤의 타입 프로모션을 설명합니다.
- `final`과 `const`가 고정하는 시점이 다르다는 점을 예제에서 구분합니다.
- `Future.value`와 `async`/`await`로 이미 있는 값을 비동기 함수에 넣습니다.

## 소리 나는 널 안전

소리 나는 널 안전은 널이 아닌 타입의 자리에 널이 들어갈 수 없다고 컴파일러가 보장하는 규칙입니다. 보장은 한 함수 안만의 검사가 아닙니다. 널 안전으로 컴파일된 프로그램 전체에서, 정적 타입이 널을 포함하지 않으면 실행 중 값도 널이 아닙니다. `!`로 널이 아니라고 억지 단언하는 경우는 그 단언이 틀리면 실행이 실패합니다.

`String`은 문자열만 담습니다. `String?`은 문자열 또는 널을 담습니다. `Language.family`는 `String?`입니다. Haskell 카드처럼 계통을 적지 않은 값이 널이며, 그 널은 오류가 아니라 정상적인 값입니다. 널일 수 있는 식을 `String`이 필요한 자리에 그대로 넘기면 컴파일이 거절합니다.

예제는 널을 다루는 두 길을 일부러 같이 둡니다. `label`은 `??`를 사용합니다. 왼쪽이 널일 때만 오른쪽을 고르므로, 식의 결과는 널이 아닌 `String`입니다. `buildReport`는 조건을 사용합니다. `family == null`이면 이름을 계통 미상 집합에 넣고 `continue`합니다. 그 아래의 `family`는 `String`으로 좁혀집니다. 검사로 널 가능성을 제거해 타입을 좁히는 일을 프로모션이라고 합니다. 지역 변수가 `final`이라 이후에 다시 대입되지 않으므로 프로모션이 유지됩니다.

`!`는 컴파일러에게 이 값은 널이 아니라고 우기는 연산자입니다. 우김이 틀리면 실행 중에 즉시 실패합니다. 예제는 `!`를 쓰지 않습니다.

## final과 const

`final` 이름과 `final` 필드는 한 번만 대입됩니다. 그 시점은 실행 중일 수 있습니다. `MemorySource.cards`는 생성자가 받은 리스트로 정해지고, 이후 다른 리스트로 바꿀 수 없습니다.

`const`는 컴파일할 때 값이 확정됩니다. 같은 상수는 하나의 객체로 공유됩니다. `const` 생성자를 호출하려면 필드가 모두 `final`이어야 하고, 인수도 상수여야 합니다. `Language`가 그 조건에 맞습니다. `main`의 `languages`는 `const` 리스트이므로 원소 생성도 상수입니다. Haskell에서 `family`를 생략한 것은 기본값 널이고, 널도 상수입니다.

`const` 이름에 다른 값을 다시 넣을 수 없다는 점은 `final`과 같습니다. 차이는 고정되는 시각과, 안쪽까지 고정되는가입니다. `final` 리스트는 리스트 자체는 못 바꾸지만, 수정 불가로 감싸지 않았다면 원소는 바꿀 수 있습니다. `const` 리스트는 원소 변경도 거절합니다.

`StudyCard`는 `const`가 아닙니다. 태그를 `List.unmodifiable`로 실행 중에 복사하기 때문입니다. 호출자가 나중에 원본 리스트를 고쳐도 카드의 태그는 유지됩니다. 그래서 카드 목록은 `final`이지만 `const`는 아닙니다. 이름은 한 번만 대입되고, 복사본이 만들어지는 시점은 실행 중입니다.

## mixin과 interface

`Language`는 불변 필드와 `label`을 한 타입에 둡니다. 객체가 만들어진 뒤 이름, 계통, 연도는 바뀌지 않습니다.

`Taggable`은 mixin입니다. mixin은 구현을 다른 클래스에 섞지만, 그 자체로 객체를 만들지는 않습니다. 이 mixin은 `tags` 게터를 구현하지 않고 요구만 합니다. `tagLine`은 태그가 비어 있으면 `(태그 없음)`을, 아니면 `#`을 붙인 한 줄을 반환합니다. `StudyCard`는 `with Taggable`로 그 구현을 받고, `final` 필드로 `tags`를 채웁니다.

`CardSource`는 `abstract interface class`입니다. Dart 3의 interface 클래스는 `implements`로 계약을 맞출 수 있고, `extend`로 구현을 물려받지는 못합니다. 계약은 `loadCards`가 카드 리스트의 `Future`를 반환한다는 한 가지입니다. `MemorySource`가 메모리 리스트로 그 계약을 지킵니다. 읽는 쪽을 나중에 바꿔도 `buildReport`가 의존하는 타입은 그대로입니다.

## 컬렉션

보고서는 컬렉션을 역할로 나눕니다. `List`는 카드 순서와 출력 줄을 유지합니다. `Map`은 계통 문자열을 그 계통의 언어 이름 목록으로 보냅니다. `Set`은 계통이 널인 이름을 중복 없이 모읍니다.

`putIfAbsent`는 키가 없을 때만 빈 리스트를 만들고, 있을 때는 이미 있는 리스트를 돌려줍니다. 이 구현의 `Map`과 `Set`은 넣은 순서를 유지합니다. `StringBuffer`는 그 줄들을 하나의 문자열로 잇습니다. 카드 수, 카드별 설명, 계통별 이름, 마지막으로 `계통 미상: Haskell`이 보고서에 포함됩니다.

## Future

`Future<T>`는 T 값이 나중에 한 번 준비된다는 약속입니다. `async` 함수는 그 약속을 반환합니다. `await`는 그 함수 안에서 남은 문장을 미룹니다. 그동안 이벤트 루프는 다른 작업을 처리할 수 있습니다. 프로그램 전체가 그 자리에서 멈추는 문법이 아닙니다.

`loadCards`는 `Future.value`를 반환합니다. 인자는 이미 만든 수정 불가 리스트입니다. 기다릴 소켓이 없습니다. 다만 이 약속은 마이크로태스크로 완료되므로, `await`를 만난 `buildReport`는 현재 실행 흐름이 끝난 뒤에 다음 문장으로 이어집니다. 값이 이미 있다는 뜻이지, `await`가 일반 함수 호출과 글자 그대로 같다는 뜻은 아닙니다.

`buildReport`의 반환 타입은 `Future<String>`입니다. `main`도 `await`를 쓰므로 `Future<void>`입니다. `main`이 보고서를 출력하면 그 `Future`가 끝나고, `dart run`은 그때 프로세스를 종료합니다.

## 예제

`examples/dart/languages.dart` 전체입니다.

```dart
// 코어 라이브러리만 사용하는 Dart 3 언어 카드 보고서입니다.

class Language {
  final String name;
  final String? family;
  final int year;

  const Language({required this.name, this.family, required this.year});

  String label() {
    final String shown = family ?? '계통 미상';
    return '$name / $shown / $year';
  }
}

mixin Taggable {
  List<String> get tags;

  String tagLine() {
    if (tags.isEmpty) {
      return '(태그 없음)';
    }
    return tags.map((String tag) => '#$tag').join(' ');
  }
}

class StudyCard with Taggable {
  final Language language;

  @override
  final List<String> tags;

  StudyCard({required this.language, required List<String> tags})
    : tags = List<String>.unmodifiable(tags);

  String describe() => '${language.label()} ${tagLine()}';
}

abstract interface class CardSource {
  Future<List<StudyCard>> loadCards();
}

class MemorySource implements CardSource {
  final List<StudyCard> cards;

  MemorySource(this.cards);

  @override
  Future<List<StudyCard>> loadCards() {
    // 이미 가진 값이라 네트워크 없이 곧 완료됩니다.
    return Future.value(List<StudyCard>.unmodifiable(cards));
  }
}

Future<String> buildReport(CardSource source) async {
  final List<StudyCard> cards = await source.loadCards();
  final List<String> lines = <String>[];
  final Map<String, List<String>> byFamily = <String, List<String>>{};
  final Set<String> unknown = <String>{};

  for (final StudyCard card in cards) {
    lines.add(card.describe());
    final String? family = card.language.family;
    if (family == null) {
      unknown.add(card.language.name);
      continue;
    }
    final List<String> names = byFamily.putIfAbsent(family, () => <String>[]);
    names.add(card.language.name);
  }

  final StringBuffer buffer = StringBuffer()..writeln('카드 ${cards.length}장');
  for (final String line in lines) {
    buffer.writeln(line);
  }
  for (final MapEntry<String, List<String>> entry in byFamily.entries) {
    buffer.writeln('${entry.key}: ${entry.value.join(', ')}');
  }
  if (unknown.isNotEmpty) {
    buffer.writeln('계통 미상: ${unknown.join(', ')}');
  }
  return buffer.toString();
}

Future<void> main() async {
  const List<Language> languages = <Language>[
    Language(name: 'Dart', family: 'C 계열 문법', year: 2011),
    Language(name: 'Kotlin', family: 'JVM', year: 2011),
    Language(name: 'Haskell', year: 1990),
  ];

  final List<StudyCard> cards = <StudyCard>[
    StudyCard(language: languages[0], tags: <String>['널 안전', 'Future']),
    StudyCard(language: languages[1], tags: <String>['널 안전']),
    StudyCard(language: languages[2], tags: <String>['순수 함수']),
  ];

  final String report = await buildReport(MemorySource(cards));
  print(report);
}
```

## 연습

1. 태그가 빈 `StudyCard`를 하나 추가하고, 보고서에 `(태그 없음)`이 보이는지 확인한 뒤 원문으로 되돌립니다.
2. `languages`의 `const`를 제거해도 `Language.year`는 왜 생성 후에 대입할 수 없는지, 필드의 선언을 보고 설명합니다.
3. `loadCards`가 빈 리스트의 `Future.value`를 반환하게 잠깐 바꾸고, 카드 수가 0으로 출력되는지 확인한 뒤 되돌립니다.

## 스스로 확인

### 1. `String?` 필드에 널을 저장하는 것은 실행 오류입니까?

답: 아닙니다. `String?`에서 널은 허용된 값입니다. 널이 아닌 `String`에 널을 넣으려 할 때 컴파일이 거절됩니다.

### 2. `family == null`인 분기를 `continue`로 빠져나간 뒤 `family`의 타입은 무엇입니까?

답: `String`입니다. 널인 경우를 벗어났고 변수가 다시 대입되지 않으므로 프로모션이 적용됩니다.

### 3. `const` 리스트와 `final` 리스트는 어떻게 다릅니까?

답: 둘 다 다른 리스트로 다시 대입할 수 없습니다. `const` 리스트는 컴파일 시각에 고정되고 원소도 바꿀 수 없습니다. `final` 리스트는 실행 중에 만들어질 수 있고, 수정 불가로 감싸지 않았다면 원소는 바뀔 수 있습니다.

### 4. `CardSource`를 `extends`하지 않는 이유는 무엇입니까?

답: `abstract interface class`는 구현 상속을 열지 않습니다. `MemorySource`는 `implements`로 `loadCards` 계약만 지킵니다.

### 5. 네트워크가 없는데도 `loadCards`가 `Future`를 반환하는 이유는 무엇입니까?

답: 호출 쪽인 `buildReport`가 비동기 계약을 보게 하기 위해서입니다. `Future.value`는 이미 있는 리스트로 그 약속을 즉시 완료 가능한 형태로 만듭니다.
