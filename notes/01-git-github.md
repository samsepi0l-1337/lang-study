---
title: "Git과 GitHub"
slug: git-github
order: 1
level: "초급"
minutes: 40
tags: [Git, GitHub]
summary: "임시 저장소에서 커밋과 충돌 병합을 따라 하고 원격과 풀 리퀘스트는 개념으로 구분합니다."
---

# Git과 GitHub

Git은 파일 스냅샷의 이력을 만드는 버전 관리 도구이고, GitHub는 그 저장소를 올려 두는 호스팅 서비스입니다. 둘은 같이 쓰이는 일이 많지만 같은 프로그램이 아닙니다. 이 장은 지금 공부 중인 저장소를 건드리지 않고, 임시 디렉터리에서 브랜치를 나눈 뒤 같은 영역을 서로 다르게 고쳐 충돌을 해결합니다. 작성자는 samsepi0l입니다.

## 이 장을 끝내면

- 작업 트리, 인덱스, 커밋이 각각 무엇을 기억하는지 구분합니다.
- 브랜치에서 같은 영역을 고치면 왜 병합 충돌이 나는지 설명하고, 표시를 지운 뒤 커밋합니다.
- 원격 저장소와 풀 리퀘스트가 로컬 커밋과 어떻게 다른지 말하고, 예제 스크립트는 push하지 않는다는 점을 확인합니다.

## 작업 트리

작업 트리(working tree)는 지금 디스크에서 보이는 파일입니다. 에디터로 `languages.md`를 고치면 그 변경은 작업 트리에만 있습니다. Git은 그 순간 아직 이력을 만들지 않습니다. 저장하지 않은 편집은 물론이고, 디스크에 저장한 파일도 커밋 전에는 이력에 남지 않습니다.

상태를 볼 때는 그 저장소 안에서 다음을 실행합니다.

```bash
git status --short
```

출력이 비어 있으면 작업 트리와 인덱스가 마지막 커밋과 같습니다. 파일이 수정되면 경로 앞에 상태 문자가 붙습니다.

실수: 파일을 고친 것만으로 백업이 되었다고 생각하는 일입니다. 작업 트리의 수정은 그 디렉터리를 지우면 함께 사라집니다. 예제 스크립트는 임시 디렉터리 경로를 마지막에 인쇄합니다. 이번 연습의 저장소는 그 경로뿐입니다.

## 인덱스

인덱스(index)는 다음 커밋에 넣을 스냅샷을 모아 두는 곳입니다. 스테이지라고도 부릅니다. `git add`는 작업 트리의 현재 내용을 인덱스로 복사합니다.

```bash
git add languages.md
```

규칙은 커밋이 작업 트리를 통째로 찍는 것이 아니라, 인덱스에 올라간 내용을 찍는다는 점입니다. add한 뒤에 파일을 다시 고치면 작업 트리만 새 내용이고, 인덱스에는 이전 내용이 남습니다. 그 상태로 커밋하면 방금 고친 문장은 이력에 들어가지 않습니다.

실수: 충돌을 에디터에서 지우고 `git add` 없이 커밋하는 일입니다. 병합 중에는 해결 결과도 인덱스에 올려야 다음 커밋이 그 결과를 담습니다. 예제는 해결본을 쓴 뒤 다시 `git add languages.md`를 실행합니다.

## 커밋

커밋(commit)은 인덱스의 스냅샷, 부모 커밋, 작성자, 메시지가 묶인 객체입니다. diff의 더미가 아니라 그때의 파일 전체입니다. 부모를 따라가면 이전 스냅샷과 비교할 수 있습니다.

예제는 임시 저장소 안에서만 작성자를 지정합니다.

```bash
git config --local user.name "samsepi0l"
git config --local user.email "samsepi0l@example.com"
```

`--local`은 그 저장소의 `.git/config`만 바꿉니다. `--global`은 계정 전체의 설정을 바꾸므로 이 연습에서 쓰지 않습니다. 스크립트는 서명 설정 `commit.gpgsign`도 이 저장소에서만 끄고, 훅 디렉터리도 임시 경로로만 지정합니다. 전역 설정 파일은 수정하지 않습니다. `GIT_DIR` 같은 환경 변수도 스크립트 프로세스 안에서만 해제하므로, 호출한 셸의 환경은 바뀌지 않습니다. 해제하는 이유는 그런 변수가 다른 저장소를 가리킨 채면 `git init`이 엉뚱한 곳을 건드릴 수 있기 때문입니다.

첫 커밋 메시지는 `언어 메모를 추가한다`입니다. 메시지는 그 스냅샷이 무엇을 바꾸었는지 한 줄로 적습니다.

실수: 저장소를 착각하고 커밋하는 일입니다. 스크립트는 `mktemp -d`로 빈 디렉터리를 만들고 그 안으로 이동한 뒤에만 `git init -b main`을 실행합니다. 브랜치 이름을 `main`으로 고정하므로, 계정마다 다른 기본 브랜치 이름에 기대지 않습니다.

## 브랜치

브랜치(branch)는 커밋 하나를 가리키는 가벼운 이름입니다. 폴더를 복사한 것이 아닙니다. `main`이 최신 커밋을 가리킬 때 다음 명령은 같은 커밋을 가리키는 `add-rust`를 만들고 그 이름으로 이동합니다.

```bash
git switch -c add-rust
```

이후의 커밋은 `add-rust`만 앞으로 옮깁니다. `main`은 갈라진 자리의 커밋을 그대로 가리킵니다. TypeScript 쪽 수정을 `main`에 넣으려고 스크립트는 다시 돌아옵니다.

```bash
git switch main
```

규칙은 체크아웃이 작업 트리를 그 브랜치가 가리키는 스냅샷으로 바꾼다는 점입니다. 브랜치를 바꾸면 `languages.md`의 내용도 그 커밋의 내용으로 바뀝니다. 저장하지 않은 수정이 있으면 전환이 거절될 수 있습니다. 예제는 바꾸기 전에 항상 커밋하므로 전환이 막히지 않습니다.

실수: 브랜치를 만들기 전에 `main`에 실험 커밋을 올리는 일입니다. 예제는 Rust 추가를 `add-rust`에만 두고, TypeScript 추가는 `main`에 둡니다. 이 순서가 바뀌면 충돌을 만드는 두 부모가 달라집니다.

## 병합과 충돌

병합(merge)은 갈라진 두 커밋을 한 이력으로 잇는 일입니다. 서로 다른 줄을 고쳤다면 Git이 양쪽을 한 파일에 넣을 수 있습니다. 같은 줄을 다르게 고치면 어느 쪽이 맞는지 알 수 없어 충돌이 납니다.

예제는 목록의 끝과 `다음 언어:` 줄을 양쪽에서 바꿉니다. `add-rust`는 Rust를 넣고, `main`은 TypeScript를 넣습니다. 공통 부모는 둘 다 `없음`이던 첫 커밋입니다.

```bash
git merge --no-ff --no-edit add-rust
```

이 명령은 충돌이 나면 0이 아닌 상태로 끝납니다. 스크립트는 `set -e` 때문에 그 실패로 바로 죽지 않도록 병합 직전에만 `set +e`를 하고, 상태 코드를 확인한 뒤 다시 `set -e`로 돌아옵니다. 충돌이 없는데 병합이 성공하면 연습이 잘못된 것이므로 스크립트가 중단됩니다.

충돌이 난 파일에는 Git이 이런 표시를 넣습니다. 아래는 한 번 실행했을 때 `----- conflict -----`와 `----- end -----` 사이에 나온 영역입니다.

```text
<<<<<<< HEAD
- TypeScript

다음 언어: TypeScript
=======
- Rust

다음 언어: Rust
>>>>>>> add-rust
```

`<<<<<<<`와 `=======` 사이는 현재 브랜치인 `main`(HEAD)입니다. `=======`와 `>>>>>>> add-rust` 사이는 들여오는 쪽입니다. 이 줄들은 언어 목록이 아니라, 결정을 미루며 넣어 둔 표식입니다.

해결은 원하는 최종 본문을 파일에 다시 쓰고 표식을 모두 지운 다음, add하고 커밋하는 일입니다. 예제는 Rust와 TypeScript를 둘 다 남깁니다. 표식이 파일에 없으면 스크립트는 병합을 진행하지 않습니다. 해결 커밋은 부모가 둘인 병합 커밋입니다. `git log --oneline --graph --decorate --all`을 보면 `main`의 TypeScript 커밋과 `add-rust`의 Rust 커밋이 한 커밋 아래에서 만납니다. 커밋 해시는 실행할 때마다 달라지므로 해시 값은 외울 필요가 없습니다.

실수: `<<<<<<<`를 본문으로 착각하고 커밋하는 일입니다. 그러면 나중에 파일을 읽는 프로그램이 그 표식에서 깨집니다. 해결본 HEREDOC에는 표식이 없습니다.

## 원격 저장소

원격 저장소(remote)는 로컬 `.git`과 따로 둔 다른 Git 저장소의 주소입니다. GitHub에 만든 빈 저장소가 흔한 원격입니다. 연결은 로컬 저장소에서 이렇게 적습니다.

```bash
git remote add origin git@github.com:OWNER/language-notes.git
```

`origin`은 원격의 별명입니다. 이어서 올리는 명령은 `git push -u origin add-rust`입니다. 두 명령 모두 `walkthrough.sh`에 없습니다. 스크립트는 네트워크로 커밋을 보내지 않습니다. 위 명령은 원격 저장소가 실제로 있을 때 사람이 직접 쓰는 형태일 뿐입니다.

`git fetch`는 원격의 커밋을 가져와 원격 추적 브랜치에 둡니다. 현재 브랜치의 파일을 바로 바꾸지는 않습니다. `git pull`은 fetch 뒤에 현재 브랜치로 병합까지 합니다. 같은 줄을 양쪽에서 고쳤다면 pull 도중에도 앞에서 본 충돌이 납니다.

실수: 충돌이 귀찮다고 `git push --force`로 원격 이력을 덮어쓰는 일입니다. 다른 사람이 이미 가져온 커밋이 원격에서 사라집니다. 이 장의 스크립트는 임시 디렉터리에서 끝나고 강제 push를 하지 않습니다.

## 풀 리퀘스트

풀 리퀘스트(pull request)는 Git 객체가 아닙니다. GitHub가 붙이는 검토 요청입니다. 브랜치를 원격에 올린 뒤, 그 브랜치를 다른 브랜치에 병합해 달라고 제안하고 설명을 붙입니다. 제안이 병합되기 전에는 원격의 `main`이 바뀌지 않습니다.

아래는 개념을 보여 주는 명령입니다. `examples/git-github/walkthrough.sh`는 이 명령을 실행하지 않습니다.

```bash
# 이 명령은 walkthrough.sh가 실행하지 않습니다.
gh pr create --base main --head add-rust --title "Rust를 목록에 추가" --body "main의 TypeScript 항목과 함께 남깁니다."
```

`gh`는 GitHub의 명령줄 도구입니다. `--base`는 받아 주는 브랜치이고 `--head`는 제안하는 브랜치입니다. 스크립트가 만든 임시 저장소에는 원격이 없으므로, 이 명령을 그 디렉터리에서 그대로 실행하면 실패하는 것이 맞습니다.

실수: 풀 리퀘스트를 열었다는 이유로 로컬 병합이 끝났다고 생각하는 일입니다. 풀 리퀘스트는 검토 화면이고, 병합 커밋은 그 제안을 받아들인 뒤에야 생깁니다. 이 장이 직접 연습하는 병합은 로컬의 `git merge`입니다.

## 예제

`examples/git-github/walkthrough.sh`

```bash
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
```

저장소 루트에서 다음을 실행합니다. 실행할 때마다 `mktemp -d`로 디렉터리를 새로 만들므로 두 번 실행해도 안전합니다. 이전 임시 저장소를 지우지도 않고, 현재 공부 저장소를 수정하지도 않습니다. 확인이 끝나면 인쇄된 경로는 직접 삭제하면 됩니다.

```bash
bash examples/git-github/walkthrough.sh
```

`set -euo pipefail`은 실패한 명령과 정의되지 않은 변수를 숨기지 않기 위한 설정입니다. 스크립트에는 파이프가 없지만, 중간에 실패가 생겨도 넘어가지 않게 두었습니다. 예외는 충돌을 기대하는 `git merge` 한 곳입니다. 파일 내용은 `'EOF'`로 인용한 HEREDOC이라 셸이 `$`나 역따옴표를 확장하지 않습니다. 마지막 줄은 `temp repo:`와 임시 경로입니다. 실패해도 그 줄은 인쇄됩니다.

## 연습

1. 스크립트를 두 번 실행하고 마지막 줄의 경로가 서로 다른지 확인합니다. 정답의 근거는 스크립트의 `mktemp -d`입니다.
2. 끝난 임시 저장소에서 `git switch add-rust`와 `git switch main`을 오가며 `다음 언어:` 줄을 비교합니다. `add-rust`의 HEREDOC은 `Rust`이고, 해결 뒤의 `main` HEREDOC은 `Rust, TypeScript`입니다.
3. 스크립트에서 `git config`가 모두 `--local`인지, `git push`와 `gh`가 없는지 찾습니다. 원격으로 보내는 예시는 스크립트가 아니라 이 장의 풀 리퀘스트 절에만 있습니다.

## 스스로 확인

1. 작업 트리에 저장한 수정은 그 자체로 커밋인가?
   답: 아닙니다. 인덱스에 올린 스냅샷만 커밋에 들어갑니다.

2. `git config --local`은 무엇을 바꾸는가?
   답: 그 저장소의 `.git/config`만 바꿉니다. 계정 전체 설정은 `--global`이며 예제는 그것을 쓰지 않습니다.

3. 충돌 표시를 지우지 않고 커밋하면 어떻게 되는가?
   답: `<<<<<<<` 같은 표식까지 스냅샷에 남습니다. 해결 커밋의 본문에는 표식이 없어야 합니다.

4. 예제 스크립트가 GitHub에 브랜치를 올리는가?
   답: 올리지 않습니다. 임시 디렉터리에서 로컬 병합만 하고 경로를 인쇄합니다.

5. 풀 리퀘스트는 Git의 어떤 객체인가?
   답: Git 객체가 아닙니다. 원격 브랜치를 다른 브랜치에 합쳐 달라고 요청하는 GitHub의 검토 절차입니다.
