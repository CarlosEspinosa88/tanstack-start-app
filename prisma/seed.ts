import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: 'demo@todo.dev'
    },
    update: {},
    create: {
      email: 'demo@todo.dev',
      name: 'Demo User',
      role: 'user'
    },
  })
  
  await prisma.todo.create({
    data: { 
      title: 'Primer TODO (seed)',
      userId: user.id
    }
  })
}

main().finally(() => prisma.$disconnect())