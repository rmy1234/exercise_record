import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, ChevronRight, LogOut } from "lucide-react"

export function ProfilePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">마이페이지</h1>

      {/* Profile Card */}
      <Card className="border-0 bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">홍길동</h2>
            <p className="text-sm text-muted-foreground">test@example.com</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <Card className="border-0 bg-card p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">나이</p>
            <p className="text-2xl font-bold">30</p>
            <p className="text-xs text-muted-foreground">세</p>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">키</p>
            <p className="text-2xl font-bold">175.5</p>
            <p className="text-xs text-muted-foreground">cm</p>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">체중</p>
            <p className="text-2xl font-bold">75</p>
            <p className="text-xs text-muted-foreground">kg</p>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <div className="space-y-2">
        <Card className="border-0 bg-card">
          <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50">
            <span className="font-medium">성별</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">남성</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </Card>

        <Card className="border-0 bg-card">
          <button className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-secondary/50">
            <span className="font-medium">앱 버전</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">1.0.0</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </Card>
      </div>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full rounded-2xl border-destructive/20 py-6 text-base font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
      >
        <LogOut className="mr-2 h-5 w-5" />
        로그아웃
      </Button>
    </div>
  )
}
