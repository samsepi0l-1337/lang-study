import { mkdir, readdir, readFile, writeFile, cp, rm } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

const root = path.resolve(import.meta.dirname, "..");
const notesDir = path.join(root, "notes");
const docsDir = path.join(root, "docs");

const groups = [
  [1, 4, "기초"],
  [5, 8, "브라우저와 React"],
  [9, 12, "상태와 GraphQL"],
  [13, 16, "서버"],
  [17, 21, "모바일과 연결"],
  [22, 26, "에이전트와 제품"],
];

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("missing front matter");
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((part) => part.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  data.order = Number(data.order);
  data.minutes = Number(data.minutes || 0);
  return { data, body: match[2] };
}

function layout({ title, description, current, body, depth }) {
  const prefix = depth === 0 ? "" : "../";
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${prefix}assets/site.css">
</head>
<body>
  <a class="skip" href="#content">본문으로</a>
  <div class="shell">
    <aside class="nav">
      <a class="brand" href="${prefix}index.html"><strong>언어 공부장</strong><span>samsepi0l</span></a>
      <input class="search" data-filter placeholder="노트 찾기" aria-label="노트 찾기">
      <details class="toc" open>
        <summary>목차</summary>
        ${renderNav(current, prefix)}
      </details>
    </aside>
    <main class="main" id="content">${body}</main>
  </div>
  <script src="${prefix}assets/site.js"></script>
</body>
</html>`;
}

function renderNav(current, prefix) {
  const chunks = [];
  for (const [start, end, label] of groups) {
    const items = chapters.filter((chapter) => chapter.order >= start && chapter.order <= end);
    if (!items.length) continue;
    chunks.push(`<div class="group">${label}</div><ol>`);
    for (const chapter of items) {
      const currentAttr = chapter.slug === current ? ' aria-current="page"' : "";
      chunks.push(
        `<li data-item="${escapeHtml(searchText(chapter))}"><a href="${prefix}notes/${chapter.slug}.html"${currentAttr}><small>${String(chapter.order).padStart(2, "0")}</small><span>${escapeHtml(chapter.title)}</span></a></li>`,
      );
    }
    chunks.push("</ol>");
  }
  return chunks.join("");
}

const languageNames = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Go",
  "Rust",
  "Kotlin",
  "Elixir",
  "Zig",
  "Dart",
  "Haskell",
  "SQL",
  "GraphQL",
  "React",
  "Next.js",
  "Flutter",
];

function searchText(chapter) {
  const mentioned = languageNames.filter((name) => chapter.body.includes(name));
  return `${chapter.order} ${chapter.title} ${chapter.summary} ${(chapter.tags || []).join(" ")} ${mentioned.join(" ")}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const files = (await readdir(notesDir)).filter((name) => name.endsWith(".md")).sort();
const chapters = [];
for (const file of files) {
  const raw = await readFile(path.join(notesDir, file), "utf8");
  const { data, body } = parseFrontMatter(raw);
  if (!data.slug || !data.title || !data.order) {
    throw new Error(`incomplete front matter in ${file}`);
  }
  chapters.push({ ...data, body, file });
}
chapters.sort((a, b) => a.order - b.order);

marked.setOptions({ gfm: true, headerIds: false, mangle: false });

await rm(docsDir, { recursive: true, force: true });
await mkdir(path.join(docsDir, "notes"), { recursive: true });
await cp(path.join(root, "assets"), path.join(docsDir, "assets"), { recursive: true });

const cards = groups
  .map(([start, end, label]) => {
    const items = chapters.filter((chapter) => chapter.order >= start && chapter.order <= end);
    if (!items.length) return "";
    const body = items
      .map(
        (chapter) => `<a class="card" href="notes/${chapter.slug}.html" data-item="${escapeHtml(searchText(chapter))}">
      <div class="meta"><span class="pill">${String(chapter.order).padStart(2, "0")}</span><span class="pill">${escapeHtml(chapter.level || "")}</span><span class="pill">${chapter.minutes || "?"}분</span></div>
      <h2>${escapeHtml(chapter.title)}</h2>
      <p>${escapeHtml(chapter.summary || "")}</p>
    </a>`,
      )
      .join("\n");
    return `<h2 class="group-title">${label}</h2><div class="cards">${body}</div>`;
  })
  .join("\n");

const home = layout({
  title: "언어 공부장",
  description: "samsepi0l이 프로그래밍 언어를 소재로 정리한 실습 노트",
  current: "",
  depth: 0,
  body: `<article class="sheet hero">
    <h1>언어 공부장</h1>
    <p class="lede">samsepi0l이 프로그래밍 언어를 소재로 정리한 실습 노트입니다. 각 장은 개념 설명, 직접 실행하는 예제, 연습으로 구성되어 있습니다.</p>
    ${cards}
    <footer class="colophon">예제 코드는 <code>examples/</code> 디렉터리에 있습니다. 이 저장소의 글과 코드는 공부용으로 새로 작성한 자료입니다.</footer>
  </article>`,
});
await writeFile(path.join(docsDir, "index.html"), home);

for (let index = 0; index < chapters.length; index += 1) {
  const chapter = chapters[index];
  const html = marked.parse(chapter.body);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  const pager = `<nav class="pager">
    ${previous ? `<a href="${previous.slug}.html"><span>이전</span>${escapeHtml(previous.title)}</a>` : "<span></span>"}
    ${next ? `<a href="${next.slug}.html"><span>다음</span>${escapeHtml(next.title)}</a>` : "<span></span>"}
  </nav>`;
  const tags = (chapter.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("");
  const page = layout({
    title: `${chapter.title} · 언어 공부장`,
    description: chapter.summary || chapter.title,
    current: chapter.slug,
    depth: 1,
    body: `<article class="sheet">
      <div class="meta"><span class="pill">${escapeHtml(chapter.level || "")}</span><span class="pill">${chapter.minutes || "?"}분</span>${tags}</div>
      ${html}
      ${pager}
      <footer class="colophon">samsepi0l · 언어 공부장</footer>
    </article>`,
  });
  await writeFile(path.join(docsDir, "notes", `${chapter.slug}.html`), page);
}

const readme = `# 언어 공부장

samsepi0l이 프로그래밍 언어를 소재로 정리한 실습 노트입니다. 개념 설명, 실행 예제, 연습이 한 장에 있습니다.

읽는 곳: [GitHub Pages](https://samsepi0l-1337.github.io/lang-study/)

| # | 장 | 예제 |
| ---: | --- | --- |
${chapters
  .map(
    (chapter) =>
      `| ${chapter.order} | [${chapter.title}](notes/${chapter.file}) | [\`examples/${chapter.slug}\`](examples/${chapter.slug}) |`,
  )
  .join("\n")}

\`\`\`bash
npm install
npm run build
python3 -m http.server -d docs 4173
\`\`\`
`;
await writeFile(path.join(root, "README.md"), readme);
await writeFile(
  path.join(docsDir, ".nojekyll"),
  "",
);
console.log(`built ${chapters.length} chapters`);
