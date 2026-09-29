---
title: "Flutter로 언어 카드"
slug: flutter
order: 18
level: "중급"
minutes: 40
tags: [Flutter]
summary: "메모리 속 즐겨찾기와 상세 경로를 Flutter 3 위젯으로 구성합니다."
---

# Flutter로 언어 카드

## 도입

이 장은 samsepi0l이 Flutter 위젯으로 언어 카드 목록과 상세 화면을 정리한 노트입니다. 즐겨찾기는 프로세스 메모리에만 있고, 디스크나 서버에는 저장하지 않습니다.

코드는 `examples/flutter/lib/main.dart`와 `examples/flutter/pubspec.yaml`입니다. 패키지 이름은 `language_cards`입니다. `environment.sdk`의 `>=3.3.0 <4.0.0`은 Dart SDK 범위이고, `flutter: sdk: flutter`는 pub.dev 패키지가 아니라 Flutter SDK 자체를 의존성으로 선언합니다.

## 이 장을 끝내면

- `StatelessWidget`과 `StatefulWidget`이 상태를 나누는 위치를 설명합니다.
- `build`가 자주 불려도 되는 이유와 `Key`의 역할을 짧게 말합니다.
- `Column`과 `ListView` 중 하나를 고르고, `Navigator.push`로 상세 경로를 쌓습니다.

## StatelessWidget과 StatefulWidget

위젯 객체는 불변 설정입니다. `StatelessWidget`은 그 설정과 상속 위젯만으로 `build`가 화면을 결정합니다. 바꿔야 할 필드를 위젯 안에 두지 않습니다. `LanguageCardsApp`과 `DetailPage`가 이쪽입니다.

`StatefulWidget`도 설정 자체는 불변입니다. 바뀌는 값은 짝이 되는 `State`에 있습니다. `_DeckPageState`의 `_favorites`가 그 값입니다. 프레임워크는 같은 위치에서 위젯의 런타임 타입과 `Key`가 같으면 기존 `State`를 다음 위젯에 다시 붙입니다. 그래서 부모가 다시 `build`되어 `DeckPage` 객체가 새로 만들어져도, 즐겨찾기 집합은 `State`가 살아있는 동안 유지됩니다.

별 아이콘을 누르면 `_toggle`이 `setState`를 호출합니다. 콜백 안에서 집합만 고치고, 화면 조립은 `build`에 맡깁니다. `setState`는 그 `State`의 `build`를 다시 예약하는 알림입니다. 앱을 다시 시작하면 집합은 비어 있습니다. 저장소가 메모리뿐이기 때문입니다.

## build

`build`는 위젯이 처음 붙을 때, `setState` 때, 부모가 다시 빌드할 때, 의존하는 상속 위젯이 바뀔 때 호출될 수 있습니다. 자주 불려도 결과가 같아야 하므로 부수 효과를 넣지 않습니다. 즐겨찾기를 토글하거나 경로를 여는 일은 `onPressed`와 `onTap`에 둡니다.

반환값은 다음 프레임에 보여주고 싶은 위젯 트리의 설명입니다. 프레임워크가 이전 트리와 맞춰 필요한 부분만 갱신합니다. `build`가 직접 픽셀을 칠하지는 않습니다.

## Key

자식의 순서가 바뀌지 않으면 프레임워크는 위치와 런타임 타입으로 이전 원소와 새 원소를 짝짓습니다. `ValueKey<String>(item.name)`은 그 행에 이름이라는 안정된 신원을 줍니다. 나중에 목록을 걸러도 같은 이름의 행을 같은 원소로 볼 수 있습니다.

이 예제는 순서를 바꾸지 않습니다. 키는 토글이 동작하려고 꼭 필요해서가 아니라, 행의 신원을 드러내려고 붙어 있습니다. `GlobalKey`는 다른 위치의 `State`나 렌더 객체에 접근할 때 쓰는 무거운 키이므로 별 아이콘에는 쓰지 않습니다.

## Column과 ListView

둘 다 기본 주축은 세로입니다. `Column`은 자식의 높이를 한 번에 잡고 스크롤하지 않습니다. 자식이 화면보다 길어지면 넘칩니다. 상세 화면은 요약 한 줄과 즐겨찾기 문장뿐이라 `Padding` 안의 `Column`이 맞습니다. `CrossAxisAlignment.start`는 가로 방향에서 글을 왼쪽에 붙입니다.

목록은 늘어날 수 있으므로 `ListView.builder`를 씁니다. `itemCount`와 `itemBuilder`로 인덱스에 해당하는 행만 만들고, 보이는 구간과 그 근처를 유지합니다. 카드 전체를 `Column`의 자식으로 한 번에 펼치지 않습니다. `ListTile`이 한 행입니다.

## 두 번째 경로

`MaterialApp`의 `home`이 첫 경로인 `DeckPage`입니다. 행을 누르면 `Navigator.push`가 `MaterialPageRoute`로 `DetailPage`를 스택 위에 올립니다. 상세 경로가 쌓여 있으므로 앱 바의 뒤로 가기는 그 경로를 `pop`합니다. 별도의 버튼 위젯을 만들지 않습니다. `RaisedButton`은 쓰지 않습니다. 누르는 동작은 `IconButton`과 `ListTile`의 콜백만 사용합니다.

상세 페이지는 `StatelessWidget`입니다. 생성자가 그 순간의 `favorite` 불리언을 받습니다. 이미 열린 상세 화면은 목록의 이후 `setState`로 다시 빌드되지 않습니다. 돌아와서 다시 열면 그때의 집합을 읽습니다. 즐겨찾기는 카드 객체의 필드가 아니라 `_favorites` 집합에 있습니다.

`uses-material-design: true`가 없으면 `Icons.star`에 대응하는 글꼴이 빠질 수 있습니다. 아이콘이 보이게 하는 선언입니다.

## 예제

`examples/flutter/pubspec.yaml` 전체입니다.

```yaml
name: language_cards
description: In-memory language cards.
publish_to: "none"
version: 0.1.0

environment:
  sdk: ">=3.3.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter

flutter:
  uses-material-design: true
```

`examples/flutter/lib/main.dart` 전체입니다.

```dart
import 'package:flutter/material.dart';

class LanguageItem {
  const LanguageItem({required this.name, required this.summary});

  final String name;
  final String summary;
}

void main() {
  runApp(const LanguageCardsApp());
}

class LanguageCardsApp extends StatelessWidget {
  const LanguageCardsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '언어 카드',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: const DeckPage(),
    );
  }
}

class DeckPage extends StatefulWidget {
  const DeckPage({super.key});

  @override
  State<DeckPage> createState() => _DeckPageState();
}

class _DeckPageState extends State<DeckPage> {
  static const List<LanguageItem> _items = <LanguageItem>[
    LanguageItem(name: 'Dart', summary: '널 안전과 Future를 갖춘 언어'),
    LanguageItem(name: 'Rust', summary: '소유권으로 메모리 사용을 정하는 언어'),
    LanguageItem(name: 'Haskell', summary: '순수 함수와 타입으로 짜는 언어'),
  ];

  final Set<String> _favorites = <String>{};

  bool _isFavorite(String name) => _favorites.contains(name);

  void _toggle(String name) {
    setState(() {
      if (_favorites.contains(name)) {
        _favorites.remove(name);
      } else {
        _favorites.add(name);
      }
    });
  }

  void _open(LanguageItem item) {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (BuildContext context) {
          return DetailPage(item: item, favorite: _isFavorite(item.name));
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('언어 카드')),
      body: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (BuildContext context, int index) {
          final LanguageItem item = _items[index];
          final bool favorite = _isFavorite(item.name);
          return ListTile(
            key: ValueKey<String>(item.name),
            title: Text(item.name),
            subtitle: Text(item.summary),
            onTap: () => _open(item),
            trailing: IconButton(
              tooltip: '즐겨찾기',
              onPressed: () => _toggle(item.name),
              icon: Icon(favorite ? Icons.star : Icons.star_border_outlined),
            ),
          );
        },
      ),
    );
  }
}

class DetailPage extends StatelessWidget {
  const DetailPage({super.key, required this.item, required this.favorite});

  final LanguageItem item;
  final bool favorite;

  @override
  Widget build(BuildContext context) {
    final String status = favorite ? '즐겨찾기에 있습니다.' : '즐겨찾기에 없습니다.';
    return Scaffold(
      appBar: AppBar(title: Text(item.name)),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(item.summary, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Text(status),
          ],
        ),
      ),
    );
  }
}
```

## 연습

1. `LanguageItem`을 하나 더 넣고, `ListView`의 종류를 바꾸지 않아도 행이 늘어나는지 확인합니다.
2. 상세 화면 `Column`에 문장 위젯을 하나 추가하고, 그 정도 길이에서는 왜 `ListView`가 필요 없는지 설명합니다.
3. 별을 켠 뒤 상세 경로를 열어 문장을 확인하고, 돌아온 다음 별을 끄고 다시 열었을 때 문장이 바뀌는지 확인합니다.

## 스스로 확인

### 1. `DeckPage` 위젯 객체와 즐겨찾기 집합 중 무엇이 다시 만들어져도 남습니까?

답: `State` 안의 `_favorites`가 남습니다. `StatefulWidget` 객체는 불변 설정이고, 재빌드 때 새 인스턴스가 되어도 같은 `State`에 다시 붙을 수 있습니다.

### 2. `setState` 콜백 안에서 위젯 트리를 조립해야 합니까?

답: 아닙니다. 콜백에서는 필드를 고치고, 트리는 이어서 호출되는 `build`가 반환합니다.

### 3. 이 목록은 순서를 바꾸지 않는데 `ValueKey`를 둔 이유는 무엇입니까?

답: 행의 신원을 이름에 고정한다는 것을 코드에서 보이게 하기 위해서입니다. 토글 자체는 키 없이도 `setState`로 갱신됩니다.

### 4. 상세 본문이 `Column`인 이유는 무엇입니까?

답: 자식 수가 적고 스크롤이 필요 없기 때문입니다. 길어질 수 있는 목록은 `ListView.builder`가 맡습니다.

### 5. 상세 화면을 연 채로 목록의 별을 바꾸면 상세 문장도 즉시 바뀝니까?

답: 아닙니다. 상세 경로는 열릴 때 받은 불리언으로 빌드된 `StatelessWidget`입니다. 다시 열 때 현재 집합을 읽습니다.
