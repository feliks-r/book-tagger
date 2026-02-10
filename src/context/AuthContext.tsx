"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, role, avatar_url")
      .eq("id", userId)
      .single()

    if (!error) {
      setProfile(data)
    }
  }, [supabase])

  useEffect(() => {
    // getSession() for fast initial hydration from cookies (no network call).
    // The onAuthStateChange listener handles token refresh automatically.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) fetchProfile(currentUser.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null
        setUser(nextUser)

        if (nextUser) {
          await fetchProfile(nextUser.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
