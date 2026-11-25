export const REPOSITORY = "CarlosEspinosa88/tanstack-start-app";

export const AI_LABELS = Object.freeze({
  needsApproval: "ai:needs-approval",
  approved: "ai:approved",
  inProgress: "ai:in-progress",
  prReady: "ai:pr-ready",
  blocked: "ai:blocked",
  riskHigh: "risk:high",
});

export function labelNames(issue) {
  return (issue?.labels ?? []).map((label) =>
    typeof label === "string" ? label : label?.name,
  ).filter(Boolean);
}

export function validateIssueGate(issue) {
  if (!issue || typeof issue !== "object") {
    return { ok: false, reason: "GitHub issue payload is missing or invalid." };
  }
  if (issue.pull_request) {
    return { ok: false, reason: "Pull requests cannot be used as workflow input." };
  }
  if (issue.state !== "open") {
    return { ok: false, reason: "Only open issues can enter the delivery pipeline." };
  }

  const labels = labelNames(issue);
  if (!labels.includes(AI_LABELS.approved)) {
    return {
      ok: false,
      reason: "Human approval is missing. Add the ai:approved label to this issue.",
      needsHumanApproval: true,
    };
  }

  const conflicting = [
    AI_LABELS.blocked,
    AI_LABELS.inProgress,
    AI_LABELS.prReady,
    AI_LABELS.riskHigh,
  ].filter((label) => labels.includes(label));

  if (conflicting.length) {
    return {
      ok: false,
      reason: `Issue is gated by: ${conflicting.join(", ")}. Resolve the gate manually before retrying.`,
    };
  }

  return { ok: true, labels };
}

export function assessPlan(plan, security) {
  const blockers = [];
  if (!plan || !security) {
    return { blocked: true, blockers: ["One or more planning agents did not return a result."] };
  }
  if (!["low", "medium", "high"].includes(plan.risk)) {
    blockers.push("Architect did not return a valid risk level.");
  }
  if (!["low", "medium", "high"].includes(security.risk)) {
    blockers.push("Security auditor did not return a valid risk level.");
  }
  if (plan.risk === "high" || security.risk === "high") {
    blockers.push("High-risk work requires a separately supervised engineering process.");
  }
  if (plan.migrationRequired) {
    blockers.push("Database schema or migration work is outside this autonomous pilot.");
  }
  if (plan.authzChanges) {
    blockers.push("Authentication or authorization changes require a human-led review.");
  }
  if (plan.secretAccessRequired) {
    blockers.push("The task requires access to secrets or credentials.");
  }
  if (security.authzChanges) {
    blockers.push("Authentication or authorization changes require a human-led review.");
  }
  if (security.secretAccessRequired) {
    blockers.push("The task requires access to secrets or credentials.");
  }
  for (const item of [...(plan.blockers ?? []), ...(security.blockers ?? [])]) {
    if (typeof item === "string" && item.trim()) blockers.push(item.trim());
  }
  return { blocked: blockers.length > 0, blockers: [...new Set(blockers)] };
}

const PROTECTED_PATHS = [
  /^\.github\//,
  /^scripts\//,
  /^prisma\//,
  /^generated\//,
  /^src\/routeTree\.gen\.ts$/,
  /^package(?:-lock)?\.json$/,
  /^npm-shrinkwrap\.json$/,
  /^\.env(?:\.|$)/,
  /^\.npmrc$/,
  /^Dockerfile(?:\.|$)/,
  /^vercel\.json$/,
  /^src\/server\/(?:auth|oauth|session|db|.*repository|board-sharing|todo-operations)(?:[./-]|$)/,
];

export function isProtectedPath(path) {
  const normalized = String(path ?? "").replaceAll("\\", "/").replace(/^\.\//, "");
  return PROTECTED_PATHS.some((pattern) => pattern.test(normalized));
}

export function assessChangedPaths(paths) {
  const normalized = [...new Set((paths ?? []).map((path) =>
    String(path).replaceAll("\\", "/").replace(/^\.\//, ""),
  ))].filter(Boolean);
  const protectedPaths = normalized.filter(isProtectedPath);
  return {
    ok: protectedPaths.length === 0,
    changedPaths: normalized,
    protectedPaths,
  };
}

export function branchSlug(title, issueNumber) {
  const slug = String(title ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return `ai/issue-${Number(issueNumber)}-${slug || "task"}`;
}

export function isRepositoryRemote(remote) {
  const value = String(remote ?? "").trim().replace(/\.git$/i, "");
  return [
    "https://github.com/" + REPOSITORY,
    "http://github.com/" + REPOSITORY,
    "git@github.com:" + REPOSITORY,
    "ssh://git@github.com/" + REPOSITORY,
  ].some((expected) => value.toLowerCase() === expected.toLowerCase());
}

export function blockingFindings(findings = []) {
  return (findings ?? []).filter((finding) =>
    ["P0", "P1", "P2"].includes(String(finding?.severity ?? "").toUpperCase()),
  );
}

export function safeIssueSnapshot(issue) {
  return {
    number: issue.number,
    title: String(issue.title ?? "").slice(0, 240),
    body: String(issue.body ?? "").slice(0, 12000),
    url: issue.html_url ?? "",
    state: issue.state,
    labels: labelNames(issue),
  };
}
