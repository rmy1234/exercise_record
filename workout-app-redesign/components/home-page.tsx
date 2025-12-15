import { ArrowUp, Dumbbell } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function HomePage() {
  const currentTime = new Date()
  const hour = currentTime.getHours()
  const greeting = hour < 12 ? "좋은 아침이에요" : hour < 18 ? "좋은 오후에요" : "좋은 저녁이에요"

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {currentTime.toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{greeting}, 홍길동님 💪</h1>
      </div>

      {/* PR Card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <ArrowUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">나의 3대 중량 (PR)</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Squat</p>
            <p className="text-2xl font-bold">120</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Bench</p>
            <p className="text-2xl font-bold">100</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Deadlift</p>
            <p className="text-2xl font-bold">150</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-primary">370 kg</span>
          </div>
        </div>
      </Card>

      {/* Today's Routine */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">오늘의 루틴</h2>
        <Card className="border-0 bg-card p-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </div>
              <div className="flex-1">
                <p className="font-medium">벤치프레스</p>
                <p className="text-sm text-muted-foreground">4세트 × 8-10회</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </div>
              <div className="flex-1">
                <p className="font-medium">케이블 크로스오버</p>
                <p className="text-sm text-muted-foreground">3세트 × 12-15회</p>
              </div>
            </div>
          </div>
        </Card>

        <Button className="w-full rounded-2xl py-6 text-base font-semibold shadow-lg shadow-primary/20">
          <Dumbbell className="mr-2 h-5 w-5" />
          운동 시작하기
        </Button>
      </div>

      {/* This Week Stats */}
      <Card className="border-0 bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">이번 주 운동</h3>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
            <span className="text-2xl font-bold text-accent">3</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">이번 주는 총 3일 운동했습니다</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
