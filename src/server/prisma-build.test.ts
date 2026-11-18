import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('production builds regenerate Prisma Client for the deployment platform', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  )

  assert.equal(
    packageJson.scripts.prebuild,
    'DATABASE_URL=${DATABASE_URL:-postgresql://localhost:5432/placeholder?schema=public} prisma generate',
  )
  assert.equal(packageJson.scripts.postbuild, 'node scripts/copy-prisma-engine.mjs')
})
