"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { useLanguage } from "./language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Menu,
  X,
  ChevronDown,
  Calendar,
  Activity,
  Heart,
  BarChart2,
  Utensils,
  Award,
  Users,
  Brain,
} from "lucide-react"
import { useState } from "react"
import { ThemeSwitcher } from "./theme-switcher"

export function MainNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 导航项目 - 添加更多选项
  const mainRoutes = [
    {
      href: "/",
      label: t("home"),
      active: pathname === "/",
    },
    {
      href: "/dashboard",
      label: t("dashboard"),
      active: pathname === "/dashboard" || pathname === "/health-data" || pathname === "/exercise-tracker" || pathname === "/food-tracker",
      children: [
        {
          href: "/dashboard",
          label: "Dashboard Overview",
          icon: <BarChart2 className="h-4 w-4 mr-2" />,
          active: pathname === "/dashboard",
        },
        {
          href: "/health-data",
          label: t("health"),
          icon: <Heart className="h-4 w-4 mr-2" />,
          active: pathname === "/health-data",
        },
        {
          href: "/exercise-tracker",
          label: t("exercise"),
          icon: <Activity className="h-4 w-4 mr-2" />,
          active: pathname === "/exercise-tracker",
        },
        {
          href: "/food-tracker",
          label: t("nutrition"),
          icon: <Utensils className="h-4 w-4 mr-2" />,
          active: pathname === "/food-tracker",
        },
      ],
    },
    {
      href: "/workout-plans",
      label: t("workoutPlans"),
      icon: <Calendar className="h-4 w-4 mr-2" />,
      active: pathname === "/workout-plans" && !pathname.includes("/calendar"),
    },  
    {
      href: "/weekly-schedule",
      label: t("schedule"),
      icon: <Calendar className="h-4 w-4 mr-2" />,
      active: pathname === "/weekly-schedule" || pathname.includes("/calendar-view"),
    },
    
  ]

  // 次要导航项目 - 保留在"更多"下拉菜单中
  const moreRoutes = [
    {
      href: "/social",
      label: t("social"),
      icon: <Users className="h-4 w-4 mr-2" />,
      active: pathname === "/social",
    },
    {
      href: "/achievements",
      label: t("achievements"),
      icon: <Award className="h-4 w-4 mr-2" />,
      active: pathname === "/achievements",
    },
    {
      href: "/ai-recommendations",
      label: t("aiRecommendations"),
      icon: <Brain className="h-4 w-4 mr-2" />,
      active: pathname === "/ai-recommendations",
    },
  ]

  // 检查"更多"下拉菜单中是否有活动路由
  const isMoreActive = moreRoutes.some((route) => route.active)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="mx-auto px-2 sm:px-4 nav-container">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                {t("appName")}
              </Link>
            </div>
            <div className="hidden sm:ml-4 sm:flex sm:space-x-2 nav-links">
              {mainRoutes.map((route) =>
                route.children ? (
                  <DropdownMenu key={route.href}>
                    <DropdownMenuTrigger
                      className={cn(
                        "inline-flex items-center px-2 pt-1 text-sm font-medium border-transparent nav-link",
                        route.active
                          ? "border-b-2 border-primary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:border-muted",
                      )}
                    >
                      {route.label} <ChevronDown className="ml-1 h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {route.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link
                            href={child.href}
                            className={cn("flex w-full items-center", child.active ? "text-primary" : "")}
                          >
                            {child.icon} {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                      "inline-flex items-center px-2 pt-1 text-sm font-medium nav-link",
                      route.active
                        ? "border-b-2 border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground",
                    )}
                  >
                    {route.icon && <span className="mr-1">{route.icon}</span>}
                    {route.label}
                  </Link>
                ),
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex items-center px-2 pt-1 text-sm font-medium border-transparent nav-link",
                    isMoreActive
                      ? "border-b-2 border-primary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:border-muted",
                  )}
                >
                  {t("more")} <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {moreRoutes.map((route) => (
                    <DropdownMenuItem key={route.href} asChild>
                      <Link
                        href={route.href}
                        className={cn("w-full flex items-center", route.active ? "text-primary" : "")}
                      >
                        {route.icon} {route.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="hidden sm:ml-2 sm:flex sm:items-center">
            <ThemeSwitcher />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-2">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">{t("profile")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">{t("settings")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>{t("logout")}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex space-x-2 ml-2">
                <Button asChild variant="outline" className="text-xs py-1 px-2">
                  <Link href="/login">{t("login")}</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-xs py-1 px-2">
                  <Link href="/register">{t("register")}</Link>
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 移动菜单 */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} sm:hidden`}>
        <div className="space-y-1 pt-2 pb-3 bg-background">
          {mainRoutes.map((route) =>
            route.children ? (
              <div key={route.href}>
                <Link
                  href={route.href}
                  className={cn(
                    "block py-2 pl-3 pr-4 text-base font-medium",
                    pathname === route.href
                      ? "bg-muted border-l-4 border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:border-muted hover:text-foreground",
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BarChart2 className="inline-block h-4 w-4 mr-2" /> Dashboard Overview
                </Link>
                {route.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "block py-2 pl-8 pr-4 text-base font-medium",
                      child.active
                        ? "bg-muted border-l-4 border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:border-muted hover:text-foreground",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.icon && <span className="inline-block mr-2">{child.icon}</span>}
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "block py-2 pl-3 pr-4 text-base font-medium",
                  route.active
                    ? "bg-muted border-l-4 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:border-muted hover:text-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {route.icon && <span className="inline-block mr-2">{route.icon}</span>}
                {route.label}
              </Link>
            ),
          )}

          {/* 更多选项 */}
          <div className="border-t border-border pt-2 mt-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("more")}</p>
            {moreRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "block py-2 pl-3 pr-4 text-base font-medium",
                  route.active
                    ? "bg-muted border-l-4 border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:border-muted hover:text-foreground",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {route.icon && <span className="inline-block mr-2">{route.icon}</span>}
                {route.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-4 pb-3">
          <div className="px-4 py-2">
            <ThemeSwitcher />
          </div>
          {user ? (
            <div className="space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("profile")}
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("settings")}
              </Link>
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {t("logout")}
              </button>
            </div>
          ) : (
            <div className="space-y-1 px-4">
              <Button asChild variant="outline" className="w-full mb-2" onClick={() => setMobileMenuOpen(false)}>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/register">{t("register")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

