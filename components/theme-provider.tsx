"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      themes={["light", "dark", "system", "retro-gaming"]}
      value={{
        light: "light",
        dark: "dark",
        system: "system",
        "retro-gaming": "retro-gaming",
      }}
    >
      {children}
    </NextThemesProvider>
  )
}

