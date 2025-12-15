"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const weightData = [
  { date: "12/01", value: 75.0 },
  { date: "12/08", value: 74.8 },
  { date: "12/15", value: 74.5 },
  { date: "12/22", value: 74.2 },
  { date: "12/29", value: 74.0 },
]

export function StatsPage() {
  const [activeTab, setActiveTab] = useState<"weight" | "muscle" | "fat">("weight")

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">내 몸 변화</h1>
          <p className="text-sm text-muted-foreground">체중, 골격근량, 체지방량 변화 추이</p>
        </div>
        <Button size="sm" className="rounded-xl shadow-md shadow-primary/20">
          <Plus className="mr-1 h-4 w-4" />
          기록
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("weight")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "weight"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          체중
        </button>
        <button
          onClick={() => setActiveTab("muscle")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "muscle"
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          골격근량
        </button>
        <button
          onClick={() => setActiveTab("fat")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            activeTab === "fat"
              ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          체지방량
        </button>
      </div>

      {/* Chart */}
      <Card className="border-0 bg-card p-6">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weightData}>
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[73.5, 75.5]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                padding: "8px 12px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Latest Records */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">최신 기록 요약</h2>
        <Card className="border-0 bg-card p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-fit rounded-full bg-primary/10 px-3 py-1">
                <p className="text-xs font-semibold text-primary">체중</p>
              </div>
              <p className="text-3xl font-bold">74</p>
              <p className="text-sm text-muted-foreground">kg</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto w-fit rounded-full bg-accent/10 px-3 py-1">
                <p className="text-xs font-semibold text-accent">골격근량</p>
              </div>
              <p className="text-3xl font-bold">36</p>
              <p className="text-sm text-muted-foreground">kg</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="mx-auto w-fit rounded-full bg-destructive/10 px-3 py-1">
                <p className="text-xs font-semibold text-destructive">체지방량</p>
              </div>
              <p className="text-3xl font-bold">14</p>
              <p className="text-sm text-muted-foreground">kg</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
