"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { get, post } from "@/lib/api"

type User = {
  _id: string
  name: string
  email: string
} | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Function to check auth status
  const checkAuth = async () => {
    try {
      console.log("Checking authentication status...")
      const res = await get("/api/auth/me")
      console.log("Auth check response status:", res.status)

      if (res.ok) {
        const userData = await res.json()
        console.log("User data received:", userData)
        setUser(userData)
        return true
      } else {
        console.log("Not authenticated")
        setUser(null)
        return false
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log("Login attempt with email:", email)
      const res = await post("/api/auth/login", { email, password })
      console.log("Login response status:", res.status)

      if (res.ok) {
        const userData = await res.json()
        console.log("Login successful, user data:", userData)
        setUser(userData)
        // Check auth status after login
        await checkAuth()
        return true
      }

      const errorData = await res.json()
      console.error("Login failed:", errorData)
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log("Registration attempt with email:", email)
      const res = await post("/api/auth/register", { name, email, password })
      console.log("Registration response status:", res.status)

      if (res.ok) {
        const userData = await res.json()
        console.log("Registration successful, user data:", userData)
        setUser(userData)
        // Check auth status after registration
        await checkAuth()
        return true
      }

      const errorData = await res.json()
      console.error("Registration failed:", errorData)
      return false
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      console.log("Logout attempt")
      await post("/api/auth/logout", {})
      console.log("Logout successful")
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

