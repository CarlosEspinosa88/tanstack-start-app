import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { isRepositoryRemote } from "./contracts.mjs";

function command(binary, args) {
  return execFileSync(binary, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  }).trim();
}

function fail(message) {
  throw new Error(message);
}

try {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 12)) fail("Node.js 22.12+ is required.");

  const root = command("git", ["rev-parse", "--show-toplevel"]);
  if (root !== process.cwd()) fail("Run this preflight from the repository root.");

  const remote = command("git", ["remote", "get-url", "origin"]);
  if (!isRepositoryRemote(remote)) fail("origin must point to CarlosEspinosa88/tanstack-start-app.");

  if (command("git", ["status", "--porcelain"]).length) {
    fail("Working tree is not clean. Commit or stash your changes before running the pipeline.");
  }

  command("gh", ["auth", "status", "--hostname", "github.com"]);
  const copilotVersion = command("copilot", ["--version"]);
  if (!existsSync("node_modules")) fail("node_modules is missing. Run npm ci first.");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  if (!pkg.scripts?.test || !pkg.scripts?.build || !pkg.scripts?.typecheck) {
    fail("Expected npm scripts are missing from package.json.");
  }
  command("node", ["--check", ".github/extensions/issue-to-draft-pr/extension.mjs"]);
  command("node", ["--test", "scripts/ai-pipeline/contracts.test.mjs"]);

  process.stdout.write("AI delivery preflight passed.\n");
  process.stdout.write(`Repository: ${remote}\nNode: ${process.versions.node}\nCopilot CLI: ${copilotVersion}\n`);
  process.stdout.write("Next: open copilot --experimental and invoke issue-to-draft-pr after applying ai:approved to one issue.\n");
} catch (error) {
  process.stderr.write(`AI delivery preflight failed: ${error.message}\n`);
  process.exitCode = 1;
}
