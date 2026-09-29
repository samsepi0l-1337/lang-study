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
