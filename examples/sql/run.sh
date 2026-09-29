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
