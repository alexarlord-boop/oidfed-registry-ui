import { createContext, useContext, useEffect } from "react"
import { useAppState, type Theme } from "@/hooks/store"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

type ThemeProviderProps = React.PropsWithChildren<{
  defaultTheme?: Theme
  storageKey?: string
}>

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { theme, setTheme } = useAppState()

  // initialize from localStorage or default
  useEffect(() => {
    const stored = (localStorage.getItem(storageKey) as Theme) || defaultTheme
    if (stored !== theme) setTheme(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // apply theme to <html> and persist
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme: Exclude<Theme, "system"> = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      localStorage.setItem(storageKey, "system")
      return
    }

    root.classList.add(theme)
    localStorage.setItem(storageKey, theme)
  }, [theme, storageKey])

  const value: ThemeProviderState = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}