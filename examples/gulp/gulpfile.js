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
