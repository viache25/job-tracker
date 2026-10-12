#!/usr/bin/env node
// Imports backlog/BACKLOG.md into GitHub: labels, milestones, issues and (optionally) a Project board.
//
// Usage:
//   node scripts/create-backlog.mjs <owner>/<repo> [--project "JobTracker"] [--dry-run]
//
// Requires GitHub CLI (`gh auth login`). For the board also: `gh auth refresh -s project`.
// Safe to re-run: issues whose title already exists are skipped, labels are updated in place.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const repo = args[0] && !args[0].startsWith("--") ? args[0] : null;
const dryRun = args.includes("--dry-run");
const pIdx = args.indexOf("--project");
const projectTitle = pIdx >= 0 ? args[pIdx + 1] : null;

if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
  console.error('Usage: node scripts/create-backlog.mjs <owner>/<repo> [--project "JobTracker"] [--dry-run]');
  process.exit(1);
}
if (pIdx >= 0 && !projectTitle) {
  console.error("--project needs a title");
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(join(here, "..", "backlog", "BACKLOG.md"), "utf8");

// ---------- parse ----------
function parse(text) {
  const milestones = [];
  const issues = [];
  let ms = null;
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      ms = { title: line.slice(3).trim(), description: "" };
      milestones.push(ms);
      cur = null;
      continue;
    }
    if (line.startsWith("### ")) {
      const m = line.slice(4).match(/^(T-\d+)\s+(.+)$/);
      if (!m) throw new Error(`Cannot parse issue heading: ${line}`);
      if (!ms) throw new Error(`Issue ${m[1]} is outside of a "##" milestone section`);
      cur = { key: m[1], title: m[2].trim(), milestone: ms.title, labels: [], depends: [], body: [] };
      issues.push(cur);
      continue;
    }
    if (!ms) continue;
    if (!cur) {
      if (line.startsWith("> ")) ms.description += (ms.description ? " " : "") + line.slice(2).trim();
      continue;
    }
    if (line.startsWith("labels:")) {
      cur.labels = line.slice(7).split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (line.startsWith("depends:")) {
      cur.depends = line.match(/T-\d+/g) ?? [];
      continue;
    }
    cur.body.push(line);
  }
  return { milestones, issues };
}

const { milestones, issues } = parse(md);

// sanity checks
const keys = new Set();
for (const it of issues) {
  if (keys.has(it.key)) throw new Error(`Duplicate key ${it.key}`);
  for (const d of it.depends) {
    if (!keys.has(d)) throw new Error(`${it.key} depends on ${d}, which is missing or comes later in the file`);
  }
  keys.add(it.key);
}

// ---------- gh helpers ----------
const quote = (s) => (/[\s"'#]/.test(s) ? JSON.stringify(s) : s);
function gh(ghArgs, input) {
  if (dryRun) {
    console.log("    gh " + ghArgs.map(quote).join(" "));
    return "";
  }
  return execFileSync("gh", ghArgs, { encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function ghTry(ghArgs, input) {
  try {
    return gh(ghArgs, input);
  } catch (e) {
    console.warn(`    ! ${String(e.stderr || e.message).trim().split("\n")[0]}`);
    return null;
  }
}
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

if (!dryRun) {
  try {
    execFileSync("gh", ["auth", "status"], { stdio: "ignore" });
  } catch {
    console.error("GitHub CLI is not logged in. Run: gh auth login");
    process.exit(1);
  }
}

console.log(`${dryRun ? "[dry run] " : ""}${repo}: ${milestones.length} milestones, ${issues.length} issues\n`);

// ---------- labels ----------
const LABEL_COLORS = [
  [/^type:/, "1D76DB"],
  [/^area:/, "C5DEF5"],
  [/^P0$/, "B60205"],
  [/^P1$/, "D93F0B"],
  [/^P2$/, "FBCA04"],
  [/^size:/, "5319E7"],
];
const colorFor = (name) => LABEL_COLORS.find(([re]) => re.test(name))?.[1] ?? "EDEDED";
const allLabels = new Set(["type:bug", "dogfooding", ...issues.flatMap((i) => i.labels)]);

console.log("Labels");
for (const name of [...allLabels].sort()) {
  ghTry(["label", "create", name, "--repo", repo, "--color", colorFor(name), "--force"]);
}

// ---------- milestones ----------
console.log("\nMilestones");
const existingMilestones = new Set(
  dryRun ? [] : JSON.parse(gh(["api", `repos/${repo}/milestones?state=all&per_page=100`]) || "[]").map((m) => m.title),
);
for (const ms of milestones) {
  if (existingMilestones.has(ms.title)) {
    console.log(`  = ${ms.title} (exists)`);
    continue;
  }
  console.log(`  + ${ms.title}`);
  ghTry(["api", `repos/${repo}/milestones`, "-f", `title=${ms.title}`, "-f", `description=${ms.description}`]);
}

// ---------- issues ----------
console.log("\nIssues");
const existingIssues = new Map(
  dryRun
    ? []
    : JSON.parse(
        gh(["issue", "list", "--repo", repo, "--state", "all", "--limit", "1000", "--json", "number,title,url"]) || "[]",
      ).map((i) => [i.title, i]),
);

const created = new Map(); // key -> { number, url }
let fakeNumber = 0;
for (const it of issues) {
  const existing = existingIssues.get(it.title);
  if (existing) {
    created.set(it.key, { number: existing.number, url: existing.url });
    console.log(`  = #${existing.number} ${it.title} (exists)`);
    continue;
  }

  let body = it.body.join("\n").trim();
  if (it.depends.length) {
    body += `\n\n**Зависит от:** ${it.depends.map((k) => `#${created.get(k)?.number ?? k}`).join(", ")}`;
  }
  body += `\n\n---\nКлюч в исходном плане: ${it.key}`;

  const ghArgs = ["issue", "create", "--repo", repo, "--title", it.title, "--body-file", "-", "--milestone", it.milestone];
  for (const l of it.labels) ghArgs.push("--label", l);

  if (dryRun) {
    fakeNumber += 1;
    created.set(it.key, { number: fakeNumber, url: "" });
    console.log(`  + #${fakeNumber}? [${it.milestone}] ${it.title}  (${it.labels.join(", ")})`);
    continue;
  }

  const url = ghTry(ghArgs, body);
  if (!url) continue;
  const number = Number(url.split("/").pop());
  created.set(it.key, { number, url });
  console.log(`  + #${number} ${it.title}`);
  sleep(400); // stay well below GitHub's content-creation rate limits
}

// ---------- project board ----------
if (projectTitle) {
  console.log(`\nProject "${projectTitle}"`);
  const owner = repo.split("/")[0];
  if (dryRun) {
    console.log(`    gh project create --owner ${owner} --title ${quote(projectTitle)}`);
    console.log(`    gh project item-add <n> --owner ${owner} --url <issue url>   × ${issues.length}`);
  } else {
    let project = null;
    const list = ghTry(["project", "list", "--owner", owner, "--format", "json", "--limit", "100"]);
    if (list) project = (JSON.parse(list).projects ?? []).find((p) => p.title === projectTitle) ?? null;
    if (!project) {
      const out = ghTry(["project", "create", "--owner", owner, "--title", projectTitle, "--format", "json"]);
      project = out ? JSON.parse(out) : null;
    }
    if (!project) {
      console.warn("  Could not create the project. Check: gh auth refresh -s project");
    } else {
      ghTry(["project", "link", String(project.number), "--owner", owner, "--repo", repo]);
      for (const { url } of created.values()) {
        if (url) ghTry(["project", "item-add", String(project.number), "--owner", owner, "--url", url]);
      }
      console.log(`  ${project.url ?? ""}`);
    }
  }
}

console.log(`\nDone${dryRun ? " (nothing was created — dry run)" : ""}.`);
