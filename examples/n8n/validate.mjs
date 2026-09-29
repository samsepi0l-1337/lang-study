import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const file = join(dir, "language-card.workflow.json");
const workflow = JSON.parse(readFileSync(file, "utf8"));

if (!Array.isArray(workflow.nodes)) {
  throw new Error("nodes 배열이 없습니다.");
}

const webhook = workflow.nodes.find(
  (node) => node.type === "n8n-nodes-base.webhook",
);
const setNode = workflow.nodes.find((node) => node.type === "n8n-nodes-base.set");

if (!webhook) {
  throw new Error("Webhook 노드가 없습니다.");
}
if (!setNode) {
  throw new Error("Set 노드가 없습니다.");
}

const groups = workflow.connections?.[webhook.name]?.main;
const linked = Array.isArray(groups)
  && groups.some(
    (group) => Array.isArray(group)
      && group.some((edge) => edge?.node === setNode.name && edge?.type === "main"),
  );

if (!linked) {
  throw new Error("Webhook에서 Set으로 이어진 연결이 없습니다.");
}

const fields = JSON.stringify(setNode.parameters ?? {});
if (!fields.includes("title") || !fields.includes("summary")) {
  throw new Error("Set 노드가 title과 summary를 만들지 않습니다.");
}

console.log("ok");
