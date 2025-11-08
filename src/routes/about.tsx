import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

//GET runtime var from server
const getRuntimeVar = createServerFn({ method: 'GET' }).handler(() => {
  return process.env.MY_RUNTIME_VAR // notice `process.env` on the server, and no `VITE_` prefix
})

// POST route for /about
const setRuntimeVar = createServerFn({ method: 'POST' }).handler((req) => {
  // process.env.MY_RUNTIME_VAR = req.data
  return { success: true }
})

export const Route = createFileRoute('/about')({
  component: AboutComponent,
  loader: async () => {
    const timer = await getRuntimeVar()
    const setter = await setRuntimeVar()
    return { timer, setter: setter.success }
  },
})

function AboutComponent() {
  const { timer, setter } = Route.useLoaderData()
  return (
    <div>
      <h1>Hello "/about"!</h1>
      <p>Timer: {timer ? timer : 'There no timer available'}</p>
      <p>Setter status: {setter ? 'Successfully set' : 'Not set yet'}</p>
    </div>
  )

}
