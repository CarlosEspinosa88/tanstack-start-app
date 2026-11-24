---
agent: 'agent'
description: 'Perform a read-only security audit of authentication, server functions, data access, and automation.'
---

Audit this scope:

${input:scope:Specify routes, flows, files, or the whole repository}

Trace the implementation. Prioritize OAuth state and ID-token verification, JWT/session validation and cookies, server-function authentication, Todo userId isolation, BoardShare state transitions, input validation, error/log disclosure, PostgreSQL query behavior, and GitHub Actions permissions/secrets.

Do not edit files or expose secret values. Separate confirmed vulnerabilities from hardening recommendations. For each finding include severity, path/line, preconditions, attack path, impact, and remediation. State what you did not assess.
