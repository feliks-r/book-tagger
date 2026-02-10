"use client"

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/AuthContext"

type Theme = "light" | "dark" | "system"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
})

function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.toggle("dark", prefersDark)
  } else {
    root.classList.toggle("dark", theme === "dark")
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>("system")
  const [loaded, setLoaded] = useState(false)

  // Fetch theme from DB when user logs in
  useEffect(() => {
    if (!user) {
      // Not logged in: use system or localStorage fallback
      const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
      const validThemes: Theme[] = ["light", "dark", "system"]
      const fallback = stored && validThemes.includes(stored as Theme) ? (stored as Theme) : "system"
      setThemeState(fallback)
      setLoaded(true)
      return
    }

    supabase
      .from("user_preferences")
      .select("theme")
      .eq("user_id", user.id)
      .single<{ theme: string }>()
      .then(({ data }) => {
        const validThemes: Theme[] = ["light", "dark", "system"]
        const dbTheme = data?.theme && validThemes.includes(data.theme as Theme) ? (data.theme as Theme) : "system"
        setThemeState(dbTheme)
        if (typeof window !== "undefined") localStorage.setItem("theme", dbTheme)
        setLoaded(true)
      })
  }, [user, supabase])

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    if (!loaded) return
    applyTheme(theme)

    // Listen for system preference changes when in system mode
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = () => applyTheme("system")
      mql.addEventListener("change", handler)
      return () => mql.removeEventListener("change", handler)
    }
  }, [theme, loaded])

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme)
      applyTheme(newTheme)
      if (typeof window !== "undefined") localStorage.setItem("theme", newTheme)

      if (user) {
        await supabase
          .from("user_preferences")
          .update({ theme: newTheme })
          .eq("user_id", user.id)
      }
    },
    [user, supabase],
  )

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
