---
applyTo: "src/routes/**/*.ts,src/routes/**/*.tsx,src/server/**/*.ts"
---

# TanStack Start and Router rules

- This project uses TanStack Start and TanStack Router. Do not generate Next.js route handlers, Server Actions, App Router layouts, or NextAuth patterns.
- Inspect the installed TanStack package versions and existing route/server-function conventions before using an API.
- Keep file-based route modules in `src/routes/`; keep reusable server functions and domain/data logic in `src/server/`.
- Use the existing `createServerFn` patterns and method declarations. Validate untrusted inputs with Zod `inputValidator` schemas close to the server-function boundary.
- Authenticate inside every protected server-side handler. Do not assume that hiding a UI control or a route-level redirect is authorization.
- Keep privileged database access and environment secrets on the server. Return only fields required by the caller.
- Preserve route conventions and generated route-tree behavior. Never hand-edit `src/routeTree.gen.ts`; modify the source route/configuration and regenerate through the established toolchain.
- Preserve existing response/error semantics unless the requirement explicitly changes the public contract.
