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
  let sharedOwnerId = ''
  let viewerOwnerId = ''
  let emptyOwnerId = ''
  let sessionToken = ''
  let taskTitle = ''
  let sharedTaskTitle = ''
  let viewerTaskTitle = ''

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
    const ownerSuffix = randomUUID()
    const owner = await prisma.user.create({
      data: {
        email: `playwright-owner-${ownerSuffix}@todo.dev`,
        googleId: `playwright-owner-${ownerSuffix}`,
      },
    })
    sharedOwnerId = owner.id
    sharedTaskTitle = `shared-e2e-${randomUUID()}`
    await prisma.todo.create({
      data: { title: sharedTaskTitle, userId: sharedOwnerId },
    })
    await prisma.boardShare.create({
      data: {
        ownerId: sharedOwnerId,
        recipientId: userId,
        status: 'ACCEPTED',
        role: 'EDITOR',
      },
    })
    const viewerOwnerSuffix = randomUUID()
    const viewerOwner = await prisma.user.create({
      data: {
        email: `playwright-viewer-owner-${viewerOwnerSuffix}@todo.dev`,
        googleId: `playwright-viewer-owner-${viewerOwnerSuffix}`,
      },
    })
    viewerOwnerId = viewerOwner.id
    viewerTaskTitle = `viewer-e2e-${randomUUID()}`
    await prisma.todo.create({
      data: { title: viewerTaskTitle, userId: viewerOwnerId },
    })
    await prisma.boardShare.create({
      data: {
        ownerId: viewerOwnerId,
        recipientId: userId,
        status: 'ACCEPTED',
        role: 'VIEWER',
      },
    })
    const emptyOwnerSuffix = randomUUID()
    const emptyOwner = await prisma.user.create({
      data: {
        email: `playwright-empty-owner-${emptyOwnerSuffix}@todo.dev`,
        googleId: `playwright-empty-owner-${emptyOwnerSuffix}`,
      },
    })
    emptyOwnerId = emptyOwner.id
    await prisma.boardShare.create({
      data: {
        ownerId: emptyOwnerId,
        recipientId: userId,
        status: 'ACCEPTED',
        role: 'VIEWER',
      },
    })
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
      if (sharedOwnerId) {
        await prisma.todo.deleteMany({ where: { userId: sharedOwnerId } })
        await prisma.user.delete({ where: { id: sharedOwnerId } })
      }
      if (viewerOwnerId) {
        await prisma.todo.deleteMany({ where: { userId: viewerOwnerId } })
        await prisma.user.delete({ where: { id: viewerOwnerId } })
      }
      if (emptyOwnerId) {
        await prisma.todo.deleteMany({ where: { userId: emptyOwnerId } })
        await prisma.user.delete({ where: { id: emptyOwnerId } })
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

  test('tasks route requires an authenticated session', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/tasks')
    await expect(page).toHaveURL(/\/login/)
  })

  test('dashboard remains keyboard-accessible without overflow across viewports', async ({
    page,
  }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to tasks' })).toBeFocused()
    await expect(page.getByRole('link', { name: 'My tasks' })).toBeVisible()
    await expect(page.getByLabel('Activity period')).toBeVisible()
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Your tasks' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: 'Search tasks' })).toBeVisible()
    await expect(
      page.getByRole('checkbox', { name: 'Select all tasks on this page' }),
    ).toBeVisible()

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
    await page.goto('/tasks')
    const search = page.getByRole('searchbox', { name: 'Search tasks' })
    await search.fill(taskTitle)
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`search=${taskTitle}`))
    await expect(page.locator('.task-row').filter({ hasText: taskTitle })).toBeVisible()

    await page.getByRole('button', { name: 'Clear task search' }).click()
    await expect
      .poll(() => new URL(page.url()).searchParams.get('search'))
      .toBeFalsy()

    await page.goto('/')
    await page.getByLabel('Activity period').selectOption('30d')
    await expect.poll(() => new URL(page.url()).searchParams.get('period')).toBe('30d')
    await expect(
      page.getByRole('img', { name: 'Daily tasks created over the last 30 days' }),
    ).toBeVisible()
    await expect(page.locator('.chart[data-period="30d"] .chart-column')).toHaveCount(30)
    await page.reload()
    await expect(page.getByLabel('Activity period')).toHaveValue('30d')
    await page.getByLabel('Activity period').selectOption('7d')
    await expect.poll(() => new URL(page.url()).searchParams.get('period')).toBe('7d')
    await expect(page.locator('.chart[data-period="7d"] .chart-column')).toHaveCount(7)
  })

  test('task navigation preserves the board and keeps rows off the dashboard', async ({
    page,
  }) => {
    await page.goto(`/?board=${sharedOwnerId}`)
    await page.getByRole('link', { name: 'My tasks', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/tasks\\?.*board=${sharedOwnerId}`))
    const sharedRow = page.locator('.task-row').filter({ hasText: sharedTaskTitle })
    await expect(sharedRow).toBeVisible()
    await sharedRow.getByRole('checkbox', { name: `Select task: ${sharedTaskTitle}` }).check()
    await expect(page.getByRole('button', { name: 'Mark complete', exact: true })).toBeVisible()
    await page.getByLabel('Choose a board').selectOption({ label: 'My board' })
    await expect.poll(() => new URL(page.url()).searchParams.get('board')).toBeNull()
    await expect(page.getByRole('heading', { name: 'Your task manager' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark complete', exact: true })).toHaveCount(0)
    await page.getByLabel('Choose a board').selectOption(sharedOwnerId)
    await expect(page).toHaveURL(new RegExp(`/tasks\\?.*board=${sharedOwnerId}`))
    await expect(sharedRow).toBeVisible()

    await page.getByRole('link', { name: 'Overview', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/\\?.*board=${sharedOwnerId}`))
    await expect(page.locator('.task-row')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Open task manager' })).toBeVisible()
  })

  test('task filters and pagination remain URL-backed', async ({ page }) => {
    if (!prisma || !userId) {
      return
    }

    const prefix = `pagination-e2e-${randomUUID()}`
    await prisma.todo.createMany({
      data: Array.from({ length: 21 }, (_, index) => ({
        title: `${prefix}-${index}`,
        userId,
      })),
    })

    await page.goto(`/tasks?status=open&search=${prefix}`)
    await expect(
      page.getByRole('button', { name: /In progress/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('Page 1 of 2')).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.getByText('Page 2 of 2')).toBeVisible()
    await expect(page.locator('.task-row')).toHaveCount(1)
  })

  test('calendar navigates months and filters the whole board while preserving URL context', async ({ page }) => {
      assert.ok(prisma)
      const prefix = `calendar-${randomUUID()}`
      await prisma.todo.createMany({
        data: Array.from({ length: 21 }, (_, index) => ({
          title: `${prefix}-${index}`, userId, dueDate: new Date('2024-02-29T00:00:00.000Z'),
        })),
      })
      await page.goto(`/?month=2024-01&status=open&search=${prefix}&period=30d`)
      const calendar = page.getByRole('region', { name: 'Task due date calendar' })
      await expect(calendar.getByText('No tasks due this month.')).toBeVisible()
      await calendar.getByRole('button', { name: 'Next month' }).click()
      await expect(calendar.getByText('February 2024')).toBeVisible()
      const day = calendar.getByRole('button', { name: 'Thursday, February 29, 2024, 21 tasks due' })
      await day.focus()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/tasks\?/)
      await expect.poll(() => new URL(page.url()).searchParams.get('dueDate')).toBe('2024-02-29')
      await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe(prefix)
      await expect.poll(() => new URL(page.url()).searchParams.get('period')).toBe('30d')
      await expect(day).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByText('Page 1 of 2')).toBeVisible()
      await page.getByRole('button', { name: 'Next', exact: true }).click()
      await expect(page.locator('.task-row')).toHaveCount(1)
      await calendar.getByRole('button', { name: 'Friday, February 23, 2024, 0 tasks due' }).click()
      await expect(page.getByText('No tasks match this view.')).toBeVisible()
      await calendar.getByRole('button', { name: 'Clear date' }).click()
      await expect.poll(() => new URL(page.url()).searchParams.get('dueDate')).toBeNull()
      await expect(page.getByText('Page 1 of 2')).toBeVisible()
      await calendar.getByRole('button', { name: 'Previous month' }).click()
      await expect(calendar.getByText('January 2024')).toBeVisible()
  })

  test('calendar respects shared viewer access and keeps controls read-only', async ({ page }) => {
      assert.ok(prisma)
      await prisma.todo.updateMany({
        where: { userId: viewerOwnerId },
        data: { dueDate: new Date('2024-12-31T00:00:00.000Z') },
      })
      await page.goto(`/tasks?board=${viewerOwnerId}&month=2024-12`)
      const calendar = page.getByRole('region', { name: 'Task due date calendar' })
      await calendar.getByRole('button', { name: 'Tuesday, December 31, 2024, 1 task due' }).click()
      await expect.poll(() => new URL(page.url()).searchParams.get('board')).toBe(viewerOwnerId)
      await expect(page.locator('.task-row').filter({ hasText: viewerTaskTitle })).toBeVisible()
      await expect(page.getByPlaceholder('Add a task')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0)
      await calendar.getByRole('button', { name: 'Next month' }).click()
      await expect(calendar.getByText('January 2025')).toBeVisible()
      await expect(calendar.getByText('No tasks due this month.')).toBeVisible()
      await page.goto('/tasks?board=not-a-real-board&month=2024-12&dueDate=2024-12-31')
      await expect(page.getByRole('heading', { name: 'Tasks are unavailable' })).toBeVisible()
  })

  test('editing a selected task out of a date view clears bulk selection', async ({ page }) => {
    assert.ok(prisma)
    await prisma.todo.updateMany({
      where: { userId, title: taskTitle },
      data: { dueDate: new Date('2024-02-29T00:00:00.000Z') },
    })
    await page.goto(`/tasks?dueDate=2024-02-29&search=${taskTitle}`)
    const row = page.locator('.task-row').filter({ hasText: taskTitle })
    await row.getByRole('checkbox', { name: `Select task: ${taskTitle}` }).check()
    await row.getByRole('button', { name: 'Edit', exact: true }).click()
    await page.getByLabel(`Due date for task: ${taskTitle}`).fill('2024-03-01')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(row).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Delete selected' })).toHaveCount(0)
    const calendar = page.getByRole('region', { name: 'Task due date calendar' })
    await calendar.getByRole('button', { name: 'Clear date' }).click()
    await expect(calendar.getByText('February 2024')).toBeVisible()
    await expect(row).toBeVisible()
  })

  test('empty boards and filtered no-result states are distinct', async ({ page }) => {
    await page.goto('/tasks?search=definitely-not-a-task')
    await expect(page.getByText('No tasks match this view.')).toBeVisible()

    await page.goto(`/tasks?board=${emptyOwnerId}`)
    await expect(page.getByText('This board has no tasks yet.')).toBeVisible()
    await expect(page.getByPlaceholder('Add a task')).toHaveCount(0)
  })

  test('task loader can be retried after a transient navigation failure', async ({ page }) => {
    let retryAttempt = 0
    await page.route('**/tasks*', async (route) => {
      retryAttempt += 1
      if (retryAttempt === 1) {
        await route.continue()
        return
      }

      const successUrl = new URL(route.request().url())
      successUrl.searchParams.delete('board')
      const response = await route.fetch({ url: successUrl.toString() })
      await route.fulfill({
        body: await response.body(),
        headers: response.headers(),
        status: response.status(),
      })
    })
    await page.goto('/tasks?board=not-a-real-board')
    await expect(page.getByRole('heading', { name: 'Tasks are unavailable' })).toBeVisible()
    await page.evaluate(() => window.history.replaceState({}, '', '/tasks'))
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('heading', { name: 'Your tasks' })).toBeVisible()
  })

  test('mutation failures are shown without a success-shaped update', async ({ page }) => {
    await page.goto('/tasks')
    const row = page.locator('.task-row').filter({ hasText: taskTitle })
    await expect(row.getByRole('checkbox', { name: `Select task: ${taskTitle}` })).toBeEnabled()
    await page.route('**/*', (route) => {
      if (route.request().method() !== 'GET') {
        return route.abort()
      }
      return route.continue()
    })
    const toggleButton = row.getByRole('button', { name: `Mark complete: ${taskTitle}` })
    await toggleButton.click()
    await expect(page.getByRole('alert')).toHaveText('Could not update your task. Please try again.')
    await expect(row.getByText('In progress')).toBeVisible()
    await page.unroute('**/*')
  })

  test.describe('before hydration', () => {
    test.use({ javaScriptEnabled: false })

    test('activity period is disabled', async ({ page }) => {
      await page.goto('/')
      await expect(page.getByLabel('Activity period')).toBeDisabled()
    })

    test('interactive task controls are disabled', async ({ page }) => {
      assert.ok(prisma)
      const prefix = `unhydrated-pagination-${randomUUID()}`
      await prisma.todo.createMany({
        data: Array.from({ length: 21 }, (_, index) => ({
          title: `${prefix}-${index}`,
          userId,
        })),
      })
      await page.goto(`/tasks?search=${prefix}`)
      await expect(
        page.getByRole('checkbox', { name: 'Select all tasks on this page' }),
      ).toBeDisabled()
      await expect(page.getByRole('checkbox', { name: `Select task: ${prefix}`, exact: false }).first()).toBeDisabled()
      await expect(page.getByRole('button', { name: /In progress/ })).toBeDisabled()
      await expect(page.getByText('Page 1 of 2')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
    })
  })

  test('selected tasks can be completed and deleted in bulk', async ({ page }) => {
    await page.goto('/tasks')
    const row = page.locator('.task-row').filter({ hasText: taskTitle })
    await row.getByRole('checkbox', { name: `Select task: ${taskTitle}` }).check()
    await page.getByRole('button', { name: 'Mark complete', exact: true }).click()
    await expect(row.getByText('Completed')).toBeVisible()

    await row.getByRole('checkbox', { name: `Select task: ${taskTitle}` }).check()
    page.once('dialog', (dialog) => dialog.accept())
    await page.getByRole('button', { name: 'Delete selected' }).click()
    await expect(row).toHaveCount(0)
  })

  test('editors can create, edit, complete, and delete shared-board tasks', async ({
    page,
  }) => {
    await page.goto(`/tasks?board=${sharedOwnerId}`)

    await expect(
      page.getByText('You can create, edit, complete, and delete tasks on this board.'),
    ).toBeVisible()

    const originalRow = page.locator('.task-row').filter({ hasText: sharedTaskTitle })
    await expect(originalRow).toBeVisible()
    await expect(
      originalRow.getByRole('checkbox', { name: `Select task: ${sharedTaskTitle}` }),
    ).toBeEnabled()
    await originalRow.getByRole('button', { name: 'Edit', exact: true }).click()
    await page
      .getByRole('textbox', { name: `Edit task: ${sharedTaskTitle}` })
      .fill('Updated shared task')
    await page.getByRole('button', { name: 'Save' }).click()
    const editedRow = page.locator('.task-row').filter({ hasText: 'Updated shared task' })
    await expect(editedRow).toBeVisible()
    await editedRow.getByRole('button', { name: 'Mark complete: Updated shared task' }).click()
    await expect(editedRow.getByText('Completed')).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())
    await editedRow.getByRole('button', { name: 'Delete' }).click()
    await expect(editedRow).toHaveCount(0)

    await page.getByPlaceholder('Add a task').fill('New shared task')
    await page.getByRole('button', { name: 'Add task' }).click()
    await expect(page.locator('.task-row').filter({ hasText: 'New shared task' })).toBeVisible()
  })

  test('viewers see shared tasks without mutation controls', async ({ page }) => {
    await page.goto(`/tasks?board=${viewerOwnerId}`)

    await expect(
      page.getByText('These tasks are visible to you but cannot be changed.'),
    ).toBeVisible()
    await expect(page.getByPlaceholder('Add a task')).toHaveCount(0)

    const row = page.locator('.task-row').filter({ hasText: viewerTaskTitle })
    await expect(row).toBeVisible()
    await expect(row.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0)
    await expect(row.getByRole('button', { name: 'Delete', exact: true })).toHaveCount(0)
    await expect(
      row.getByRole('checkbox', { name: `Select task: ${viewerTaskTitle}` }),
    ).toHaveCount(0)
  })
})
