---
name: pull-request-preparation
description: Prepare a focused, reviewable Draft PR after the AI delivery workflow has implemented, tested and independently reviewed an approved task.
---

# Draft pull request preparation

## Before publishing

- Confirm the issue is open and explicitly approved.
- Confirm the branch is new and based on current `origin/main`.
- Inspect all staged and unstaged changes, including untracked files.
- Reject protected paths, generated files, environment files, local databases, lockfile/package changes, deployment config and unrelated changes.
- Run actual repository checks; record command and exit status, never an assumed result.
- Confirm the QA, engineering review and security review returned valid results.
- Block on any P0/P1/P2 finding or unresolved QA/security blocker.

## PR contents

- Link and close the originating issue with `Closes #N`.
- Summarize the implementation and acceptance criteria.
- List actual local check results.
- State that Playwright/PostgreSQL CI runs on the Draft PR if those checks were not run locally.
- Include P3/info findings for human assessment.
- State explicit exclusions: no merge, deployment, production migration or secret access.

## Publication rules

- Use a new `ai/issue-N-slug` branch based on `origin/main`.
- Create a commit only after final path and diff checks pass.
- Push only the feature branch.
- Open the PR with GitHub's `--draft` flag.
- Never mark it ready, request auto-merge, bypass branch protection, or merge it.
