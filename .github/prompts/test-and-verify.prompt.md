---
agent: 'agent'
description: 'Create or improve tests for a behavior change and execute relevant repository checks.'
---

Test this behavior or bug:

${input:target:Describe the behavior, bug, or module}

Inspect the test runner and nearby tests first. Choose the appropriate Node, PostgreSQL integration, or Playwright layer. Cover successful behavior, boundaries, failure states, and ownership/authorization if relevant. Keep fixtures deterministic and synthetic.

Run focused checks first, then broader checks when justified. Available scripts include npm test, npm run test:e2e, npm run typecheck, and npm run prisma:validate. There is no lint script at present. Never point tests at production. Report actual commands, results, and untested gaps.
