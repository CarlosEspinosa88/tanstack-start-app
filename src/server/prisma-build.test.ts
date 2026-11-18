import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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

test('postbuild packages the Prisma engine beside Nitro server chunks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'prisma-engine-build-'))
  const engineFile = 'libquery_engine-rhel-openssl-3.0.x.so.node'
  const outputDirectories = [
    '.vercel/output/functions/__fallback.func',
    '.output/server',
  ]

  try {
    await mkdir(join(directory, 'generated'), { recursive: true })
    await writeFile(
      join(directory, 'generated/client.ts'),
      `path.join(__dirname, "${engineFile}")`,
    )
    await writeFile(join(directory, 'generated', engineFile), 'query engine')

    for (const outputDirectory of outputDirectories) {
      const serverDirectory = join(directory, outputDirectory)
      await mkdir(join(serverDirectory, 'chunks/build'), { recursive: true })
      await writeFile(join(serverDirectory, 'index.mjs'), '')
    }

    execFileSync(
      process.execPath,
      [
        fileURLToPath(
          new URL('../../scripts/copy-prisma-engine.mjs', import.meta.url),
        ),
      ],
      { cwd: directory },
    )

    for (const outputDirectory of outputDirectories) {
      assert.equal(
        await readFile(
          join(directory, outputDirectory, 'chunks/build', engineFile),
          'utf8',
        ),
        'query engine',
      )
    }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
