# Copilot hooks

Repository hooks are supported by Copilot CLI and Copilot cloud agent; VS Code hook support and event coverage can differ by agent and version.

Hooks execute shell commands during the agent lifecycle. They can perform useful controls such as checking tool invocations, but they also introduce executable repository code. This repository intentionally does not enable an active hook by default.

## Before enabling a hook

1. Read the current [GitHub Copilot hooks documentation](https://docs.github.com/en/copilot/concepts/customizations/hooks) and [hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference).
2. Verify event support and input/output schema for the exact Copilot surface used by the team.
3. Keep scripts short, deterministic, cross-platform where needed, and free of secret values.
4. Test allow/deny behavior with harmless commands first.
5. Do not treat hooks or model instructions as the only security boundary. Use protected branches, required checks, environment protection, least-privilege tokens, and server-side controls.

Good first candidates are a session-start notice or a pre-tool guard for destructive operations. A pre-tool hook must parse its documented input and return the documented decision format; do not build one from guessed payload fields.

Never add prompt logging that records source code, tokens, environment variables, or personal data. Do not activate hooks until their exact contract has been verified in the target environment.
