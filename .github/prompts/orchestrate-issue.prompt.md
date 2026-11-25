---
agent: 'agent'
description: 'Prepare and invoke the reviewed Dynamic Workflow for one manually approved GitHub issue.'
---

Prepare the issue-to-Draft-PR delivery for issue number:

${input:issueNumber:Enter the GitHub issue number}

First verify the issue is open, review its evidence and acceptance criteria, and confirm a human has explicitly applied `ai:approved`. Do not add that label yourself.

If the issue is not approved, stop and explain that the human must approve it. If it is approved, summarize the proposed workflow and risk boundaries, then instruct the operator to invoke the registered `issue-to-draft-pr` Dynamic Workflow from an interactive `copilot --experimental` session.

Do not implement code, create branches, push, create a PR, change issue labels, access secrets, or merge through this prompt. The executable workflow in `.github/extensions/issue-to-draft-pr/extension.mjs` owns those steps.
