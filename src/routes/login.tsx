import React, { useState } from 'react'
import { createFileRoute, useRouter, redirect, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { prisma } from '../server/db'
import { setLoginCookie, clearLoginCookie } from '../server/auth'

const LoginSchema = z.object({
  email: z.string()
})

const login = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const { email } = data
    
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, role: 'user' }
    })

    // const user = await prisma.user.findUnique({ where: { email } })
   
    // if (!user) return new Response(JSON.stringify({ error: 'No existe' }), { status: 404 })

    return new Response(null, {
      status: 200,
      headers: {
        'Set-Cookie': setLoginCookie(email)
      },
    })
  })

export const Route = createFileRoute('/login')({
  // ssr: false,
  component: Login,
})  

function Login() {
  const router =useRouter()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  console.log("Check-login", email)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    
    console.log("Submitting login for:", email)
    const res = await login({ data: { email } })
    console.log("Login response:", res)

    if (res instanceof Response && res.ok) {
      await router.invalidate()
      navigate({ to: '/' })
    } else {
      console.error("Login failed", res)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form 
        className="space-y-4"
        onSubmit={(e) => handleSubmit(e)}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input 
            type="email" 
            name="email" 
            id="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            placeholder="you@example.com"
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Login / Register
        </button>
      </form>
      <button 
          type="button"
          onClick={() => console.log("Test button clicked")}
          className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 mb-2"
        >
          Test Click
        </button>
    </div>
  )
}
