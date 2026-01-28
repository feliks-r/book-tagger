"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, // passed to trigger
          },
        },
      })

      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) setError(error.message)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        {isSignup ? "Sign up" : "Log in"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button className="w-full">
          {isSignup ? "Create account" : "Log in"}
        </Button>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </form>

      <Button
        onClick={() => setIsSignup(!isSignup)}
        variant="ghost"
        className="mt-4 text-sm underline"
      >
        {isSignup ? "Already have an account?" : "Create an account"}
      </Button>
    </div>
  )
}
