import { createFileRoute } from '@tanstack/react-router'
import { createMiddleware, json } from '@tanstack/react-start'
import { useState } from 'react'

const authMiddleware = createMiddleware().server(async ({ next, request, context }) => {
  const authHeader = request.headers.get('Authorization')
  
  if (authHeader !== 'Bearer mysecrettoken') {
    return {
      request,
      pathname: new URL(request.url).pathname,
      context,
      response: new Response('Unauthorized', { status: 401 }),
    }
  }
  const result = await next()
  return result
})

const loggerMiddleware = createMiddleware().server(async ({ next, request, context }) => {
  console.log('Received request for:', request.url)
  const response = await next()
  return response
})

// POST route for /hello
// uses RouteComponent as the component
// handles POST requests and responds with a message including the sent name
// mix of server and client code
export const Route = createFileRoute('/hello')({
  server: {
    handlers: {
      // GET: async () => {
      //   return new Response('Hello from the GET /hello route!')
      // },
      POST: async ({ request }) => {
        const body = await request.json()

        // return new Response(JSON.stringify({ message: `Hello from the POST "/hello" route! You sent: ${body.name}!` }))
        return json({ message: `Hello from GET /hello with custom middleware! ${body.name}` })

      },
    },
  },
  component: RouteComponent,
})

// Route with custom middleware for authentication and logging
// applies authMiddleware to all handlers
// applies loggerMiddleware only to POST handler

export const RouteWithCustomMiddleware = createFileRoute('/hello')({
  server: {
    middleware: [authMiddleware], // Runs first for all handlers  
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: {
          middleware: [loggerMiddleware], // Runs after authMiddleware, only for POST
          handler: async ({ request, params, context }) => {
            return json({ message: `Hello from GET /hello with custom middleware! ${request.url}` })
          },
          
        },
      }),     
  },
})

function RouteComponent() {
  // Example of making a POST request to the server route
  const [data, setData] = useState('')
  return (
    <div>
      <button
        onClick={() => {
          fetch('/hello', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Carlos' }),
          }).then(async (res) => res.json()).then((data) => {
            setData(data.message)
          }
          ).catch((err) => {
            console.error('Error:', err)
          }).finally(() => {
            console.log('Request completed')
          })
        }}
      >Send POST Request</button>
      <p>{data}</p>
    </div>
  )
}
