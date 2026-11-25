# Issue to Draft PR — Dynamic Workflow

This project extension registers the `issue-to-draft-pr` Dynamic Workflow for GitHub Copilot CLI. It implements the approved-issue delivery path in code; the workflow does not depend on the orchestrator agent merely remembering a prompt.

> Dynamic Workflows are currently a public-preview Copilot feature. Use a current Copilot CLI and enable experimental features with `--experimental`. Review GitHub's current documentation before enabling this in a team environment:
> - https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-dynamic-workflows
> - https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/dynamic-workflows

## Required setup

From a clean local clone of this repository:

1. Use Node.js 22.12+ and install the project dependencies with `npm ci`.
2. Authenticate GitHub CLI with `gh auth login`. The authenticated account needs read/write access to issues, branches and pull requests in this repository.
3. Verify that `origin` points to `CarlosEspinosa88/tanstack-start-app`.
4. Create the pipeline labels: `node scripts/ai-pipeline/bootstrap-labels.mjs`.
5. Run the local preflight: `node scripts/ai-pipeline/preflight.mjs`.
6. Start the interactive Copilot CLI: `copilot --experimental`.
7. Ask Copilot to run the `issue-to-draft-pr` Dynamic Workflow with the approved issue number. Example: "Run issue-to-draft-pr for issue 47."

Use the interactive CLI for the initial rollout so the CLI can ask you to approve tools requested by the agent. The non-interactive `copilot workflow run` command does not show permission approval prompts; do not use it until you have deliberately configured all required permissions.

## Human approval contract

The daily code-review automation must create or update an issue with the `ai:needs-approval` label. It must never apply `ai:approved`.

A human reviews the evidence, acceptance criteria and risk, then applies `ai:approved` manually in GitHub. This label is the explicit start authorization. The workflow re-fetches the issue from GitHub and verifies:

- The item is an open issue, not a pull request.
- `ai:approved` is present.
- The issue is not already `ai:in-progress`, `ai:pr-ready` or `ai:blocked`.
- `risk:high` is absent.
- All required pipeline labels exist.

An issue missing approval is not modified and is not marked blocked. A blocked issue needs a human to resolve the cause and remove `ai:blocked` before retrying.

## What the workflow does

1. Re-fetches and validates the approved issue and repository state.
2. Runs architecture, security and QA planning agents in parallel.
3. Blocks work requiring a migration, schema change, authentication/authorization change, secret access, high-risk work, or protected paths.
4. Creates a fresh `ai/issue-N-slug` branch from `origin/main`.
5. Delegates implementation to the existing TanStack Start full-stack agent.
6. Delegates a test review/addition pass to the test engineer.
7. Checks changed paths and runs Prisma validation, Node tests, TypeScript and a production build.
8. Requests independent Engineering Reverse Review and Security Auditor findings.
9. Blocks on P0/P1/P2 findings.
10. Commits and pushes the feature branch, opens a **Draft** pull request, labels the issue `ai:pr-ready`, and comments with the PR URL.

The workflow never merges, marks a PR ready, deploys, runs production migrations, resets a database, or requests secret values.

## Risk boundaries

This first version is deliberately conservative:

- Database schema/migrations are blocked and remain a human-led process.
- Authentication, OAuth, sessions, authorization, board-sharing and repository data-access changes are blocked.
- Secrets and credential access are not permitted.
- `.github/`, `scripts/`, `prisma/`, `generated/`, package manifests/lockfiles and deployment configuration are protected.
- Low- and medium-risk changes can proceed only after the issue has the human-applied `ai:approved` label.
- Existing CI runs on the Draft PR, including the PostgreSQL 16 service and Playwright E2E. The local workflow deliberately clears `TEST_DATABASE_URL`, so DB-backed tests skip locally rather than connecting to an unknown database.
- The local build removes `VERCEL_ENV`; this avoids the repository build script running `prisma migrate deploy`.

## Extension security model

The extension uses Node's `execFile` with fixed executable names and argument arrays for Git, GitHub CLI and npm. Issue text is never interpolated into a shell command. The extension itself is executable repository code and its direct subprocess calls do **not** pass through Copilot's tool-permission approval prompts. Review `extension.mjs` before trusting or enabling it.

Subagents use the permissions available in the interactive Copilot CLI session. Approve only the repository read/edit operations required. Never start with `--allow-all`, `--yolo`, or broad network access. Git pushes and PR creation are performed by the reviewed extension code after the issue gate and quality gates pass.

## Recovery

- If planning blocks the issue, resolve the risk or split the task into a separate human-supervised issue.
- If tests or reviews fail, inspect the local feature branch and the `ai:blocked` issue comment; the workflow does not force-push or reuse a stale branch.
- If a Draft PR was created but the final issue label/comment update failed, inspect GitHub PRs before retrying.
- Never remove `ai:blocked` just to force a run. Resolve the listed blocker first.
