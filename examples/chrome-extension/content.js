"use strict";

const PATTERN = /\b(?:TypeScript|JavaScript|Python|Kotlin|Haskell|Elixir|Rust|Dart|Zig|Go)\b/g;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT"]);

function accepted(node) {
  const parent = node.parentElement;
  if (!parent || SKIP.has(parent.tagName) || parent.closest("mark.lang-hit")) {
    return NodeFilter.FILTER_REJECT;
  }
  PATTERN.lastIndex = 0;
  return PATTERN.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
}

function replaceText(node) {
  const text = node.nodeValue;
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  PATTERN.lastIndex = 0;
  for (let match = PATTERN.exec(text); match; match = PATTERN.exec(text)) {
    if (match.index > cursor) {
      fragment.append(document.createTextNode(text.slice(cursor, match.index)));
    }
    const mark = document.createElement("mark");
    mark.className = "lang-hit";
    mark.textContent = match[0];
    fragment.append(mark);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)));
  node.parentNode.replaceChild(fragment, node);
}

if (document.documentElement.dataset.lotdDemo === "1") {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: accepted
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(replaceText);
}
