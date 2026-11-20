# Decision map
repo: tanstack-start-app | built from: 858446a | date: 2026-11-20
root problem: Give people a private place to manage their todos, with a useful dashboard.

## D1. Keep each persons tasks persistent and attributable
- Problem: Tasks must survive requests and remain associated with the person who owns them.
- Given: A multi-user app with task records.
- Constraints, in order:
  1. Data must survive application restarts -> breaks: browser-only or in-memory storage.
  2. A task belongs to one user -> breaks: a global, unowned task list.
- Decision: Relational persistence; the schema stores users, owned todos, and an ordering index.
- Options: In-memory state (ephemeral); browser storage (one device only); relational records with a user relation (durable and queryable, requires a database).
- Evidence: commit 0abc462 "Add schema, seed data and others prisma configurations", files prisma/schema.prisma, prisma/migrations/20251119221347_init/migration.sql
- Where: prisma/schema.prisma::User - persistent account and owned tasks
- Where: prisma/schema.prisma::Todo - task fields, required owner relation and ordering index

## D2. Establish identity before exposing private data
- Problem: A person needs a trustworthy way to identify themselves without managing a new password.
- Given: Persistent users can be linked to an external identity provider.
- Constraints, in order:
  1. The provider must confirm identity and verified email -> breaks: trusting an unverified callback payload.
  2. Later requests need a compact credential -> breaks: repeating provider login on every request.
- Decision: OAuth authorization-code flow with signed session token; callback validates provider claims and upserts the user.
- Options: Local password accounts (full credential lifecycle); provider login with no persistent session (repeated login); OAuth plus signed session cookie (delegates identity and supports later requests).
- Evidence: commit 7a1d08b "Add Google login and OAuth flow", files src/routes/auth.google.ts, src/routes/auth.callback.ts, src/server/auth.ts
- Where: src/routes/auth.google.ts::Route - generates one-time state and begins provider redirect
- Where: src/routes/auth.callback.ts::Route - checks returned state and sets session cookie
- Where: src/server/auth.ts::handleGoogleCallback - verifies provider identity and persists user
- Where: src/server/auth.ts::getUserFromRequest - resolves request credentials to current account

## D3. Make ownership part of every task operation
- Problem: An authenticated person must not read or change another persons task, even by guessing its identifier.
- Given: A request resolves to a user and task operations reach persistent storage.
- Constraints, in order:
  1. Every operation requires an authenticated owner -> breaks: accepting a client-supplied owner or unauthenticated mutation.
  2. Ownership constrains the database operation itself -> breaks: load-by-ID followed by a possibly omitted check.
- Decision: Server-side owner scoping; authenticated identity supplies userId and update/delete predicates include task id and userId.
- Options: Client-side hiding (no access control); load and check separately (omission risk); owner-scoped database operations (enforced at each operation).
- Evidence: commit 9d540fd "Harden database, auth, and task interactions", files src/server/todo.server.ts, src/server/todo-operations.ts, src/server/todo-prisma-repository.ts
- Where: src/server/todo.server.ts::requireRequestUser - rejects unauthenticated task calls
- Where: src/server/todo-operations.ts::updateOwnedTodo - passes authenticated owner into update
- Where: src/server/todo-prisma-repository.ts::createTodoRepository - scopes updateOwned and deleteOwned queries

## D4. Keep task rules independent of the database implementation
- Problem: Task behavior must be testable and consistent without coupling its rules to database calls.
- Given: Authenticated server actions need CRUD and dashboard queries.
- Constraints, in order:
  1. Rules should accept controlled data operations -> breaks: embedding all decisions in route handlers and ORM calls.
  2. Rules should be testable without a live database -> breaks: integration infrastructure for every rule test.
- Decision: Repository boundary; operations consume a typed repository contract, while a Prisma adapter performs storage.
- Options: ORM calls directly in routes (short but tightly coupled); mock the ORM everywhere (fragile); repository interface plus adapter (clear boundary, extra structure).
- Evidence: code only; files src/server/todo-operations.ts, src/server/todo-prisma-repository.ts, src/server/todo.server.ts
- Where: src/server/todo-operations.ts::TodoRepository - persistence contract for rules
- Where: src/server/todo-operations.ts::getTodoDashboardData - database-independent dashboard operation
- Where: src/server/todo-prisma-repository.ts::createTodoRepository - maps contract to Prisma

## D5. Derive a useful dashboard from filtered, bounded data
- Problem: A person needs an overview and must find tasks without loading an unbounded list.
- Given: Owned tasks have status, title, and creation time; the dashboard needs filters and recent activity.
- Constraints, in order:
  1. Search and status affect results on the server -> breaks: downloading all tasks to filter in the browser.
  2. Lists have a fixed maximum size and stable order -> breaks: unbounded or inconsistent pagination.
  3. Empty days and out-of-range pages remain usable -> breaks: incomplete charts or invalid results.
- Decision: Server-side filtered pagination plus derived summaries and a fixed UTC activity window.
- Options: Return all records (unbounded); client-side filtering (more transfer); server query with bounded pages and aggregates (scales better, more query logic).
- Evidence: commit 029d42c "Improve task dashboard and lifecycle", files src/server/todo-operations.ts, src/server/dashboard.ts, src/server/todo-prisma-repository.ts
- Where: src/server/todo-operations.ts::getTodoDashboardData - computes counts, activity, page bounds and page results
- Where: src/server/dashboard.ts::buildTodoActivity - fills the UTC activity series
- Where: src/server/todo-prisma-repository.ts::createTodoRepository - stable ordered page query

## D6. Keep dashboard state navigable and refreshed
- Problem: A person should search, filter, and page through tasks while seeing current server data after changes.
- Given: The dashboard is loaded for an authenticated person and task actions run on the server.
- Constraints, in order:
  1. Search/filter/page state should survive navigation and be shareable -> breaks: component memory only.
  2. Mutations change server-derived lists and summaries -> breaks: assuming displayed data stays current.
  3. Failed actions need recoverable feedback -> breaks: silently swallowing errors.
- Decision: URL-backed query state with loader-driven data and invalidation after mutations; UI reports failures.
- Options: Local state only (lost on navigation); reload the whole page (disruptive); URL state plus loader refresh (navigable and server-authoritative).
- Evidence: commit 029d42c "Improve task dashboard and lifecycle", files src/routes/index.tsx, src/server/todo.server.ts
- Where: src/routes/index.tsx::Route - validates URL search, loads authenticated dashboard and corrects page bounds
- Where: src/routes/index.tsx::Home - navigates query state and invalidates after task changes
- Where: src/server/todo.server.ts::getTodoDashboard - validates and serves dashboard query
