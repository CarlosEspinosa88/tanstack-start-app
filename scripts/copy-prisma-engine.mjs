import { copyFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const generatedDirectory = 'generated'
const clientSource = await readFile(join(generatedDirectory, 'client.ts'), 'utf8')
const engineFile = clientSource.match(/libquery_engine-[^"]+\.node/)?.[0]

if (!engineFile) {
  throw new Error('Could not determine the generated Prisma query engine file')
}

const sourcePath = join(generatedDirectory, engineFile)
const outputDirectories = [
  '.vercel/output/functions/__fallback.func',
  '.output/server',
].filter((directory) => existsSync(join(directory, 'index.mjs')))

if (outputDirectories.length === 0) {
  throw new Error('Could not find a built Nitro server output to package Prisma Client')
}

await Promise.all(
  outputDirectories.map(async (directory) => {
    const engineDirectory = join(directory, 'chunks', 'build')

    if (!existsSync(engineDirectory)) {
      throw new Error(`Could not find Nitro server chunks in ${directory}`)
    }

    await copyFile(sourcePath, join(engineDirectory, engineFile))
    console.info(`Packaged Prisma query engine in ${engineDirectory}`)
  }),
)
