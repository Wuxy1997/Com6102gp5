import type React from "react"
import { MainNav } from "@/components/main-nav"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className="content-page horizontal-stripes">
      <MainNav />
      <main className={`container mx-auto py-16 px-4 ${className}`}>{children}</main>
    </div>
  )
}

