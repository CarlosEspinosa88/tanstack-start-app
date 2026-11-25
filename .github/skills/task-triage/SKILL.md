---
name: task-triage
description: Convert daily code-intelligence findings into evidence-based GitHub issues that a human can approve before AI implementation.
---

# Daily finding to approved issue

## Purpose

The daily code-review automation discovers opportunities. It does not authorize code changes. Its responsibility is to create or update a high-quality issue with the `ai:needs-approval` label.

## Finding quality

Before creating an issue:

1. Deduplicate by root cause, affected behavior and file/line; update an existing issue when appropriate.
2. Confirm the finding against current source. Include a precise path and line or symbol.
3. Explain a reproducible scenario, observable impact and why it matters.
4. Suggest a small, verifiable correction. Avoid prescribing a large refactor when a local fix is enough.
5. Include acceptance criteria that can be tested.
6. Classify risk honestly. Use `risk:high` for auth/session, authorization, secrets, data loss, migrations, permissions or deployment-sensitive concerns.
7. Remove secrets, personal data, raw tokens, cookies, request bodies and environment values from the issue.

## Approval lifecycle

- The daily automation may apply `ai:needs-approval`, `risk:low`, `risk:medium` or `risk:high`.
- It must never add `ai:approved`, `ai:in-progress`, `ai:pr-ready` or remove `ai:blocked`.
- A human reads the evidence and acceptance criteria, decides whether to proceed, then manually applies `ai:approved`.
- Approval is per issue. A previous approval does not authorize a different issue.
- The Dynamic Workflow re-fetches the issue and checks the approval label before touching the worktree.

## Issue body contract

Use the repository's `AI finding` issue template. Required sections are Summary, Evidence, Impact, Suggested response, Acceptance criteria, Risk and Changed paths. Mark unknown information as unknown rather than guessing.

Do not ask the workflow to access secret material. If reproduction requires a credential, use a redacted fixture or route the issue to a human.
