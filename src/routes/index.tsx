import * as fs from 'node:fs'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getTodos } from '../server/todo.server'

// const filePath = 'count.txt'

// const loggingMiddleware = createMiddleware().server(async ({ next, context, request }) => {
//   console.log('Request URL:', request.url)
//   console.log('context:', context)
//   const response = await next()
//   console.log('Response Status:', response)
//   return response
// })

// async function readCount() {
//   return parseInt(
//     await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'),
//   )
// }

// midelware passed to server functions
// const getCount = createServerFn({
//   method: 'GET',
// })
//   .middleware([loggingMiddleware])
//   .handler(() => readCount())

// const updateCount = createServerFn({ method: 'POST' })
//   .inputValidator((d: number) => d)
//   .handler(async ({ data }) => {
//     const count = await readCount()
//     await fs.promises.writeFile(filePath, `${count + data}`)
//   })


// new route for "/"
// uses getCount server function as loader
// applies loggingMiddleware to server functions

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => {
    // return await getCount()
    const res = await getTodos()
    
    if (res instanceof Response) {
      if (!res.ok) return []

      console.log("RESPONSE", res)

      return (await res.json()) as Array<{ id: string; title: string; done: boolean }>
    }

    return []
    // return await getCount()
  },
  server: {
    // middleware: [loggingMiddleware],
    // handlers: {
    //   GET: async ({ request }) => {
    //     return new Response('Hello from the GET / route!')
    //   },
    // }
  },
})

import { Route as rootRoute } from './__root'

function Home() {
  // const router = useRouter()
  const todos = Route.useLoaderData()
  const { user } = rootRoute.useRouteContext()

  console.log("Check", { todos, user } )
  return (
    <div className="p-4">
      <div className="mb-4">
        {user ? (
          <p className="text-green-600 font-bold">Welcome back, {user.email}!</p>
        ) : (
          <p className="text-gray-600">You are not logged in. <a href="/login" className="text-blue-500 underline">Login here</a></p>
        )}
      </div>

      <h2 className="text-xl font-bold mb-2">Todos</h2>
      {todos?.map((item, index) => (
        <div key={item.id} className="border p-2 mb-2 rounded">
          <p>{item.title}</p>
        </div>
      ))}
    </div>
  )
}