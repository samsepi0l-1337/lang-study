#!/usr/bin/env bash
# 임시 디렉터리 안에서만 저장소를 만든다.
# 현재 작업 트리의 Git 저장소와 전역 설정은 바꾸지 않으며, GitHub로 push하지 않는다.
set -euo pipefail

unset GIT_DIR
unset GIT_WORK_TREE
unset GIT_INDEX_FILE
unset GIT_NAMESPACE

tmpdir=$(mktemp -d)
print_temp() {
  echo "temp repo: ${tmpdir}"
}
trap print_temp EXIT

cd "${tmpdir}"
export GIT_TERMINAL_PROMPT=0

git init -b main
git config --local user.name "samsepi0l"
git config --local user.email "samsepi0l@example.com"
git config --local commit.gpgsign false
mkdir -p "${tmpdir}/hooks"
git config --local core.hooksPath "${tmpdir}/hooks"

cat > languages.md <<'EOF'
# 언어 메모

이 파일은 임시 저장소 안에서만 바뀝니다.

## 현재 목록

- Python
- JavaScript
- Go

다음 언어: 없음
EOF

git add languages.md
git commit -m "언어 메모를 추가한다"

git switch -c add-rust

cat > languages.md <<'EOF'
# 언어 메모

이 파일은 임시 저장소 안에서만 바뀝니다.

## 현재 목록

- Python
- JavaScript
- Go
- Rust

다음 언어: Rust
EOF

git add languages.md
git commit -m "Rust를 목록에 추가한다"

git switch main

cat > languages.md <<'EOF'
# 언어 메모

이 파일은 임시 저장소 안에서만 바뀝니다.

## 현재 목록

- Python
- JavaScript
- Go
- TypeScript

다음 언어: TypeScript
EOF

git add languages.md
git commit -m "TypeScript를 목록에 추가한다"

set +e
git merge --no-ff --no-edit add-rust
merge_status=$?
set -e

if [[ "${merge_status}" -eq 0 ]]; then
  echo "충돌이 발생하지 않았습니다." >&2
  exit 1
fi

if ! grep -q '^<<<<<<<' languages.md; then
  echo "충돌 표시를 찾지 못했습니다." >&2
  exit 1
fi

echo "----- conflict -----"
cat languages.md
echo "----- end -----"

cat > languages.md <<'EOF'
# 언어 메모

이 파일은 임시 저장소 안에서만 바뀝니다.

## 현재 목록

- Python
- JavaScript
- Go
- Rust
- TypeScript

다음 언어: Rust, TypeScript
EOF

git add languages.md
git commit -m "Rust와 TypeScript를 함께 남긴다"

echo "----- local user -----"
git config --local --get user.name
git config --local --get user.email
echo "----- log -----"
git log --oneline --graph --decorate --all
echo "----- status -----"
git status --short
