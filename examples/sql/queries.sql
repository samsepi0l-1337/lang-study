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
