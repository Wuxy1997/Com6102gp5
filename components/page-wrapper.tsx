"use client"

import type { ReactNode } from "react"
import { useTheme } from "next-themes"

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen w-full ${theme === "retro" ? "bg-black" : ""}`}>
      {children}
      {/* 添加一个额外的黑色背景填充元素，确保页面底部也是黑色（仅在retro主题下） */}
      {theme === "retro" && <div className="bg-black w-full min-h-[50vh]"></div>}
    </div>
  )
}

