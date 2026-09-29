import { access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const required = [
  "examples/git-github/walkthrough.sh",
  "examples/sql/run.sh",
  "examples/sql/schema.sql",
  "examples/sql/queries.sql",
  "examples/python-collector/collect.py",
  "examples/gulp/pipeline.mjs",
  "examples/chrome-extension/manifest.json",
  "examples/canvas-sketch/index.html",
  "examples/react-dictionary/index.html",
  "examples/react-hooks/index.html",
  "examples/redux/store.test.js",
  "examples/graphql-server/server.test.js",
  "examples/graphql-client/client.test.js",
  "examples/nestjs/mini-di.test.mjs",
  "examples/go/languages_test.go",
  "examples/workshop-booking/booking.test.js",
  "examples/snippet-feed/feed.test.js",
  "examples/react-native/model.test.js",
  "examples/webrtc-room/signaling.test.js",
  "examples/ts-chain/chain.test.ts",
  "examples/llm-tutor/tutor.test.js",
  "examples/ai-agents/agent.py",
  "examples/n8n/validate.mjs",
  "examples/supabase-starter/schema.sql",
  "examples/maker/index.html",
];

let missing = 0;
for (const file of required) {
  try {
    await access(path.join(root, file));
  } catch {
    console.error("missing", file);
    missing += 1;
  }
}
if (missing) {
  console.error(`${missing} required example files are missing`);
  process.exit(1);
}
console.log(`found ${required.length} required example entry points`);
