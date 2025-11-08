import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'

export const Route = createFileRoute('/posts/')( {
  component: PostsComponent,
})

// Example of middleware that logs each request
// const loggingMiddleware = createMiddleware().server(({ next, context, request }) => {
//   console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
//   return next()
// })

// export const Route = createFileRoute('/posts/')({
//   component: PostsComponent,
//   server: {
//     // Middleware - run before the request is handled
//     middleware: [loggingMiddleware],
//     // Server function - can access any environment variable
//     handlers: {
//       GET: () => {
//         // get data from the api or database
//       },
//       POST: () => {
//         // update data in the api or database
//       },
//     },
//   }
// })

// // Server function - can access any environment variable
// const getUser = createServerFn().handler(async () => {
//   const db = await connect(process.env.DATABASE_URL) // ✅ Server-only
//   return db.user.findFirst()
// })



// // ❌ WRONG - Secret exposed to client bundle
// const config = {
//   apiKey: import.meta.env.VITE_SECRET_API_KEY, // This will be in your JS bundle!
// }

// // ✅ CORRECT - Keep secrets on server
// const getApiData = createServerFn().handler(async () => {
//   const response = await fetch(apiUrl, {
//     headers: { Authorization: `Bearer ${process.env.SECRET_API_KEY}` },
//   })
//   return response.json()
// })

export default function PostsComponent() {
  const viteAppName = import.meta.env.VITE_APP_NAME // ✅ Exposed to client
  const enableNewFeature = import.meta.env.VITE_ENABLE_NEW_FEATURE === 'true' // ✅ Exposed to client

  return (
    <div>Hello "/posts"!
      <h1>App Name: {viteAppName}</h1>
      {enableNewFeature && <p>New feature is enabled!</p>}
    </div>
  )
}
