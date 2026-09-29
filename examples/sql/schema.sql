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
