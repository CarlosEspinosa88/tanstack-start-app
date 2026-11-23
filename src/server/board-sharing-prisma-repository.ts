import type { PrismaClient } from '../../generated/client'
import type {
  BoardSharingRepository,
} from './board-sharing'

export function createBoardSharingRepository(
  prisma: PrismaClient,
): BoardSharingRepository {
  return {
    findUserByEmail: async (email) => {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true },
      })
      return user
    },
    findShare: async (ownerId, recipientId) => {
      const share = await prisma.boardShare.findUnique({
        where: { ownerId_recipientId: { ownerId, recipientId } },
        select: { id: true, status: true },
      })
      return share
    },
    createShare: async (ownerId, recipientId) => {
      await prisma.boardShare.create({ data: { ownerId, recipientId } })
    },
    resetShareToPending: async (id) => {
      const result = await prisma.boardShare.updateMany({
        where: {
          id,
          status: { in: ['DECLINED', 'REVOKED'] },
        },
        data: { status: 'PENDING' },
      })
      return result.count > 0
    },
    listOwnerShares: (ownerId) =>
      prisma.boardShare.findMany({
        where: { ownerId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          recipient: { select: { id: true, email: true, name: true } },
        },
      }).then((shares) =>
        shares.map(({ recipient, ...share }) => ({
          ...share,
          user: recipient,
        })),
      ),
    listPendingInvitations: (recipientId) =>
      prisma.boardShare.findMany({
        where: { recipientId, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      }).then((shares) =>
        shares.map(({ owner, ...share }) => ({ ...share, user: owner })),
      ),
    listAcceptedBoards: (recipientId) =>
      prisma.boardShare.findMany({
        where: { recipientId, status: 'ACCEPTED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      }).then((shares) =>
        shares.map(({ owner, ...share }) => ({ ...share, user: owner })),
      ),
    respondToInvitation: async (id, recipientId, status) => {
      const result = await prisma.boardShare.updateMany({
        where: { id, recipientId, status: 'PENDING' },
        data: { status },
      })
      return result.count > 0
    },
    revokeShare: async (id, ownerId) => {
      const result = await prisma.boardShare.updateMany({
        where: { id, ownerId, status: 'ACCEPTED' },
        data: { status: 'REVOKED' },
      })
      return result.count > 0
    },
    canViewBoard: async (ownerId, recipientId) =>
      Boolean(
        await prisma.boardShare.findFirst({
          where: { ownerId, recipientId, status: 'ACCEPTED' },
          select: { id: true },
        }),
      ),
  }
}
