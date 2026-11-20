import { defineConfig, devices } from '@playwright/test'

const port = 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        process.env.DATABASE_URL ??
        'postgresql://localhost:5432/placeholder?schema=public',
      JWT_SECRET: process.env.JWT_SECRET ?? 'playwright-test-session-secret',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? 'playwright-test-client',
      GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET ?? 'playwright-test-secret',
      GOOGLE_REDIRECT_URI:
        process.env.GOOGLE_REDIRECT_URI ??
        `http://127.0.0.1:${port}/auth/callback`,
    },
  },
})
