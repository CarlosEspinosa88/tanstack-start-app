---
agent: 'agent'
description: 'Review the current diff as a read-only principal engineer and report only actionable regressions.'
---

Review the current branch changes against the base branch.

Read the relevant existing code and trace affected behavior before judging the diff. Focus on correctness, auth/session security, ownership and board sharing, PostgreSQL data integrity, concurrency, tests, performance, accessibility, and deployment safety.

Do not edit files, execute commands, approve/submit a GitHub review, or merge. Report only actionable findings, ordered by severity, with file/line, concrete scenario, impact, and minimal fix. Separate confirmed defects from suggestions. If no findings, state the verification limits.
