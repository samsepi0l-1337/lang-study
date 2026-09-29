---
title: "SQL로 언어 데이터를 다루기"
slug: sql
order: 2
level: "초급"
minutes: 45
tags: [SQL, SQLite]
summary: "SQLite로 언어와 구현체와 릴리스를 거르고 묶고, 잘못된 연도는 트랜잭션으로 되돌립니다."
---

# SQL로 언어 데이터를 다루기

SQL은 표에 질문을 던지고, 여러 표를 같은 기준으로 잇고, 한 묶음의 쓰기를 통째로 확정하거나 취소하는 언어입니다. 이 장은 SQLite로 프로그래밍 언어, 그 구현체, 릴리스를 다룹니다. 한 언어를 패러다임 하나, 대표 구현체 몇 개로 줄인 연습용 표본이며 배포 역사를 전부 적은 표가 아닙니다. 작성자는 samsepi0l입니다.

## 이 장을 끝내면

- 언어, 구현체, 릴리스를 걸러 내고 세 표를 조인하며, 패러다임별 개수와 릴리스 순번을 구합니다.
- NULL이 빈 문자나 0이 아닌 이유를 말하고, `IS NULL`로 릴리스가 없는 구현체를 찾습니다.
- 인덱스가 어떤 질문에 쓰이는지 보고, 잘못된 연도가 섞인 쓰기를 트랜잭션으로 되돌립니다.

## 세 개의 표

언어 하나에는 구현체가 여럿일 수 있고, 구현체 하나에는 릴리스가 여럿일 수 있습니다. 이것을 한 표에 반복해서 적으면 언어 이름이 릴리스 수만큼 복사됩니다. 이름은 `languages`에 한 번만 두고, `implementations`와 `releases`는 정수 키로 가리킵니다.

| 표 | 한 행이 의미하는 것 | 다른 표를 가리키는 열 |
| --- | --- | --- |
| languages | 언어와 처음 등장한 해, 대표 패러다임 | 없음 |
| implementations | 컴파일러나 런타임 | language_id |
| releases | 그 구현체의 버전과 날짜 | implementation_id |

`languages.name`은 중복될 수 없습니다. 같은 언어 안에서 구현체 이름도 중복될 수 없습니다. 같은 구현체의 같은 버전 문자열도 한 번만 둡니다. 패러다임은 언어마다 라벨을 하나만 저장합니다. Python을 `multi-paradigm`으로 둔 것은 그 언어의 전부가 아니라, `GROUP BY`를 연습하려고 고른 대표 값입니다. Go는 `concurrent`, Rust와 Zig는 `systems`, Elixir와 Haskell은 `functional`입니다.

연도에는 하한을 두었습니다. `first_year`와 구현체의 `year`는 1950부터 2100까지입니다. 이 범위는 이 표의 제약이지, 1950년 이전에 언어가 없었다는 뜻이 아닙니다. 우리 표본의 가장 이른 언어는 1990년의 Haskell입니다.

SQLite는 외래 키를 선언해도 기본으로는 검사하지 않습니다. 연결마다 다음이 필요합니다. 스키마 파일과 쿼리 파일이 둘 다 이 문장으로 시작합니다.

```sql
PRAGMA foreign_keys = ON;
```

실수: 부모 행보다 자식 행을 먼저 넣는 일입니다. 시드는 언어, 구현체, 릴리스 순서입니다. PyPy는 구현체로는 넣지만 릴리스는 일부러 넣지 않습니다. 없는 릴리스를 빈 문자열로 만들어 두지 않습니다.

## 거르기와 조인

필터는 `WHERE`로 행을 남기는 일입니다. 2010년 이후에 처음 나온 언어만 보려면 `first_year`를 비교합니다.

```sql
SELECT name, first_year, paradigm
FROM languages
WHERE first_year >= 2010
ORDER BY first_year, name;
```

이 질문의 결과는 Rust, Dart, Elixir, Kotlin, TypeScript, Zig입니다. 같은 2011년 안에서는 이름 순으로 Dart, Elixir, Kotlin이 옵니다. Go는 2009년이라 빠지고, Python, JavaScript, Haskell도 빠집니다.

세 표 조인은 언어 이름, 구현체 이름, 버전을 한 줄로 붙입니다. `JOIN`은 양쪽 모두에 대응 행이 있을 때만 남깁니다. 릴리스가 없는 PyPy는 이 결과에 없습니다. 순서는 언어, 구현체, 날짜입니다. CPython은 3.12.0 다음에 3.13.0이 옵니다. 구현체 이름의 정렬은 SQLite의 이진 순서라 `CPython`과 `V8`처럼 대문자로 시작하는 이름이 `dart-sdk`보다 앞에 옵니다.

실수: 조인 조건을 빠뜨리는 일입니다. 조건이 없으면 모든 언어와 모든 릴리스가 곱해져 행 수가 갑자기 커집니다. 예제의 조인은 `language_id`와 `implementation_id`로만 잇습니다.

## 묶기와 순번

`GROUP BY paradigm`은 같은 라벨끼리 모아 `COUNT(*)`로 언어 수를 셉니다. 세는 대상은 언어 행이지 릴리스 행이 아닙니다.

| paradigm | language_count |
| --- | ---: |
| multi-paradigm | 5 |
| functional | 2 |
| systems | 2 |
| concurrent | 1 |

`COUNT(*)`는 그 묶음의 행 수입니다. 나중에 보는 NULL과는 다르게, 이 질문의 `paradigm`은 `NOT NULL`이라 빈 묶음이 생기지 않습니다.

순번이 필요하면 `ROW_NUMBER()`를 씁니다. 윈도 함수는 행을 지우지 않고, 각 행에 계산 값을 붙입니다. 파티션을 `implementation_id`로 나누면 번호가 구현체마다 1부터 다시 시작합니다. 파티션 안의 순서는 `released_on`, 그다음 `version`입니다. 날짜를 `YYYY-MM-DD` 텍스트로 두면 문자열 정렬이 시간 순서와 같습니다. CPython의 3.12.0은 1, 3.13.0은 2입니다. rustc의 1.0.0은 1, 1.81.0은 2입니다. 릴리스가 하나뿐인 구현체는 1만 가집니다.

```sql
ROW_NUMBER() OVER (
  PARTITION BY r.implementation_id
  ORDER BY r.released_on, r.version
) AS release_no
```

실수: `ROW_NUMBER()`가 중복 버전을 지운다고 생각하는 일입니다. 번호를 붙일 뿐이고, 같은 버전을 막는 것은 표의 `UNIQUE (implementation_id, version)`입니다.

## NULL

NULL은 값이 없다는 표시입니다. 빈 문자열도 아니고 0도 아닙니다. 비교 `= NULL`은 참이 아니라 알 수 없음이 되고, `WHERE`는 알 수 없음을 탈락시킵니다. 그래서 없는 값을 찾을 때는 `IS NULL`을 씁니다.

```sql
SELECT i.name AS implementation, r.version
FROM implementations AS i
LEFT JOIN releases AS r ON r.implementation_id = i.id
WHERE r.version IS NULL
ORDER BY i.name;
```

`LEFT JOIN`은 오른쪽 표에 대응이 없어도 왼쪽 행을 남기고, 오른쪽 열을 NULL로 채웁니다. 이 질문의 결과는 PyPy 한 행이고 `version`은 NULL입니다. 안쪽 조인이었다면 이 행은 사라집니다. PyPy를 구현체 표에 둔 이유는 이 차이를 보기 위해서입니다.

관련된 규칙이 두 개 더 있습니다. `COUNT(r.version)`은 NULL이 아닌 값만 세고 `COUNT(*)`는 행을 셉니다. NULL끼리는 `=`로 같지 않다고 판단되므로, 빈 릴리스를 `''`로 저장하면 `IS NULL` 질문과도 `COUNT`와도 다른 결과가 납니다.

실수: 릴리스가 없음을 `'없음'`이라는 문자로 넣는 일입니다. 그러면 버전 목록에 가짜 버전이 생기고, NULL을 전제로 한 조건은 그 행을 찾지 못합니다. 예제는 행을 생략하고 조인이 NULL을 만들게 둡니다.

## 인덱스

인덱스는 어떤 열로 행을 빨리 찾게 해 주는 별도의 구조입니다. 기본 키는 이미 인덱스입니다. SQLite는 외래 키 열을 자동으로 인덱싱하지 않으므로, 조인에 쓰는 `language_id`와 `implementation_id`에 인덱스를 만듭니다. 패러다임으로 거르거나 묶을 일에 대비해 `paradigm`에도 만듭니다.

```sql
CREATE INDEX idx_languages_paradigm ON languages(paradigm);
CREATE INDEX idx_implementations_language_id ON implementations(language_id);
CREATE INDEX idx_releases_implementation_id ON releases(implementation_id);
```

인덱스가 실제로 선택되는지는 플래너가 정합니다. 행이 적으면 전체를 읽는 편이 싸다고 판단할 수도 있습니다. 이 스키마를 메모리 데이터베이스에 넣은 뒤 아래를 실행하면, 이 SQLite는 패러다임 동등 비교에 인덱스를 씁니다.

```sql
EXPLAIN QUERY PLAN
SELECT name
FROM languages
WHERE paradigm = 'functional';
```

관찰된 계획은 `SEARCH languages USING INDEX idx_languages_paradigm (paradigm=?)`입니다. 다른 질문은 다른 계획을 고를 수 있습니다. 인덱스는 읽기를 돕지만, 쓸 때마다 함께 고쳐야 하므로 모든 열에 거는 것이 이득은 아닙니다.

실수: 외래 키를 선언했다는 이유만으로 조인이 인덱스를 탄다고 생각하는 일입니다. 선언은 참조 무결성의 규칙이고, 인덱스는 따로 만듭니다. 예제는 둘 다 적습니다.

## 트랜잭션

트랜잭션은 여러 쓰기를 하나의 성공 또는 하나의 실패로 묶는 일입니다. `BEGIN TRANSACTION`과 `COMMIT` 사이의 변경은 커밋 전에는 다른 연결에 보이지 않습니다. `ROLLBACK`은 그 구간의 쓰기를 취소합니다.

릴리스 날짜에는 `release_year`라는 `CHECK`가 있습니다. 값이 `YYYY-MM-DD` 꼴이고, 앞 네 글자를 정수로 본 해가 1950부터 2100까지여야 합니다. 달력에 없는 날인지는 검사하지 않습니다. `2024-13-99`처럼 모양과 해만 맞으면 이 제약은 통과합니다. `1800-01-01`은 모양은 맞지만 해가 범위 밖이라 거절됩니다.

`queries.sql`의 트랜잭션은 두 단계입니다. 먼저 CPython에 `9.9.9-draft`와 날짜 `2026-01-15`를 넣습니다. 이 날짜는 제약을 통과하므로, 커밋 전에는 `draft-visible` 조회에 그 버전이 보입니다. 다음 문장은 `0.0.1-bad`와 `1800-01-01`입니다. sqlite3 셸에는 예외를 잡아 분기하는 구문이 없습니다. 제약이 오류를 내는 순간 파일의 뒤쪽 문장을 안정적으로 가르치기 어려우므로, 여기서는 `INSERT OR IGNORE`를 씁니다. `CHECK`가 그 행을 거절하고, `changes()`는 0입니다. 잘못된 해가 같은 작업에 섞였으므로 이어서 `ROLLBACK`합니다. 초안까지 사라집니다. 마지막 조회의 `rolled_back_rows`는 0입니다.

`COMMIT`을 대신 호출하면 거절된 나쁜 행은 없어도 초안은 남습니다. 되돌리는 이유는 나쁜 행이 표에 남아서가 아니라, 그 해 때문에 작업 전체를 포기하기 위해서입니다. `run.sh`는 이 파일과 별도로 `OR IGNORE` 없는 `INSERT`를 한 번 실행합니다. 그 명령은 실패해야 하고, 오류 문자열은 `CHECK constraint failed: release_year`여야 합니다. 같은 연결에서 오류 직후에 조회하면 초안이 아직 보입니다. 제약은 그 문장만 취소하기 때문입니다. 커밋하지 않은 채 프로세스가 끝나면 열린 트랜잭션은 버려져 초안도 사라집니다. 예제는 그 종료 동작에만 맡기지 않고 `ROLLBACK`을 직접 적습니다.

실수: 트랜잭션을 연 채 프롬프트를 두는 일입니다. 다음 문장이 전부 그 트랜잭션 안에서 실행됩니다. 스크립트는 `BEGIN`마다 `ROLLBACK`으로 닫습니다.

## 예제

스키마와 시드는 `examples/sql/schema.sql`입니다. 메모리 데이터베이스에 넣을 때는 다음이 0으로 끝나야 합니다.

```bash
sqlite3 :memory: < examples/sql/schema.sql
```

`examples/sql/schema.sql`

```sql
-- 언어, 구현체, 릴리스를 담는 SQLite 스키마와 시드입니다.
-- 실행: sqlite3 :memory: < examples/sql/schema.sql
-- 버전과 날짜는 조인 연습용 표본이며, 배포 역사를 전부 적은 것이 아닙니다.
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS releases;
DROP TABLE IF EXISTS implementations;
DROP TABLE IF EXISTS languages;

CREATE TABLE languages (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  first_year INTEGER NOT NULL CHECK (first_year BETWEEN 1950 AND 2100),
  paradigm TEXT NOT NULL
);

CREATE TABLE implementations (
  id INTEGER PRIMARY KEY,
  language_id INTEGER NOT NULL REFERENCES languages(id),
  name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year BETWEEN 1950 AND 2100),
  UNIQUE (language_id, name)
);

CREATE TABLE releases (
  id INTEGER PRIMARY KEY,
  implementation_id INTEGER NOT NULL REFERENCES implementations(id),
  version TEXT NOT NULL,
  released_on TEXT NOT NULL,
  UNIQUE (implementation_id, version),
  CONSTRAINT release_year CHECK (
    released_on GLOB '????-??-??'
    AND CAST(substr(released_on, 1, 4) AS INTEGER) BETWEEN 1950 AND 2100
  )
);

CREATE INDEX idx_languages_paradigm ON languages(paradigm);
CREATE INDEX idx_implementations_language_id ON implementations(language_id);
CREATE INDEX idx_releases_implementation_id ON releases(implementation_id);

INSERT INTO languages (id, name, first_year, paradigm) VALUES
  (1, 'Python', 1991, 'multi-paradigm'),
  (2, 'JavaScript', 1995, 'multi-paradigm'),
  (3, 'Go', 2009, 'concurrent'),
  (4, 'Rust', 2010, 'systems'),
  (5, 'TypeScript', 2012, 'multi-paradigm'),
  (6, 'Kotlin', 2011, 'multi-paradigm'),
  (7, 'Elixir', 2011, 'functional'),
  (8, 'Zig', 2016, 'systems'),
  (9, 'Dart', 2011, 'multi-paradigm'),
  (10, 'Haskell', 1990, 'functional');

INSERT INTO implementations (id, language_id, name, year) VALUES
  (1, 1, 'CPython', 1991),
  (2, 1, 'PyPy', 2007),
  (3, 2, 'V8', 2008),
  (4, 3, 'go', 2009),
  (5, 4, 'rustc', 2010),
  (6, 5, 'tsc', 2012),
  (7, 6, 'kotlinc', 2011),
  (8, 7, 'elixirc', 2011),
  (9, 8, 'zig', 2016),
  (10, 9, 'dart-sdk', 2011),
  (11, 10, 'ghc', 1992);

INSERT INTO releases (id, implementation_id, version, released_on) VALUES
  (1, 1, '3.12.0', '2023-10-02'),
  (2, 1, '3.13.0', '2024-10-07'),
  (3, 3, '12.2.0', '2024-02-20'),
  (4, 4, '1.22.0', '2024-02-06'),
  (5, 5, '1.0.0', '2015-05-15'),
  (6, 5, '1.81.0', '2024-09-05'),
  (7, 6, '5.0.0', '2023-03-16'),
  (8, 7, '1.0.0', '2016-02-15'),
  (9, 8, '1.0.0', '2014-09-10'),
  (10, 9, '0.13.0', '2024-06-06'),
  (11, 10, '3.0.0', '2023-05-10'),
  (12, 11, '9.8.1', '2024-02-27');
```

조회와 롤백 연습은 `examples/sql/queries.sql`입니다. 스키마를 적용한 연결에서 실행합니다.

`examples/sql/queries.sql`

```sql
-- schema.sql을 적용한 뒤 실행합니다.
-- sqlite3 셸에는 try/catch가 없습니다. 잘못된 연도는 OR IGNORE로 거절한 뒤 ROLLBACK 합니다.
PRAGMA foreign_keys = ON;

-- 1. 필터: 2010년 이후에 처음 나온 언어
SELECT name, first_year, paradigm
FROM languages
WHERE first_year >= 2010
ORDER BY first_year, name;

-- 2. 언어, 구현체, 릴리스를 한 줄로 잇습니다. PyPy처럼 릴리스가 없는 구현체는 빠집니다.
SELECT
  l.name AS language,
  i.name AS implementation,
  r.version,
  r.released_on
FROM languages AS l
JOIN implementations AS i ON i.language_id = l.id
JOIN releases AS r ON r.implementation_id = i.id
ORDER BY l.name, i.name, r.released_on;

-- 3. 패러다임별 언어 수. 이 표는 언어마다 대표 라벨을 하나만 둡니다.
SELECT paradigm, COUNT(*) AS language_count
FROM languages
GROUP BY paradigm
ORDER BY language_count DESC, paradigm;

-- 4. 구현체 안에서 릴리스가 나온 순번
SELECT
  i.name AS implementation,
  r.version,
  r.released_on,
  ROW_NUMBER() OVER (
    PARTITION BY r.implementation_id
    ORDER BY r.released_on, r.version
  ) AS release_no
FROM releases AS r
JOIN implementations AS i ON i.id = r.implementation_id
ORDER BY i.name, release_no;

-- 5. 릴리스 행이 없으면 version은 NULL입니다. = NULL이 아니라 IS NULL을 씁니다.
SELECT i.name AS implementation, r.version
FROM implementations AS i
LEFT JOIN releases AS r ON r.implementation_id = i.id
WHERE r.version IS NULL
ORDER BY i.name;

-- 6. 초안 릴리스와 잘못된 연도를 한 트랜잭션에 넣습니다.
BEGIN TRANSACTION;

INSERT INTO releases (implementation_id, version, released_on)
VALUES (1, '9.9.9-draft', '2026-01-15');

SELECT 'draft-visible' AS point, version
FROM releases
WHERE version = '9.9.9-draft';

INSERT OR IGNORE INTO releases (implementation_id, version, released_on)
VALUES (1, '0.0.1-bad', '1800-01-01');

SELECT changes() AS ignored_insert_changes;

-- 잘못된 연도가 같은 작업에 섞였으므로 초안까지 되돌립니다.
-- COMMIT하면 거절된 행은 없어도 초안은 남습니다.
ROLLBACK;

SELECT COUNT(*) AS rolled_back_rows
FROM releases
WHERE version IN ('9.9.9-draft', '0.0.1-bad');
```

`examples/sql/run.sh`는 임시 파일 데이터베이스에 두 파일을 순서대로 적용하고, 언어 수, 롤백, PyPy의 NULL, `release_year` 오류를 확인합니다. 예상 밖의 실패가 있으면 0이 아닌 상태로 끝납니다. 성공하면 조회 행을 인쇄한 뒤 `sql ok`를 인쇄합니다.

`examples/sql/run.sh`

```bash
#!/usr/bin/env bash
# 임시 데이터베이스에 schema.sql과 queries.sql을 순서대로 적용합니다.
# 예상하지 못한 쿼리 오류가 있으면 0이 아닌 상태로 끝납니다.
set -euo pipefail

root=$(cd "$(dirname "$0")" && pwd)
db=$(mktemp)
err=$(mktemp)
trap 'rm -f "$db" "$err"' EXIT

sqlite3 -batch "$db" < "$root/schema.sql"
sqlite3 -batch "$db" < "$root/queries.sql"

languages=$(sqlite3 -batch "$db" "SELECT COUNT(*) FROM languages;")
if [[ "$languages" -ne 10 ]]; then
  echo "언어 수가 10이 아닙니다: ${languages}" >&2
  exit 1
fi

left=$(sqlite3 -batch "$db" "SELECT COUNT(*) FROM releases WHERE version IN ('9.9.9-draft', '0.0.1-bad');")
if [[ "$left" -ne 0 ]]; then
  echo "롤백되지 않은 릴리스가 남아 있습니다: ${left}" >&2
  exit 1
fi

functional=$(sqlite3 -batch "$db" "SELECT COUNT(*) FROM languages WHERE paradigm = 'functional';")
if [[ "$functional" -ne 2 ]]; then
  echo "함수형 언어 수가 예상과 다릅니다: ${functional}" >&2
  exit 1
fi

pypy=$(sqlite3 -batch "$db" "SELECT COUNT(*) FROM implementations AS i LEFT JOIN releases AS r ON r.implementation_id = i.id WHERE i.name = 'PyPy' AND r.version IS NULL;")
if [[ "$pypy" -ne 1 ]]; then
  echo "PyPy의 빈 릴리스를 확인하지 못했습니다: ${pypy}" >&2
  exit 1
fi

# 보통의 INSERT는 CHECK에 걸리고 셸이 실패합니다. queries.sql은 그 뒤에 ROLLBACK이
# 이어져야 하므로 OR IGNORE를 쓰고, 여기서는 제약이 실제로 오류를 내는지 확인합니다.
set +e
sqlite3 -batch "$db" "PRAGMA foreign_keys = ON; INSERT INTO releases (implementation_id, version, released_on) VALUES (1, '0.0.1-probe', '1800-01-01');" >"$err" 2>&1
status=$?
set -e
if [[ "$status" -eq 0 ]]; then
  echo "잘못된 연도가 저장되었습니다." >&2
  exit 1
fi
if ! grep -q "CHECK constraint failed: release_year" "$err"; then
  echo "예상한 release_year 오류가 아닙니다." >&2
  cat "$err" >&2
  exit 1
fi

probe=$(sqlite3 -batch "$db" "SELECT COUNT(*) FROM releases WHERE version = '0.0.1-probe';")
if [[ "$probe" -ne 0 ]]; then
  echo "거절된 릴리스가 남아 있습니다." >&2
  exit 1
fi

echo "sql ok"
```

저장소 루트에서 실행합니다.

```bash
bash examples/sql/run.sh
```

## 연습

1. `first_year >= 2010`인 언어 이름을 `queries.sql`의 첫 조회로 확인합니다. 시드와 맞추면 Rust, Dart, Elixir, Kotlin, TypeScript, Zig입니다.
2. PyPy가 세 표 조인에는 없고 `IS NULL` 조회에는 있는 이유를 `schema.sql`의 `INSERT`에서 찾습니다. PyPy는 `implementations`에만 있습니다.
3. `1800-01-01`이 저장되지 않는 경로를 두 곳에서 확인합니다. 제약은 `schema.sql`의 `release_year`이고, 초안까지 지우는 문장은 `queries.sql`의 `ROLLBACK`입니다. 오류 문자열 확인은 `run.sh`에 있습니다.

## 스스로 확인

1. `WHERE version = NULL`은 없는 릴리스를 찾는가?
   답: 찾지 못합니다. 그 비교는 참이 아닙니다. `IS NULL`을 씁니다.

2. 세 표의 안쪽 조인 결과에 PyPy가 없는 이유는 무엇인가?
   답: 릴리스 행이 없어 조인 상대가 없기 때문입니다. `LEFT JOIN`이면 버전 자리가 NULL인 행으로 남습니다.

3. `ROW_NUMBER()`의 번호는 무엇을 기준으로 다시 1이 되는가?
   답: `implementation_id` 파티션입니다. 파티션 안에서는 날짜와 버전 순입니다.

4. `INSERT OR IGNORE`가 하는 일과 `ROLLBACK`이 하는 일은 어떻게 다른가?
   답: `OR IGNORE`는 제약이 거절한 그 행만 건너뛰게 합니다. `ROLLBACK`은 같은 트랜잭션에 들어 있던 초안까지 취소합니다.

5. 외래 키 인덱스는 선언만으로 생기는가?
   답: 생기지 않습니다. 예제는 `language_id`와 `implementation_id`에 `CREATE INDEX`를 따로 둡니다. 외래 키 검사 자체는 `PRAGMA foreign_keys = ON`이 있어야 동작합니다.
