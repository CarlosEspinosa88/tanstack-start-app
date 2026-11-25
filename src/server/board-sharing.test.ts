import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ensureBoardViewAccess,
  inviteToBoard,
  respondToBoardInvitation,
  revokeBoardShare,
  type BoardShareRole,
  type BoardShareStatus,
  type BoardSharingRepository,
} from './board-sharing'
import {
  InviteToBoardInput,
  RespondToBoardInvitationInput,
  RevokeBoardShareInput,
} from './board-sharing.validation'

function createRepository(
  overrides: Partial<BoardSharingRepository> = {},
) {
  const calls: {
    email?: string
    created?: [string, string, BoardShareRole]
    reset?: [string, BoardShareRole]
    response?: [string, string, 'ACCEPTED' | 'DECLINED']
    revoke?: [string, string]
  } = {}
  let existingShare: { id: string; status: BoardShareStatus } | null = null
  const repository: BoardSharingRepository = {
    findUserByEmail: async (email) => {
      calls.email = email
      return email === 'invitee@example.com' ? { id: 'user-b' } : null
    },
    findShare: async () => existingShare,
    createShare: async (ownerId, recipientId, role) => {
      calls.created = [ownerId, recipientId, role]
    },
    resetShareToPending: async (id, role) => {
      calls.reset = [id, role]
      return true
    },
    listOwnerShares: async () => [],
    listPendingInvitations: async () => [],
    listAcceptedBoards: async () => [],
    respondToInvitation: async (id, recipientId, status) => {
      calls.response = [id, recipientId, status]
      return true
    },
    revokeShare: async (id, ownerId) => {
      calls.revoke = [id, ownerId]
      return true
    },
    canViewBoard: async () => false,
    ...overrides,
  }

  return {
    repository,
    calls,
    setExistingShare: (share: { id: string; status: BoardShareStatus } | null) => {
      existingShare = share
    },
  }
}

test('board invitations resolve the recipient account and normalize email', async () => {
  const { repository, calls } = createRepository()

  await inviteToBoard(repository, 'user-a', ' Invitee@Example.com ', 'EDITOR')

  assert.equal(calls.email, 'invitee@example.com')
  assert.deepEqual(calls.created, ['user-a', 'user-b', 'EDITOR'])
})

test('board invitations reject unknown users, self-invites, and duplicates', async () => {
  const { repository, setExistingShare } = createRepository()
  const selfRepository = createRepository({
    findUserByEmail: async () => ({ id: 'user-a' }),
  }).repository

  await assert.rejects(
    inviteToBoard(repository, 'user-a', 'missing@example.com', 'VIEWER'),
    { message: 'No account was found for that email address' },
  )
  await assert.rejects(
    inviteToBoard(selfRepository, 'user-a', 'owner@example.com', 'VIEWER'),
    { message: 'You cannot invite yourself' },
  )

  setExistingShare({ id: 'share-1', status: 'PENDING' })
  await assert.rejects(
    inviteToBoard(repository, 'user-a', 'invitee@example.com', 'VIEWER'),
    { message: 'An invitation is already pending for that user' },
  )
  setExistingShare({ id: 'share-1', status: 'ACCEPTED' })
  await assert.rejects(
    inviteToBoard(repository, 'user-a', 'invitee@example.com', 'VIEWER'),
    { message: 'This board is already shared with that user' },
  )
})

test('declined or revoked invitations can be sent again', async () => {
  const { repository, calls, setExistingShare } = createRepository()
  setExistingShare({ id: 'share-1', status: 'DECLINED' })

  await inviteToBoard(repository, 'user-a', 'invitee@example.com', 'EDITOR')

  assert.deepEqual(calls.reset, ['share-1', 'EDITOR'])
})

test('board access requires an accepted share and always allows its owner', async () => {
  const { repository } = createRepository({
    canViewBoard: async (ownerId, viewerId) =>
      ownerId === 'user-a' && viewerId === 'user-b',
  })

  await ensureBoardViewAccess(repository, 'user-a', 'user-a')
  await ensureBoardViewAccess(repository, 'user-a', 'user-b')
  await assert.rejects(
    ensureBoardViewAccess(repository, 'user-a', 'user-c'),
    { message: 'Board not found' },
  )
})

test('invitation responses and revocation include the authenticated user id', async () => {
  const { repository, calls } = createRepository()

  await respondToBoardInvitation(repository, 'user-b', 'share-1', 'ACCEPTED')
  await revokeBoardShare(repository, 'user-a', 'share-1')

  assert.deepEqual(calls.response, ['share-1', 'user-b', 'ACCEPTED'])
  assert.deepEqual(calls.revoke, ['share-1', 'user-a'])
})

test('board sharing inputs validate email and invitation state changes', () => {
  assert.deepEqual(
    InviteToBoardInput.parse({ email: ' person@example.com ' }),
    { email: 'person@example.com', role: 'VIEWER' },
  )
  assert.deepEqual(
    InviteToBoardInput.parse({
      email: 'person@example.com',
      role: 'EDITOR',
    }),
    { email: 'person@example.com', role: 'EDITOR' },
  )
  assert.equal(InviteToBoardInput.safeParse({ email: 'not-an-email' }).success, false)
  assert.equal(
    RespondToBoardInvitationInput.safeParse({
      id: 'share-1',
      status: 'ACCEPTED',
    }).success,
    true,
  )
  assert.equal(
    RespondToBoardInvitationInput.safeParse({
      id: 'share-1',
      status: 'PENDING',
    }).success,
    false,
  )
  assert.equal(RevokeBoardShareInput.safeParse({ id: 'share-1' }).success, true)
  assert.equal(RevokeBoardShareInput.safeParse({ id: '' }).success, false)
})
