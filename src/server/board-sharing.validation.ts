import { z } from 'zod'

export const InviteToBoardInput = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  role: z.enum(['VIEWER', 'EDITOR']).default('VIEWER'),
})

export const RespondToBoardInvitationInput = z.object({
  id: z.string().min(1),
  status: z.enum(['ACCEPTED', 'DECLINED']),
})

export const RevokeBoardShareInput = z.object({
  id: z.string().min(1),
})
