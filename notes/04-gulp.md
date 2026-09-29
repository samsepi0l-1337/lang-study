---
title: "Gulp로 문서 파이프라인 만들기"
slug: gulp
order: 4
level: "초급"
minutes: 40
tags: [Gulp, Node.js]
summary: "Gulp의 스트림 태스크와 같은 HTML 변환을 Node 표준 모듈만으로도 확인합니다."
---

# Gulp로 문서 파이프라인 만들기

문서 파이프라인은 입력 파일을 읽어 같은 규칙으로 바꾸고 다른 디렉터리에 쓰는 경로입니다. 이 장은 `examples/gulp/src`의 마크다운 노트를 작은 HTML 문서로 감쌉니다. 본문을 제목과 단락으로 해석하지는 않습니다. 첫 제목을 고르고, 본문의 특수문자를 이스케이프한 뒤 `<pre>`에 넣습니다. 복사가 아니라 내용이 바뀌는 변환입니다. `gulpfile.js`와 `pipeline.mjs`가 둘 다 있습니다. `pipeline.mjs`는 같은 파이프라인 생각을 의존성 없이 살펴보려고 둔 짝입니다. 작성자는 samsepi0l입니다.

## 이 장을 끝내면

- Vinyl 파일, `src`, `dest`가 디스크의 파일과 어떻게 다른지 설명합니다.
- `series`, `parallel`, `watch`가 태스크를 어떤 순서로 부르는지 코드에서 가리킵니다.
- `pipeline.mjs`만으로 HTML을 만들고, Gulp를 설치했을 때 같은 HTML이 나오는지 비교합니다.

## Vinyl 파일

Vinyl은 Gulp 스트림이 다루는 가상 파일입니다. 경로와 내용 버퍼, 그리고 기준 디렉터리 같은 정보를 한 객체에 담습니다. 스트림에 올라온 순간에는 아직 출력 파일이 아닙니다. 변환이 `contents`와 확장자를 바꾼 뒤에야 쓸 내용이 정해집니다.

Gulp의 `src`는 글자 조각이 아니라 Vinyl 객체를 흘려보냅니다. Node의 `Transform`은 그때 `objectMode`가 켜져 있어야 합니다. 꺼져 있으면 스트림은 객체가 아니라 바이트를 기대합니다. 예제의 `wrapMarkdown`은 그래서 `objectMode: true`로 만듭니다. 내용이 스트림이면 오류를 알리고, 버퍼가 아니면 바꾸지 않고 다음으로 넘깁니다.

실수: 태스크 함수 안에서 `src().pipe(dest())`를 호출만 하고 반환하지 않는 일입니다. Gulp는 반환된 스트림이 끝나야 그 태스크가 끝났다고 봅니다. 반환하지 않으면 쓰기가 끝나기 전에 다음 태스크로 넘어갈 수 있습니다. `documents`는 파이프의 결과를 `return`합니다.

## src와 dest

`src`는 읽기 끝입니다. 패턴에 맞는 파일마다 Vinyl을 하나 만듭니다. `dest`는 쓰기 끝입니다. Vinyl의 경로에서 기준 디렉터리를 뺀 상대 경로로 파일을 놓습니다. 예제는 확장자를 `.html`로 바꾼 뒤 `dist`에 씁니다. `python.md`는 `dist/python.html`이 됩니다.

패턴과 출력 디렉터리는 gulpfile이 있는 디렉터리로 계산합니다. 작업 디렉터리에 의존하지 않으려고 파일의 절대 경로로 글로브를 만듭니다.

```javascript
const SRC = path.join(srcDir, "*.md");
```

`pipeline.mjs`에는 `src`와 `dest`라는 함수가 없습니다. 같은 일을 `node:fs`의 `readdir`, `readFile`, `writeFile`로 합니다. 읽는 디렉터리와 쓰는 디렉터리는 `import.meta.url`에서 자기 파일 위치를 구해 정합니다. `node:url` 모듈은 import하지 않습니다. import는 `node:fs`와 `node:path`뿐입니다. 그래서 Gulp를 설치하지 않아도 변환을 실행할 수 있습니다.

실수: 상대 경로 `src/*.md`만 적어 두고 다른 디렉터리에서 실행하는 일입니다. 그때의 현재 디렉터리에 `src`가 없으면 입력을 찾지 못합니다. 두 파일 모두 자기 위치를 기준으로 경로를 잡습니다.

## 감싸기 변환

변환 규칙은 `pipeline.mjs`의 함수 두 개입니다. `titleOf`는 `# `로 시작하는 첫 줄에서 제목을 가져옵니다. 그런 줄이 없으면 파일 이름을 씁니다. `renderDocument`는 제목과 본문을 이스케이프한 뒤 HTML 껍데기에 넣습니다. gulpfile은 이 함수를 import하므로, 마크다운에서 HTML로 가는 규칙은 한곳에만 있습니다.

이스케이프 순서는 `&`, `<`, `>`, `"`입니다. `&`를 나중에 바꾸면 방금 만든 `&lt;`의 `&`까지 `&amp;lt;`가 됩니다. 본문은 마크다운으로 해석하지 않고 `<pre>` 안에 그대로 둡니다. 따라서 `src/python.md`의 `n < 0`은 결과에서 `n &lt; 0`이 되고, `src/rust.md`의 `&value`는 `&amp;value`가 됩니다. 제목은 파일 이름이 아니라 첫 제목이라 `<title>`과 `<h1>`은 `Python`, `JavaScript`, `Go`, `Rust`입니다. 출력 파일 이름은 여전히 원본의 파일 이름입니다.

이 입력은 언어 노트 네 개입니다. SQL 장과 수집기 장의 열 언어를 모두 담지는 않습니다. 파이프라인이 여러 파일에 같은 함수를 적용하는지만 보면 되기 때문입니다.

실수: 마크다운의 `#`이 HTML에서도 제목 태그로 바뀐다고 생각하는 일입니다. 예제는 첫 `# ` 줄의 글자만 제목으로 복제하고, 본문 쪽 `#`은 `<pre>` 안의 글자로 남습니다.

## series와 parallel

`series`는 앞 태스크가 끝나야 다음 태스크를 시작합니다. `parallel`은 여러 태스크를 같이 시작하고, 모두 끝나야 그 묶음이 끝납니다. 예제의 기본 태스크는 둘을 겹쳐 둡니다.

```javascript
export const build = series(ensureDist, parallel(documents, manifest));
export default build;
```

`ensureDist`는 `dist` 디렉터리를 만듭니다. 그 다음에 `documents`와 `manifest`가 동시에 달립니다. `documents`는 HTML을 쓰고, `manifest`는 HTML 파일 이름을 정렬해 `dist/manifest.txt`에 한 줄씩 씁니다. 서로 다른 경로를 쓰므로 같이 실행해도 한 파일을 두 태스크가 덮어쓰지 않습니다. 네 개의 입력이면 목록은 다음 순서입니다.

```text
go.html
javascript.html
python.html
rust.html
```

`build`와 `default`는 같은 함수입니다. `npx gulp`는 기본 태스크를 실행합니다. Gulp 4에서 태스크 이름은 내보낸 함수 이름입니다. 이 gulpfile은 ESM이라 `export function documents`처럼 적습니다.

실수: 같은 출력 경로를 쓰는 두 태스크를 `parallel`에 넣는 일입니다. 어느 쓰기가 나중에 끝나는지에 따라 결과가 달라집니다. 예제는 HTML과 목록 파일을 나눠 그 경쟁을 피합니다. 순서가 꼭 필요하면 `series`를 씁니다.

## watch

`watch`는 패턴의 파일이 바뀌면 지정한 태스크를 다시 실행합니다. 예제에서는 `src`의 마크다운이 바뀔 때 `documents`를 다시 부릅니다.

```javascript
export function watchDocuments() {
  watch(SRC, documents);
}
```

감시 대상에 `dist`를 넣지 않습니다. 출력이 바뀔 때마다 태스크가 다시 돌면 쓰기가 감시를 깨우는 순환이 됩니다. `watchDocuments`는 기본 태스크가 아닙니다. `npx gulp`만으로는 감시가 시작되지 않고, 한 번 빌드하고 프로세스가 끝납니다. 감시를 켜면 프로세스는 멈추기 전까지 남아 있습니다.

실수: 개발 중 편하다고 기본 태스크를 감시로 바꾸는 일입니다. 그러면 한 번 만들고 끝나야 하는 빌드가 끝나지 않습니다. 예제는 빌드와 감시를 다른 함수로 나눕니다.

## 의존성 없는 짝

`pipeline.mjs`는 Gulp 없이 같은 `titleOf`와 `renderDocument`로 `src/*.md`를 읽어 `dist/*.html`을 씁니다. 목록 파일은 만들지 않고, 파일을 감시하지도 않습니다. Gulp 쪽의 추가분은 태스크를 묶고 나열하고 감시하는 일이지 HTML 규칙이 아닙니다. 두 경로로 만든 같은 이름의 HTML은 바이트가 같습니다.

Gulp를 실행하려면 `examples/gulp`에서 의존성을 설치합니다. `package.json`은 이 디렉터리에만 있고, 저장소 루트의 패키지 파일이 아닙니다. `gulp`는 4.0.2입니다. 설치 도중 오래된 전달 의존성 경고가 나올 수 있습니다. 경고와 별도로 `npx gulp`가 기본 태스크를 끝내면 HTML과 `manifest.txt`가 생긴 것입니다. 변환만 확인할 때는 `node pipeline.mjs`로 충분합니다.

```bash
node examples/gulp/pipeline.mjs
```

```bash
cd examples/gulp
npm install
npx gulp
```

실수: `pipeline.mjs`가 `manifest.txt`까지 만든다고 생각하는 일입니다. 그 파일은 `manifest` 태스크만 씁니다. HTML 변환을 공부할 때는 짝인 `pipeline.mjs`를 보고, 태스크 구성은 `gulpfile.js`를 봅니다.

## 예제

`examples/gulp/package.json`

```json
{
  "name": "language-doc-pipeline",
  "private": true,
  "version": "1.0.0",
  "description": "언어 노트를 HTML 문서로 감싸는 문서 파이프라인",
  "type": "module",
  "scripts": {
    "build": "gulp",
    "pipeline": "node pipeline.mjs"
  },
  "dependencies": {
    "gulp": "4.0.2"
  }
}
```

`examples/gulp/pipeline.mjs`

```javascript
import { promises as fs, realpathSync } from "node:fs";
import path from "node:path";

const root = path.dirname(modulePath(import.meta.url));
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

export function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function titleOf(markdown, filename) {
  const fallback = path.basename(filename, ".md");
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("# ")) {
      const title = line.slice(2).trim();
      if (title) {
        return title;
      }
    }
  }
  return fallback;
}

export function renderDocument(title, markdown) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(markdown);
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
</head>
<body>
  <h1>${safeTitle}</h1>
  <pre>${safeBody}</pre>
</body>
</html>
`;
}

export async function build() {
  await fs.mkdir(distDir, { recursive: true });
  const names = (await fs.readdir(srcDir)).filter((name) => name.endsWith(".md")).sort();
  if (names.length === 0) {
    throw new Error("src에 마크다운 파일이 없습니다.");
  }
  for (const name of names) {
    const markdown = await fs.readFile(path.join(srcDir, name), "utf8");
    const html = renderDocument(titleOf(markdown, name), markdown);
    const outName = `${path.basename(name, ".md")}.html`;
    await fs.writeFile(path.join(distDir, outName), html, "utf8");
  }
  return names.length;
}

function modulePath(url) {
  if (!url.startsWith("file://")) {
    throw new Error("file URL만 지원합니다.");
  }
  return decodeURIComponent(url.slice("file://".length));
}

function normalizePath(file) {
  const resolved = path.resolve(file);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

function runningAsScript() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return normalizePath(modulePath(import.meta.url)) === normalizePath(entry);
}

if (runningAsScript()) {
  build()
    .then((count) => {
      console.log(`wrote ${count} html files to ${distDir}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
```

`examples/gulp/gulpfile.js`

```javascript
import gulp from "gulp";
import { Transform } from "node:stream";
import path from "node:path";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { renderDocument, titleOf } from "./pipeline.mjs";

const { src, dest, series, parallel, watch } = gulp;

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");
const SRC = path.join(srcDir, "*.md");

function wrapMarkdown() {
  return new Transform({
    objectMode: true,
    transform(file, _encoding, callback) {
      if (file.isStream()) {
        callback(new Error("스트림 파일은 이 예제에서 다루지 않습니다."));
        return;
      }
      if (!file.isBuffer()) {
        callback(null, file);
        return;
      }
      const markdown = file.contents.toString("utf8");
      const html = renderDocument(titleOf(markdown, file.path), markdown);
      file.contents = Buffer.from(html, "utf8");
      file.extname = ".html";
      callback(null, file);
    },
  });
}

export function ensureDist() {
  return mkdir(distDir, { recursive: true });
}

export function documents() {
  return src(SRC).pipe(wrapMarkdown()).pipe(dest(distDir));
}

export async function manifest() {
  const names = (await readdir(srcDir)).filter((name) => name.endsWith(".md")).sort();
  const body = names.map((name) => `${path.basename(name, ".md")}.html`).join("\n") + "\n";
  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "manifest.txt"), body, "utf8");
}

export function watchDocuments() {
  watch(SRC, documents);
}

export const build = series(ensureDist, parallel(documents, manifest));
export default build;
```

`examples/gulp/src/python.md`

```markdown
# Python

Python은 1991년에 공개된 언어입니다.
블록은 들여쓰기로 나타냅니다.
조건의 예: n < 0 이면 음수입니다.
```

`examples/gulp/src/javascript.md`

```markdown
# JavaScript

JavaScript는 1995년에 브라우저 안에서 처음 쓰였습니다.
함수도 값이므로 다른 함수에 넘길 수 있습니다.
첫 원소는 items[0]입니다.
```

`examples/gulp/src/go.md`

```markdown
# Go

Go는 2009년에 공개된 언어입니다.
에러는 반환 값으로 다루고, 고루틴으로 일을 나눕니다.
슬라이스의 한 칸은 s[i]입니다.
```

`examples/gulp/src/rust.md`

```markdown
# Rust

Rust는 2010년에 발표된 시스템 언어입니다.
소유권이 값의 수명을 컴파일할 때 검사합니다.
빌림은 &value처럼 씁니다.
```

## 연습

1. `node examples/gulp/pipeline.mjs`를 실행하고 `dist/python.html`에 `n &lt; 0`이 있는지 확인합니다. 원문은 `src/python.md`의 `n < 0`이고, 바꾸는 함수는 `escapeHtml`입니다.
2. `gulpfile.js`에서 `build`가 `ensureDist` 다음에 `parallel(documents, manifest)`를 부르는지 찾습니다. 기본 태스크는 그 `build`입니다.
3. `pipeline.mjs`의 import가 `node:fs`와 `node:path`뿐인지 확인합니다. `gulpfile.js`는 그 파일의 `renderDocument`와 `titleOf`를 가져다 HTML을 만듭니다.

## 스스로 확인

1. Vinyl 객체는 디스크의 출력 파일인가?
   답: 아닙니다. 경로와 내용을 담은 메모리의 파일이고, `dest`가 그 내용을 디스크에 씁니다.

2. `objectMode`를 켜는 이유는 무엇인가?
   답: 스트림의 조각이 바이트가 아니라 Vinyl 객체이기 때문입니다.

3. `series`와 `parallel`의 차이는 무엇인가?
   답: `series`는 앞 태스크가 끝난 뒤 다음을 시작합니다. `parallel`은 같이 시작하고 모두 끝나야 끝납니다.

4. 왜 감시 대상에 `dist`를 넣지 않는가?
   답: 출력이 바뀔 때마다 태스크가 다시 실행되는 순환을 피하기 위해서입니다. 예제는 `src`의 마크다운만 봅니다.

5. `pipeline.mjs`는 무엇을 위한 파일인가?
   답: Gulp 없이 같은 HTML 변환을 실행해 파이프라인의 변환 단계를 보기 위한 짝입니다. 목록 파일과 감시는 gulpfile에만 있습니다.
