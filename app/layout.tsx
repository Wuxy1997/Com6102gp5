import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import "./retro-gaming.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { GoalCompletionToast } from "@/components/goal-completion-toast"
import { LanguageProvider } from "@/components/language-provider"
import { PageWrapper } from "@/components/page-wrapper"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata = {
  title: "Health & Fitness Tracker",
  description: "Track your health data and get personalized diet and exercise recommendations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans w-full max-w-full`}>
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>
              <GoalCompletionToast />
              <PageWrapper>{children}</PageWrapper>
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'