import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../generated/client'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const jwtSecret = process.env.JWT_SECRET ?? 'playwright-test-session-secret'

test.describe('authenticated dashboard', () => {
  test.skip(!testDatabaseUrl, 'Set TEST_DATABASE_URL to run dashboard browser tests')
  test.describe.configure({ mode: 'serial' })

  let prisma: PrismaClient | undefined
  let userId = ''
  let sessionToken = ''
  let taskTitle = ''

  test.beforeAll(async () => {
    if (!testDatabaseUrl) {
      return
    }

    prisma = new PrismaClient({ datasources: { db: { url: testDatabaseUrl } } })
    const suffix = randomUUID()
    const user = await prisma.user.create({
      data: {
        email: `playwright-${suffix}@todo.dev`,
        googleId: `playwright-${suffix}`,
      },
    })
    userId = user.id
    sessionToken = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '30m' },
    )
  })

  test.afterAll(async () => {
    if (prisma) {
      if (userId) {
        await prisma.todo.deleteMany({ where: { userId } })
        await prisma.user.delete({ where: { id: userId } })
      }
      await prisma.$disconnect()
    }
  })

  test.beforeEach(async ({ page }) => {
    if (!prisma || !userId) {
      return
    }

    taskTitle = `e2e-${randomUUID()}`
    await prisma.todo.create({ data: { title: taskTitle, userId } })
    await page.context().addCookies([
      {
        name: 'session',
        value: sessionToken,
        url: 'http://127.0.0.1:4173',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
  })

  test('dashboard remains keyboard-accessible without overflow across viewports', async ({
    page,
  }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to tasks' })).toBeFocused()
    await expect(page.getByRole('heading', { name: 'Your tasks' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toBeVisible()
    await expect(
      page.getByRole('checkbox', { name: 'Select all tasks on this page' }),
    ).toBeVisible()
    await expect(page.getByLabel('Activity period')).toBeVisible()

    for (const viewport of [
      { width: 1280, height: 900 },
      { width: 375, height: 812 },
    ]) {
      await page.setViewportSize(viewport)
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalOverflow).toBe(false)
    }
  })

  test('search and reporting period are persisted in the URL', async ({ page }) => {
    await page.goto('/')
    const search = page.getByRole('searchbox', { name: 'Search tasks' })
    await search.fill(taskTitle)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page).toHaveURL(new RegExp(`search=${taskTitle}`))
    await expect(page.locator('.task-row').filter({ hasText: taskTitle })).toBeVisible()

    await page.getByRole('button', { name: 'Clear task search' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('search'))
      .toBeFalsy()

    await page.getByLabel('Activity period').selectOption('30d')
    await expect.poll(() => new URL(page.url()).searchParams.get('period')).toBe('30d')
    await expect(
      page.getByRole('img', { name: 'Daily tasks created over the last 30 days' }),
    ).toBeVisible()
  })

  test('selected tasks can be completed and deleted in bulk', async ({ page }) => {
    await page.goto('/')
    const row = page.locator('.task-row').filter({ hasText: taskTitle })
    await row.getByRole('checkbox', { name: `Select task: ${taskTitle}` }).check()
    await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
    await expect(row.getByText('Completed')).toBeVisible()

    await row.getByRole('checkbox', { name: `Select task: ${taskTitle}` }).check()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete selected' }).click()
    await expect(row).toHaveCount(0)
  })
})
