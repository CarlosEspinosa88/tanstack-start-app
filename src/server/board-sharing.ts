export type BoardShareStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED'
export type BoardShareRole = 'VIEWER' | 'EDITOR'

export type BoardShareSummary = {
  id: string
  status: BoardShareStatus
  role: BoardShareRole
  createdAt: Date
  user: { id: string; email: string; name: string | null }
}

export type BoardSharingRepository = {
  findUserByEmail(email: string): Promise<{ id: string } | null>
  findShare(ownerId: string, recipientId: string): Promise<{
    id: string
    status: BoardShareStatus
  } | null>
  createShare(
    ownerId: string,
    recipientId: string,
    role: BoardShareRole,
  ): Promise<void>
  resetShareToPending(id: string, role: BoardShareRole): Promise<boolean>
  listOwnerShares(ownerId: string): Promise<BoardShareSummary[]>
  listPendingInvitations(recipientId: string): Promise<BoardShareSummary[]>
  listAcceptedBoards(recipientId: string): Promise<BoardShareSummary[]>
  respondToInvitation(
    id: string,
    recipientId: string,
    status: 'ACCEPTED' | 'DECLINED',
  ): Promise<boolean>
  revokeShare(id: string, ownerId: string): Promise<boolean>
  canViewBoard(ownerId: string, recipientId: string): Promise<boolean>
}

export async function inviteToBoard(
  repository: BoardSharingRepository,
  ownerId: string,
  email: string,
  role: BoardShareRole,
) {
  const recipient = await repository.findUserByEmail(email.trim().toLowerCase())

  if (!recipient) {
    throw new Error('No account was found for that email address')
  }

  if (recipient.id === ownerId) {
    throw new Error('You cannot invite yourself')
  }

  const existingShare = await repository.findShare(ownerId, recipient.id)

  if (existingShare?.status === 'ACCEPTED') {
    throw new Error('This board is already shared with that user')
  }

  if (existingShare?.status === 'PENDING') {
    throw new Error('An invitation is already pending for that user')
  }

  if (existingShare) {
    const reset = await repository.resetShareToPending(existingShare.id, role)

    if (!reset) {
      throw new Error('Could not send the invitation. Please try again')
    }

    return
  }

  await repository.createShare(ownerId, recipient.id, role)
}

export function getBoardSharingData(
  repository: BoardSharingRepository,
  userId: string,
) {
  return Promise.all([
    repository.listOwnerShares(userId),
    repository.listPendingInvitations(userId),
    repository.listAcceptedBoards(userId),
  ]).then(([sentInvitations, receivedInvitations, sharedBoards]) => ({
    sentInvitations,
    receivedInvitations,
    sharedBoards,
  }))
}

export async function ensureBoardViewAccess(
  repository: BoardSharingRepository,
  ownerId: string,
  viewerId: string,
) {
  if (ownerId !== viewerId && !(await repository.canViewBoard(ownerId, viewerId))) {
    throw new Error('Board not found')
  }
}

export async function respondToBoardInvitation(
  repository: BoardSharingRepository,
  recipientId: string,
  id: string,
  status: 'ACCEPTED' | 'DECLINED',
) {
  const updated = await repository.respondToInvitation(id, recipientId, status)

  if (!updated) {
    throw new Error('Invitation not found')
  }
}

export async function revokeBoardShare(
  repository: BoardSharingRepository,
  ownerId: string,
  id: string,
) {
  const revoked = await repository.revokeShare(id, ownerId)

  if (!revoked) {
    throw new Error('Board share not found')
  }
}
