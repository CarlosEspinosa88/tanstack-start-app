---
applyTo: "src/components/**/*.tsx,src/routes/**/*.tsx"
---

# React UI rules

- Use React 19 and the existing TanStack Router navigation, loader, and server-function patterns. Do not introduce Next.js APIs.
- Reuse the existing dashboard components, visual conventions, styles, and route patterns before adding new abstractions.
- Keep user-visible states explicit: loading, empty, error, success, disabled, and unauthorized states where relevant.
- Preserve URL-backed pagination, filters, and search behavior when modifying the dashboard.
- Use semantic HTML, accessible names, keyboard-operable controls, visible focus, and appropriate live/status announcements.
- Keep server-only imports, Prisma clients, OAuth secrets, and JWT signing/verification code out of client bundles.
- Avoid redundant derived state and effects. Do not add memoization unless it addresses a demonstrated or structurally clear problem.
- Test visible behavior and interaction outcomes, not component implementation details.
