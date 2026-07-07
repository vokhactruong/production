#!/usr/bin/env node
// AOS Runtime Startup Helper (PK-000)
//
// Read-only. Prints the AOS boot reading order and the current session state so a
// new Claude CLI session (or a human onboarding one) can orient in seconds.
// It changes nothing and reads no source code — it only reports what to read and
// whether the per-task state (.aos/current/) is populated.
//
// Usage:  pnpm aos:start     (or)     node scripts/aos-start.mjs

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const rel = (p) => join(root, p);

const READING_ORDER = [
  ["Runtime entry point", "AOS.md"],
  ["Boot sequence", ".aos/boot.md"],
  ["Your role — load only your section", "docs/AI/ORGANIZATION_STRUCTURE.md"],
  ["Current role", ".aos/current/role.md"],
  ["Current task", ".aos/current/task.md"],
  ["Current context", ".aos/current/context.md"],
  ["Active decisions", ".aos/current/decisions.md"],
  ["Current plan", ".aos/current/plan.md"],
];

const CURRENT = [
  ".aos/current/role.md",
  ".aos/current/task.md",
  ".aos/current/context.md",
  ".aos/current/decisions.md",
  ".aos/current/plan.md",
];

// A current/ file is still an empty scaffold if it contains the "(empty)" marker.
const isScaffold = (file) => {
  try {
    return readFileSync(rel(file), "utf8").includes("(empty)");
  } catch {
    return true;
  }
};

console.log("\n=== AOS Runtime Start (PK-000) ===\n");
console.log("Read these in order. Load only what each step needs — never the whole repo.\n");

let missing = false;
for (const [label, file] of READING_ORDER) {
  const ok = existsSync(rel(file));
  if (!ok) missing = true;
  console.log(`  [${ok ? "OK     " : "MISSING"}]  ${label}\n             -> ${file}`);
}

console.log("\nPer-task state (.aos/current/):");
let anyEmpty = false;
for (const f of CURRENT) {
  const empty = isScaffold(f);
  if (empty) anyEmpty = true;
  console.log(`  [${empty ? "EMPTY" : "SET  "}]  ${f}`);
}

console.log("\nREADY check:");
if (missing) {
  console.log("  ! Some foundation files are missing — is this the right repo / is AOS committed?");
}
if (anyEmpty) {
  console.log("  NOT READY — .aos/current/ has empty slots.");
  console.log("  Whoever assigns the work populates role + task (and plan once approved).");
  console.log("  See AOS.md > 'Who populates .aos/current/'. If unclear, ask — do not guess.");
} else if (!missing) {
  console.log("  Current state is populated. Follow AOS.md step 8 to become READY.");
}
console.log("");
