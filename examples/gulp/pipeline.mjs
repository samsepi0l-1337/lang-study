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
