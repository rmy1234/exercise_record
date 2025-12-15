"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)
const weekDays = ["일", "월", "화", "수", "목", "금", "토"]

export function RoutinePage() {
  const [selectedDate, setSelectedDate] = useState(12)
  const [currentMonth] = useState("2025년 12월")

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">운동 캘린더</h1>

      {/* Calendar */}
      <Card className="border-0 bg-card p-4">
        {/* Month Navigation */}
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold">{currentMonth}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => (
            <div key={i} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          <div className="aspect-square" />
          <div className="aspect-square" />
          <div className="aspect-square" />
          <div className="aspect-square" />
          <div className="aspect-square" />
          {/* Days */}
          {daysInMonth.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDate(day)}
              className={`aspect-square rounded-xl text-sm font-medium transition-all ${
                day === selectedDate
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : day === 12
                    ? "bg-accent/20 text-accent"
                    : "text-foreground hover:bg-secondary"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </Card>

      {/* Selected Date Routines */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">2025-12-12 루틴</h2>
          <Button size="sm" className="rounded-xl shadow-md shadow-primary/20">
            <Plus className="mr-1 h-4 w-4" />
            운동 추가
          </Button>
        </div>

        <div className="space-y-2">
          <Card className="border-0 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  1
                </div>
                <p className="font-medium">벤치프레스</p>
              </div>
              <span className="text-xs text-muted-foreground">가슴 기록 없음</span>
            </div>
          </Card>

          <Card className="border-0 bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  2
                </div>
                <p className="font-medium">케이블 크로스오버</p>
              </div>
              <span className="text-xs text-muted-foreground">가슴 기록 없음</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
