'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isSignup) {
      await supabase.auth.signUp({ email, password })
    } else {
      await supabase.auth.signInWithPassword({ email, password })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">
        {isSignup ? 'Sign up' : 'Log in'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="Email"
          className="w-full border p-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <Input
          type="password"
          placeholder="Password"
          className="w-full border p-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <Button className="w-full p-2">
          {isSignup ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <Button
        onClick={() => setIsSignup(!isSignup)}
        className="mt-4 text-sm underline hover:bg-transparent hover:text-primary"
        variant="ghost"
      >
        {isSignup ? 'Already have an account?' : 'Create an account'}
      </Button>
    </div>
  )
}
