"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChevronDown, Activity, Heart, Brain } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [activeSection, setActiveSection] = useState(0)
  const sectionsRef = useRef<HTMLDivElement[]>([])
  const [isScrolling, setIsScrolling] = useState(false)
  const homePageRef = useRef<HTMLDivElement>(null)

  // 减少为3个主要内容部分
  const sections = [
    {
      title: t("trackHealthData"),
      description: t("trackHealthDataDescription"),
      icon: <Activity className="h-20 w-20 text-blue-500" />,
      details: t("trackHealthDataDetails"),
      image: "/images/runner-woman-nature.png",
    },
    {
      title: t("personalizedExercise"),
      description: t("personalizedExerciseDescription"),
      icon: <Heart className="h-20 w-20 text-red-500" />,
      details: t("personalizedExerciseDetails"),
      image: "/images/runner-man-forest.png",
    },
    {
      title: t("smartHealthAnalysis"),
      description: t("smartHealthAnalysisDescription"),
      icon: <Brain className="h-20 w-20 text-purple-500" />,
      details: t("smartHealthAnalysisDetails"),
      image: "/images/runner-cartoon.png",
    },
  ]

  // Initialize refs array
  useEffect(() => {
    sectionsRef.current = sectionsRef.current.slice(0, sections.length + 2) // +2 for hero and footer
  }, [sections.length])

  // Handle wheel event for smooth scrolling - only on home page
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      if (isScrolling) return

      setIsScrolling(true)

      if (e.deltaY > 0) {
        // Scrolling down
        if (activeSection < sections.length + 1) {
          // +1 for footer
          scrollToSection(activeSection + 1)
        }
      } else {
        // Scrolling up
        if (activeSection > 0) {
          scrollToSection(activeSection - 1)
        }
      }

      // Debounce scrolling
      setTimeout(() => {
        setIsScrolling(false)
      }, 1000) // Longer debounce to ensure smooth transitions
    }

    // Only add event listener to the home page element
    const homePageElement = homePageRef.current
    if (homePageElement) {
      homePageElement.addEventListener("wheel", handleWheel, { passive: false })
    }

    return () => {
      if (homePageElement) {
        homePageElement.removeEventListener("wheel", handleWheel)
      }
    }
  }, [activeSection, isScrolling, sections.length])

  // Handle keyboard navigation - only on home page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if we're on the home page
      if (!document.body.classList.contains("home-page")) return

      if (e.key === "ArrowDown" && activeSection < sections.length + 1) {
        scrollToSection(activeSection + 1)
      } else if (e.key === "ArrowUp" && activeSection > 0) {
        scrollToSection(activeSection - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeSection, sections.length])

  // Handle touch events for mobile - only on home page
  useEffect(() => {
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isScrolling) return

      const touchEndY = e.touches[0].clientY
      const diff = touchStartY - touchEndY

      if (Math.abs(diff) > 50) {
        // Threshold to detect swipe
        setIsScrolling(true)

        if (diff > 0) {
          // Swipe up (scroll down)
          if (activeSection < sections.length + 1) {
            scrollToSection(activeSection + 1)
          }
        } else {
          // Swipe down (scroll up)
          if (activeSection > 0) {
            scrollToSection(activeSection - 1)
          }
        }

        // Debounce scrolling
        setTimeout(() => {
          setIsScrolling(false)
        }, 1000)
      }
    }

    // Only add event listeners to the home page element
    const homePageElement = homePageRef.current
    if (homePageElement) {
      homePageElement.addEventListener("touchstart", handleTouchStart)
      homePageElement.addEventListener("touchmove", handleTouchMove)
    }

    return () => {
      if (homePageElement) {
        homePageElement.removeEventListener("touchstart", handleTouchStart)
        homePageElement.removeEventListener("touchmove", handleTouchMove)
      }
    }
  }, [activeSection, isScrolling, sections.length])

  // Add home-page class to body when component mounts, remove when unmounts
  useEffect(() => {
    document.body.classList.add("home-page")

    return () => {
      document.body.classList.remove("home-page")
    }
  }, [])

  const scrollToSection = (index: number) => {
    if (index >= 0 && index <= sections.length + 1) {
      setActiveSection(index)
      sectionsRef.current[index]?.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div ref={homePageRef} className="flex flex-col min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNav />

      {/* Hero Section with Background Image and Dark Overlay */}
      <div
        ref={(el) => (sectionsRef.current[0] = el as HTMLDivElement)}
        className="min-h-screen pt-16 flex flex-col items-center justify-center text-center p-4 relative snap-start"
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image src="/images/runner-man-city.png" alt="Runner in city" fill priority className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-0"></div>

        <div className="max-w-4xl mx-auto relative z-10 hero-text">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 page-title text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {t("intelligentHealthSystem")}
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-200">
            {t("healthSystemDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button asChild size="lg" className="text-lg py-6 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Link href="/register">{t("getStarted")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg py-6 px-8 border-blue-400 text-blue-400 hover:bg-blue-400/10"
              onClick={() => scrollToSection(1)}
            >
              {t("learnMore")}
            </Button>
          </div>
        </div>
        <div className="absolute bottom-8 animate-bounce cursor-pointer z-10" onClick={() => scrollToSection(1)}>
          <ChevronDown className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Feature Sections */}
      {sections.map((section, index) => (
        <div
          key={index}
          ref={(el) => (sectionsRef.current[index + 1] = el as HTMLDivElement)}
          className="min-h-screen pt-16 flex items-center justify-center p-8 snap-start transition-opacity duration-500"
          style={{
            backgroundColor: index % 2 === 0 ? "var(--background)" : "var(--muted)",
          }}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={`flex flex-col ${index % 2 === 0 ? "lg:order-1" : "lg:order-2"}`}>
              <div className="mb-6">{section.icon}</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 section-title bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {section.title}
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-300">{section.description}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-lg py-6 px-8 border-blue-400 text-blue-400 hover:bg-blue-400/10">
                    {t("learnMore")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">{section.title}</DialogTitle>
                    <DialogDescription className="text-lg mt-4">{section.details}</DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            <div
              className={`rounded-xl overflow-hidden flex items-center justify-center ${
                index % 2 === 0 ? "lg:order-2" : "lg:order-1"
              }`}
              style={{ height: "500px" }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={section.image || "/placeholder.svg?height=500&width=500"}
                  alt={section.title}
                  fill
                  className="object-cover rounded-lg shadow-lg feature-image"
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Footer Section with Background Image and Dark Overlay */}
      <div
        ref={(el) => (sectionsRef.current[sections.length + 1] = el as HTMLDivElement)}
        className="min-h-screen pt-16 flex items-center justify-center p-8 snap-start relative"
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image src="/images/runner-shirtless.png" alt="Runner" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-0"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 footer-text">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 section-title text-white">
            {t("readyToStart")}
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-gray-200">
            {t("registerNow")}
          </p>
          <Button asChild size="lg" className="text-lg py-6 px-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Link href="/register">{t("registerNow")}</Link>
          </Button>
          <div className="mt-16 text-sm text-gray-300">© 2025 Health Tracking System. All rights reserved.</div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
        <div className="flex flex-col gap-3">
          {Array.from({ length: sections.length + 2 }).map((_, i) => (
            <button
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeSection === i ? "bg-blue-500 w-5" : "bg-gray-300 dark:bg-gray-600"
              }`}
              onClick={() => scrollToSection(i)}
              aria-label={`Scroll to section ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

