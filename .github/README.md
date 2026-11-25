# Repository AI engineering configuration

This directory contains the shared operating model for GitHub Copilot in this repository.

## Configuration map

| Area | Path | Purpose |
|---|---|---|
| Global context | `copilot-instructions.md` | Project facts and always-on engineering rules |
| Path-specific rules | `instructions/*.instructions.md` | Context applied to matching source/test paths |
| Specialist agents | `agents/*.agent.md` | Scoped roles with explicit tool access |
| Reusable procedures | `skills/*/SKILL.md` | Multi-step practices loaded when relevant |
| Invocable tasks | `prompts/*.prompt.md` | Repeatable tasks such as planning, testing, and review |
| Hooks guidance | `hooks/README.md` | Safe extension points for Copilot CLI/cloud agent |
| CI / security | `workflows/*.yml` | GitHub Actions checks |
| Dependency maintenance | `dependabot.yml` | Weekly dependency update PRs |

The existing `engineering-reverse-review.agent.md` is intentionally retained. It provides repository-specific, read-only PR review by reconstructing behavior from source.

## Recommended usage

1. Start a new Copilot Chat session for a new task.
2. Use the architect agent or `/plan-feature` before a multi-module change.
3. Choose the full-stack or database agent for implementation.
4. Load the relevant skill, especially for authentication, access control, migrations, or test design.
5. Use `/test-and-verify` and the read-only review/security agents before opening a PR.
6. Let GitHub Actions provide the final reproducible CI signal.

## Important distinctions

- Instructions are contextual guidance; they are not a hard security boundary.
- Agent tool lists scope the tools available to that profile in supported Copilot surfaces. A read-only reviewer should not receive edit/execute tools.
- Skills are procedures, not autonomous agents.
- Prompt files are manually invoked in compatible IDEs (for example, VS Code). They are not GitHub Actions workflows or shell commands.
- Hooks execute commands in supported Copilot environments. Add active hooks only after reviewing their input/output contracts and testing both local and cloud behavior.
- GitHub Actions enforce repository checks independently of an agent conversation.

See the GitHub Copilot documentation for [custom instructions](https://docs.github.com/en/copilot/concepts/prompting-and-context/custom-instructions), [custom agents](https://docs.github.com/en/copilot/concepts/agents/about-custom-agents), [agent skills](https://docs.github.com/en/copilot/concepts/agents/agent-skills), [prompt files](https://docs.github.com/en/copilot/concepts/prompting-and-context/prompt-files), and [hooks](https://docs.github.com/en/copilot/concepts/customizations/hooks).

## Multi-agent issue delivery

The project extension at `.github/extensions/issue-to-draft-pr/` registers the approved-issue-to-Draft-PR Dynamic Workflow. Read its README before running it. The workflow requires a human-applied `ai:approved` label and must be started explicitly from an interactive Copilot CLI session with experimental features enabled.

Daily review automation creates issues using the `AI finding` template and applies `ai:needs-approval` only. It must never approve its own findings. The workflow has strict risk/path gates, deterministic local checks, independent code/security review and creates Draft PRs only; merge/deploy remains a human action.

Contracts live in `.github/contracts/agent-output-contracts.md`; policy helpers and tests are in `scripts/ai-pipeline/`. Bootstrap labels and validate the local environment using the instructions in the extension README.
