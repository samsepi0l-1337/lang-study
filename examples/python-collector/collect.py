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
