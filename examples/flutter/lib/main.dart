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
