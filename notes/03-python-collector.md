---
title: "Python으로 문서 수집기 만들기"
slug: python-collector
order: 3
level: "초급"
minutes: 40
tags: [Python, html.parser]
summary: "표준 라이브러리만으로 로컬 HTML 픽스처를 읽어 언어 목록 JSON을 만듭니다."
---

# Python으로 문서 수집기 만들기

수집기는 문서를 읽어 원하는 항목만 고르고, 다음 프로그램이 쓰기 쉬운 형식으로 저장하는 프로그램입니다. 이 장은 Python 표준 라이브러리만 사용합니다. 입력은 저장소 안의 HTML 파일이고, 출력은 언어 이름, 처음 나온 해, 대표 패러다임을 담은 JSON입니다. 작성자는 samsepi0l입니다.

## 이 장을 끝내면

- `html.parser`의 시작 태그, 텍스트, 끝 태그 이벤트로 목록을 뽑습니다.
- `data-year`와 `data-paradigm`이 있는 항목만 JSON으로 저장합니다.
- 왜 이 연습이 네트워크를 호출하지 않는지, robots.txt와 요청 간격이 실제 수집에서 어떤 역할인지 설명합니다.

## 로컬 픽스처

픽스처는 연습이 매번 같은 입력에서 시작하도록 저장해 둔 파일입니다. `examples/python-collector/fixture/languages.html`은 열 개의 언어를 담은 작은 HTML 문서입니다. 기본 실행 경로는 이 파일이며, 스크립트 위치를 기준으로 찾습니다. 현재 작업 디렉터리가 어디인지는 기본 입력에 영향을 주지 않습니다.

네트워크의 페이지를 첫 실험 대상으로 삼지 않는 이유는 세 가지입니다. 페이지 내용이 바뀌면 어제의 정답이 오늘 틀립니다. 사이트가 잠시 응답하지 않으면 파서 연습이 중단됩니다. 그리고 상대가 그 트래픽을 요청한 적이 없습니다. 표준 라이브러리의 `urllib`로 URL을 열 수는 있지만, 이 파일은 `urllib`를 import하지 않습니다. 인자 문자열에 `://`가 있으면 파일을 열기 전에 종료 코드 2로 끝냅니다. `https://`뿐 아니라 `file://`도 이 조건에 걸립니다. 읽는 것은 로컬 경로뿐입니다.

```bash
python3 examples/python-collector/collect.py --check
```

실수: 동작 확인을 위해 처음 보는 사이트의 주소를 기본값으로 넣는 일입니다. 예제의 기본값은 픽스처 경로입니다. 수집 규칙이 맞는지 보려면 `--check`를 붙입니다.

## 이벤트로 읽기

`html.parser.HTMLParser`는 문서를 위에서 아래로 읽으며 이벤트를 호출합니다. 정규식으로 태그를 자르면 `<li>` 안에 또 다른 태그가 들어오는 순간 경계가 어긋납니다. 이벤트 방식은 시작과 끝을 따로 알려 주므로, 지금 항목 안에 있는지만 기억하면 됩니다.

기억할 상태는 두 개입니다. `_current`는 지금 모으는 언어이고, 속성이 없는 `<li>`를 지날 때는 `None`입니다. `_parts`는 그 항목 안에서 도착한 텍스트 조각입니다. `handle_data`는 한 항목의 이름을 여러 번 나눠 줄 수 있으므로 조각을 리스트에 쌓았다가 끝 태그에서 합칩니다.

태그와 속성 이름은 파서가 소문자로 맞춰 줍니다. 기본 설정에서는 `&amp;` 같은 문자 참조를 글자로 풀어 텍스트 이벤트에 넣습니다. 픽스처의 언어 이름에는 문자 참조가 없습니다. 파일은 UTF-8로 읽습니다. 문서의 `charset=utf-8`과 같은 선택입니다.

실수: `handle_data`가 한 번만 호출된다고 가정하고 마지막 조각만 이름으로 두는 일입니다. 그러면 이름이 잘립니다. 예제는 조각을 모두 이어 붙인 뒤 공백을 한 칸으로 줄입니다.

## 속성과 이름

언어로 인정하는 `<li>`는 `data-year`와 `data-paradigm`을 둘 다 가진 항목입니다. 하나라도 없으면 그 항목은 무시합니다. 픽스처 위쪽의 `속성 없는 항목은 수집하지 않습니다.`는 그래서 JSON에 나오지 않습니다. 속성 순서는 상관없습니다. Haskell만 `data-year`를 앞에 두었고, 파서는 속성을 딕셔너리로 만든 뒤 키로 찾습니다.

`data-year`는 앞뒤 공백을 버린 뒤 숫자로만 이루어져 있어야 합니다. 통과하면 정수가 됩니다. `data-paradigm`은 빈 문자열이면 오류입니다. 이 값들은 SQL 장의 대표 라벨과 같게 맞췄습니다. Python, JavaScript, TypeScript, Kotlin, Dart는 `multi-paradigm`이고 Go는 `concurrent`, Rust와 Zig는 `systems`, Elixir와 Haskell은 `functional`입니다. 한 라벨은 분류 연습용이지 그 언어의 유일한 패러다임이라는 선언이 아닙니다.

이름은 끝 태그에서 확정합니다. 조각이 전부 공백이면 오류입니다. 열 개의 순서는 문서에 나온 순서를 유지합니다.

실수: 속성 값이 항상 있다고 생각하고 `None`에 `strip`을 호출하는 일입니다. 값이 없는 속성도 이벤트에 올 수 있으므로, 예제는 `None`을 빈 문자열로 바꿉니다. 그 뒤에 필수 키가 있는지를 검사합니다.

## JSON으로 저장

출력은 객체 하나입니다. `count`는 리스트 길이고, `languages`의 각 원소는 `name`, `year`, `paradigm` 순입니다. 한글을 `\u` 이스케이프로 바꾸지 않고, 들여쓰기는 두 칸이며, 파일 끝에는 줄바꿈을 붙입니다.

열 개 가운데 첫 원소만 적으면 다음 모양입니다. 나머지 아홉 개는 픽스처의 순서를 따릅니다.

```json
{
  "count": 10,
  "languages": [
    {
      "name": "Python",
      "year": 1991,
      "paradigm": "multi-paradigm"
    }
  ]
}
```

기본 출력 경로는 스크립트 옆의 `languages.json`입니다. `-o`로 다른 경로를 줄 수 있습니다. 상대 경로로 주면 그때의 작업 디렉터리 기준입니다.

`--check`는 수집 결과를 모듈의 `EXPECTED`와 비교합니다. 이름, 해, 패러다임, 순서가 하나라도 다르면 종료 코드 1이고, 그 경우에는 파일을 쓰지 않습니다. 검사가 통과하거나 검사를 요청하지 않았을 때만 저장합니다.

실수: 검사를 통과하기 전에 JSON을 저장해 두고 성공이라고 착각하는 일입니다. 실패 경로에서는 `write_json`에 도달하지 않습니다. 성공하면 `wrote 10 languages to ...`가 인쇄됩니다.

## robots.txt와 요청 간격

이 프로그램은 원격 문서를 받지 않습니다. 그래도 실제 수집으로 넘어갈 때 먼저 볼 규칙이 있습니다.

robots.txt는 사이트 운영자가 자동 클라이언트에게 남기는 접근 요청입니다. 보통 사이트 루트의 `/robots.txt`에 있습니다. 어떤 경로를 가져가지 말라고 적혀 있으면, 정중한 수집기는 그 경로를 요청하지 않습니다. 이것은 로그인이나 권한 검사가 아닙니다. 파일을 무시하고 요청하는 것을 기술적으로 막지는 못합니다. 막지 못한다는 사실이 무시해도 된다는 뜻은 아닙니다.

요청 간격은 한 요청과 다음 요청 사이에 두는 시간입니다. 동시에 여는 연결 수에도 상한이 필요합니다. 서버가 바쁘다는 응답을 주면 간격을 늘리고, 실패를 즉시 재시도로 메우지 않습니다. 간격을 두지 않으면 파서를 시험하는 작은 반복이 상대 서버에는 연속된 부하가 됩니다.

예제가 픽스처에 머무는 이유는 파싱과 저장을 그 문제와 분리하기 위해서입니다. 로컬 파일이면 robots.txt를 어길 일이 없고, 간격을 계산할 요청도 없습니다. 나중에 원격 수집을 설계하더라도 첫 단계는 허용 범위 확인과 간격이고, 그 다음에 가져오며, 가져온 본문에 오늘의 파서를 적용하는 순서입니다. 이 저장소의 코드는 그 첫 요청을 만들지 않습니다.

실수: 픽스처로 파서가 통과했으니 같은 코드에 아무 주소나 연결해도 된다고 생각하는 일입니다. 픽스처는 연습용 입력이며, 다른 사이트에 대한 허가가 아닙니다. 스크립트는 그 실수를 막으려고 URL 형태의 인자를 거절합니다.

## 예제

`examples/python-collector/fixture/languages.html`

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>언어 목록 픽스처</title>
</head>
<body>
  <h1>프로그래밍 언어</h1>
  <p>이 파일은 네트워크 없이 파서를 연습하는 로컬 픽스처입니다.</p>
  <ul>
    <li>속성 없는 항목은 수집하지 않습니다.</li>
  </ul>
  <ul id="languages">
    <li data-paradigm="multi-paradigm" data-year="1991">Python</li>
    <li data-paradigm="multi-paradigm" data-year="1995">JavaScript</li>
    <li data-paradigm="concurrent" data-year="2009">Go</li>
    <li data-paradigm="systems" data-year="2010">Rust</li>
    <li data-paradigm="multi-paradigm" data-year="2012">TypeScript</li>
    <li data-paradigm="multi-paradigm" data-year="2011">Kotlin</li>
    <li data-paradigm="functional" data-year="2011">Elixir</li>
    <li data-paradigm="systems" data-year="2016">Zig</li>
    <li data-paradigm="multi-paradigm" data-year="2011">Dart</li>
    <li data-year="1990" data-paradigm="functional">Haskell</li>
  </ul>
</body>
</html>
```

`examples/python-collector/collect.py`

```python
#!/usr/bin/env python3
"""로컬 HTML 픽스처에서 프로그래밍 언어 목록을 읽어 JSON으로 저장한다.

표준 라이브러리만 사용한다. urllib을 부르지 않으며 기본 경로는 네트워크에 접속하지 않는다.
"""

import argparse
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_FIXTURE = ROOT / "fixture" / "languages.html"
DEFAULT_OUTPUT = ROOT / "languages.json"

EXPECTED = [
    ("Python", 1991, "multi-paradigm"),
    ("JavaScript", 1995, "multi-paradigm"),
    ("Go", 2009, "concurrent"),
    ("Rust", 2010, "systems"),
    ("TypeScript", 2012, "multi-paradigm"),
    ("Kotlin", 2011, "multi-paradigm"),
    ("Elixir", 2011, "functional"),
    ("Zig", 2016, "systems"),
    ("Dart", 2011, "multi-paradigm"),
    ("Haskell", 1990, "functional"),
]


class LanguageHTMLParser(HTMLParser):
    """data-year와 data-paradigm이 있는 li만 언어로 모은다."""

    def __init__(self):
        super().__init__()
        self.languages = []
        self._current = None
        self._parts = []

    def handle_starttag(self, tag, attrs):
        if tag != "li":
            return
        found = {}
        for key, value in attrs:
            found[key] = value or ""
        if "data-year" not in found or "data-paradigm" not in found:
            return
        year_text = found["data-year"].strip()
        paradigm = found["data-paradigm"].strip()
        if not year_text.isdigit():
            raise ValueError("data-year가 양의 정수가 아닙니다: %s" % year_text)
        if not paradigm:
            raise ValueError("data-paradigm이 비어 있습니다.")
        self._current = {
            "name": "",
            "year": int(year_text),
            "paradigm": paradigm,
        }
        self._parts = []

    def handle_data(self, data):
        if self._current is not None:
            self._parts.append(data)

    def handle_endtag(self, tag):
        if tag != "li" or self._current is None:
            return
        name = " ".join("".join(self._parts).split())
        if not name:
            raise ValueError("언어 이름이 비어 있습니다.")
        self._current["name"] = name
        self.languages.append(self._current)
        self._current = None
        self._parts = []


def collect(html_text):
    parser = LanguageHTMLParser()
    parser.feed(html_text)
    parser.close()
    if not parser.languages:
        raise ValueError("수집된 언어가 없습니다.")
    return parser.languages


def write_json(languages, output):
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {"count": len(languages), "languages": languages}
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    output.write_text(text, encoding="utf-8")


def check(languages):
    actual = [(item["name"], item["year"], item["paradigm"]) for item in languages]
    if actual != EXPECTED:
        raise AssertionError("픽스처 결과가 예상 목록과 다릅니다: %r" % (actual,))


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="로컬 HTML 파일에서 언어 목록을 수집합니다."
    )
    parser.add_argument(
        "source",
        nargs="?",
        default=str(DEFAULT_FIXTURE),
        help="읽을 HTML 경로. 기본값은 스크립트 옆 픽스처입니다.",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=str(DEFAULT_OUTPUT),
        help="JSON을 쓸 경로. 기본값은 스크립트 옆 languages.json입니다.",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="수집 결과가 픽스처의 예상 목록과 같은지 확인합니다.",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(sys.argv[1:] if argv is None else argv)
    if "://" in args.source:
        print(
            "네트워크 주소는 읽지 않습니다. 로컬 HTML 파일만 사용합니다.",
            file=sys.stderr,
        )
        return 2
    languages = collect(Path(args.source).read_text(encoding="utf-8"))
    if args.check:
        try:
            check(languages)
        except AssertionError as exc:
            print(exc, file=sys.stderr)
            return 1
    write_json(languages, Path(args.output))
    print("wrote %d languages to %s" % (len(languages), args.output))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

기본 실행과 검사, 그리고 네트워크 인자가 거절되는지는 저장소 루트에서 다음으로 확인합니다. 두 번째 명령의 종료 코드는 2입니다.

```bash
python3 examples/python-collector/collect.py --check
python3 examples/python-collector/collect.py "https://example.com/languages.html"
```

## 연습

1. `EXPECTED`의 열 개와 `languages.html`의 `data-year`가 있는 `<li>` 순서가 같은지 비교합니다. 마지막은 Haskell, 1990, `functional`입니다.
2. 속성 없는 `<li>`가 JSON에 없는 이유를 `handle_starttag`에서 찾습니다. 두 데이터 속성이 모두 있을 때만 `_current`를 만듭니다.
3. `://`가 들어 있는 인자의 종료 코드가 2인지 실행으로 확인합니다. 파일을 읽기 전의 `main`이 그 코드를 반환합니다.

## 스스로 확인

1. 이 스크립트의 기본 실행이 네트워크에 접속하는가?
   답: 접속하지 않습니다. 기본 입력은 스크립트 옆의 로컬 픽스처이고 `urllib`를 부르지 않습니다.

2. Haskell은 속성 순서가 다른데 왜 수집되는가?
   답: 파서가 속성을 키로 찾기 때문입니다. `data-year`와 `data-paradigm`이 둘 다 있으면 순서는 상관없습니다.

3. `--check`가 실패하면 JSON 파일은 어떻게 되는가?
   답: 새로 쓰지 않습니다. 비교가 통과한 뒤에만 `write_json`을 호출합니다.

4. robots.txt는 무엇을 막아 주는 장치인가?
   답: 권한 검사가 아닙니다. 자동 클라이언트에게 어떤 경로를 가져가지 말라고 알리는 운영자의 요청입니다.

5. 요청 간격을 두는 이유는 무엇인가?
   답: 연속 요청이 상대 서버의 부하가 되기 때문입니다. 이 연습은 요청 자체를 만들지 않고 로컬 파일만 읽습니다.
