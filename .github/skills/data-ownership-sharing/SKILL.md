---
name: data-ownership-sharing
description: Procedure for implementing or reviewing todo ownership, shared-board viewing, invitations, responses, revocations, and cross-user access.
---

# Data ownership and board-sharing rules

## Existing authorization model

- A Todo belongs to one User through `Todo.userId`.
- Todo reads and writes in the Prisma repository are scoped by `userId`.
- BoardShare links `ownerId` and `recipientId`, with PENDING, ACCEPTED, DECLINED, and REVOKED states.
- A viewer can access another user's board only when an accepted share exists.
- The current shared-board path is for viewing; do not infer permission to mutate another owner's todos.

## Before implementation

1. Identify the authenticated actor independently of browser-provided IDs.
2. Identify the owner of the target data and the exact action being requested.
3. Write an authorization matrix for owner, invited recipient, unrelated user, pending invitation, declined/revoked invitation.
4. Trace every read, single-row mutation, bulk mutation, and aggregation path. Include filters, pagination, counts, and activity queries.
5. Consider IDOR, ownership changes, duplicate invitations, invitation replay, race conditions, revocation during a request, and enumeration of account/email existence.

## Implementation

- Keep ownership constraints in the data query itself (for example, `where: { id, userId }`), not only in an earlier UI or route check.
- For shared reads, use the accepted-share check and constrain the queried board to the authorized owner.
- For invitation response, require the current recipient and PENDING status.
- For revocation, require the owner and the currently accepted share.
- Bound and deduplicate bulk ID arrays; report counts without leaking records the actor cannot access.
- Prefer consistent not-found behavior where revealing resource existence would leak another user's data.
- Use transactions or conditional updates for state transitions that must be atomic.

## Tests

Cover owner access, accepted viewer access, pending/declined/revoked access, unrelated users, cross-user mutation attempts, bulk operations, duplicate invitations, repeated responses, and concurrent state changes as relevant.
