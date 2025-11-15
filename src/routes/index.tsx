import * as fs from 'node:fs'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'

const filePath = 'count.txt'

const loggingMiddleware = createMiddleware().server(async ({ next, context, request }) => {
  console.log('Request URL:', request.url)
  console.log('context:', context)
  const response = await next()
  console.log('Response Status:', response)
  return response
})

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
  )
}

// midelware passed to server functions
const getCount = createServerFn({
  method: 'GET',
})
.middleware([loggingMiddleware])
.handler(() => {
  return readCount()
})

const updateCount = createServerFn({ method: 'POST' })
  .inputValidator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount()
    await fs.promises.writeFile(filePath, `${count + data}`)
  })


// new route for "/"
// uses getCount server function as loader
// applies loggingMiddleware to server functions

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => await getCount(),
  server: {
    // middleware: [loggingMiddleware],
    // handlers: {
    //   GET: async ({ request }) => {
    //     return new Response('Hello from the GET / route!')
    //   },
    // }
  }
})

function Home() {
  const router = useRouter()
  const state = Route.useLoaderData()

  return (
    <button
      type="button"
      onClick={() => {
        updateCount({ data: 1 }).then(() => {
          router.invalidate()
        })
      }}
    >
      Add 1 to {state}?
    </button>
  )
}