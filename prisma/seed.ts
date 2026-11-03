import { PrismaClient } from '../generated/client'
import mockData from '../src/data/mock-data.json'

const prisma = new PrismaClient()

async function main() {
  const users = await Promise.all(
    mockData.users.map((sampleUser) =>
      prisma.user.upsert({
        where: { email: sampleUser.email },
        update: {},
        create: {
          email: sampleUser.email,
          name: sampleUser.name,
          googleId: sampleUser.googleId,
          role: sampleUser.role,
        },
      }),
    ),
  )

  const userIds = new Map(
    mockData.users.map(
      (sampleUser, index): [string, string] => [
        sampleUser.id,
        users[index].id,
      ],
    ),
  )

  await prisma.$transaction(
    mockData.todos.map((todo) => {
      const userId = userIds.get(todo.userId)
      if (!userId) {
        throw new Error(`No seeded user found for todo ${todo.id}`)
      }

      return prisma.todo.upsert({
        where: { id: todo.id },
        update: {
          title: todo.title,
          done: todo.done,
          userId,
          createdAt: new Date(todo.createdAt),
        },
        create: {
          id: todo.id,
          title: todo.title,
          done: todo.done,
          userId,
          createdAt: new Date(todo.createdAt),
        },
      })
    }),
  })
}

main()
  .catch((error: unknown) => {
    console.error('Failed to seed sample data:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())