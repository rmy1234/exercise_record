"use client"

import { useState } from "react"
import { Home, Calendar, TrendingUp, User } from "lucide-react"
import { HomePage } from "@/components/home-page"
import { StatsPage } from "@/components/stats-page"
import { RoutinePage } from "@/components/routine-page"
import { ProfilePage } from "@/components/profile-page"

export default function FitnessApp() {
  const [currentTab, setCurrentTab] = useState("home")

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Content */}
      <div className="mx-auto max-w-lg">
        {currentTab === "home" && <HomePage />}
        {currentTab === "routine" && <RoutinePage />}
        {currentTab === "stats" && <StatsPage />}
        {currentTab === "profile" && <ProfilePage />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          <button
            onClick={() => setCurrentTab("home")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              currentTab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">홈</span>
          </button>
          <button
            onClick={() => setCurrentTab("routine")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              currentTab === "routine" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">루틴</span>
          </button>
          <button
            onClick={() => setCurrentTab("stats")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              currentTab === "stats" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">통계</span>
          </button>
          <button
            onClick={() => setCurrentTab("profile")}
            className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
              currentTab === "profile" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">마이페이지</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
