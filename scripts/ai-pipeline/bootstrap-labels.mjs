import { execFileSync } from "node:child_process";
import { REPOSITORY, AI_LABELS } from "./contracts.mjs";

const definitions = [
  [AI_LABELS.needsApproval, "D4C5F9", "AI finding or task awaiting explicit human approval."],
  [AI_LABELS.approved, "0E8A16", "Explicitly approved by a human to enter the AI delivery workflow."],
  [AI_LABELS.inProgress, "1D76DB", "AI delivery workflow is running."],
  [AI_LABELS.prReady, "5319E7", "AI workflow opened a Draft PR; human review required."],
  [AI_LABELS.blocked, "B60205", "AI workflow stopped for human intervention."],
  ["risk:low", "C2E0C6", "Low-risk task."],
  ["risk:medium", "FBCA04", "Medium-risk task."],
  ["risk:high", "D93F0B", "High-risk task; never auto-implemented by this workflow."],
];

function gh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

try {
  gh(["auth", "status", "--hostname", "github.com"]);
  const existing = new Set(
    gh(["api", `repos/${REPOSITORY}/labels?per_page=100`, "--paginate", "--jq", ".[].name"])
      .split("\n").map((value) => value.trim()).filter(Boolean),
  );

  for (const [name, color, description] of definitions) {
    if (existing.has(name)) {
      process.stdout.write(`kept  ${name}\n`);
      continue;
    }
    gh([
      "api", `repos/${REPOSITORY}/labels`, "--method", "POST",
      "-f", `name=${name}`,
      "-f", `color=${color}`,
      "-f", `description=${description}`,
    ]);
    process.stdout.write(`added ${name}\n`);
  }
  process.stdout.write("\nAI pipeline labels are ready. The script never applies ai:approved to an issue.\n");
} catch (error) {
  process.stderr.write(`Label bootstrap failed: ${error.message}\n`);
  process.exitCode = 1;
}
