import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_LABELS,
  assessChangedPaths,
  assessPlan,
  blockingFindings,
  branchSlug,
  isProtectedPath,
  isRepositoryRemote,
  validateIssueGate,
} from "./contracts.mjs";

const issue = (labels = [AI_LABELS.approved], state = "open") => ({
  number: 123,
  title: "Safe UI improvement",
  state,
  labels: labels.map((name) => ({ name })),
});

test("requires a human ai:approved label", () => {
  const result = validateIssueGate(issue([AI_LABELS.needsApproval]));
  assert.equal(result.ok, false);
  assert.equal(result.needsHumanApproval, true);
});

test("rejects closed issues and pull requests", () => {
  assert.equal(validateIssueGate(issue([AI_LABELS.approved], "closed")).ok, false);
  assert.equal(validateIssueGate({ ...issue(), pull_request: { url: "x" } }).ok, false);
});

test("rejects duplicate, blocked, in-progress, ready, and risk-high issues", () => {
  for (const label of [AI_LABELS.blocked, AI_LABELS.inProgress, AI_LABELS.prReady, AI_LABELS.riskHigh]) {
    assert.equal(validateIssueGate(issue([AI_LABELS.approved, label])).ok, false, label);
  }
});

test("allows an open approved issue with no conflicting labels", () => {
  assert.equal(validateIssueGate(issue()).ok, true);
});

test("blocks high-risk, migration, authorization, and secret-access plans", () => {
  const basePlan = { risk: "low", migrationRequired: false, blockers: [] };
  const baseSecurity = { risk: "low", authzChanges: false, secretAccessRequired: false, blockers: [] };
  assert.equal(assessPlan({ ...basePlan, risk: "high" }, baseSecurity).blocked, true);
  assert.equal(assessPlan({ ...basePlan, migrationRequired: true }, baseSecurity).blocked, true);
  assert.equal(assessPlan({ ...basePlan, authzChanges: true }, baseSecurity).blocked, true);
  assert.equal(assessPlan({ ...basePlan, secretAccessRequired: true }, baseSecurity).blocked, true);
  assert.equal(assessPlan(basePlan, { ...baseSecurity, authzChanges: true }).blocked, true);
  assert.equal(assessPlan(basePlan, { ...baseSecurity, secretAccessRequired: true }).blocked, true);
});

test("allows low- and medium-risk work only when sensitive boundaries are untouched", () => {
  const security = { risk: "low", authzChanges: false, secretAccessRequired: false, blockers: [] };
  assert.equal(assessPlan({ risk: "low", migrationRequired: false, blockers: [] }, security).blocked, false);
  assert.equal(assessPlan({ risk: "medium", migrationRequired: false, blockers: [] }, security).blocked, false);
});

test("blocks changes to protected files and paths", () => {
  for (const path of [
    ".github/workflows/ci.yml",
    "scripts/release.mjs",
    "prisma/schema.prisma",
    "generated/client.ts",
    "src/server/auth.ts",
    "src/server/todo-prisma-repository.ts",
    "package.json",
    ".env.production",
  ]) assert.equal(isProtectedPath(path), true, path);

  assert.equal(assessChangedPaths(["src/routes/index.tsx", "src/components/TaskRow.tsx"]).ok, true);
  assert.equal(assessChangedPaths(["src/routes/index.tsx", "prisma/schema.prisma"]).ok, false);
});

test("creates stable, safe branch names from untrusted titles", () => {
  assert.equal(branchSlug("Add á simple UI / card!", 42), "ai/issue-42-add-a-simple-ui-card");
  assert.match(branchSlug("../../../delete refs", 3), /^ai\/issue-3-[a-z0-9-]+$/);
});

test("accepts only the configured GitHub origin", () => {
  assert.equal(isRepositoryRemote("git@github.com:CarlosEspinosa88/tanstack-start-app.git"), true);
  assert.equal(isRepositoryRemote("https://github.com/CarlosEspinosa88/tanstack-start-app"), true);
  assert.equal(isRepositoryRemote("https://github.com/other/project.git"), false);
});

test("P0, P1, and P2 findings block; P3 is review-only", () => {
  const findings = [
    { severity: "P1" },
    { severity: "P2" },
    { severity: "P3" },
    { severity: "info" },
  ];
  assert.deepEqual(blockingFindings(findings).map((item) => item.severity), ["P1", "P2"]);
});
