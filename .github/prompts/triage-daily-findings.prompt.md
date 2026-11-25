---
agent: 'agent'
description: 'Turn a daily code-intelligence report into evidence-based GitHub issue drafts awaiting a human approval.'
---

Review these daily engineering findings:

${input:findings:Paste the daily review output or link the report}

Use the `task-triage` skill and the `AI finding` issue template. For every proposed issue:

- Verify the reported behavior against current source and tests.
- Deduplicate by root cause and affected behavior.
- Include exact file/line evidence, reproduction, impact and testable acceptance criteria.
- Classify risk honestly and identify protected/security-sensitive areas.
- Remove secrets, tokens, cookies, environment values and personal data.
- Do not create issues for speculative observations.

Return a structured list of recommended issue titles and complete issue bodies. The only lifecycle label appropriate for daily automation is `ai:needs-approval`. Never apply `ai:approved`, `ai:in-progress`, `ai:pr-ready`, or remove `ai:blocked`. A human must approve each issue separately.
