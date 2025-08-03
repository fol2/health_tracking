import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">Health Tracker</h1>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h2 className="mb-6 text-5xl font-bold tracking-tight">
            Track Your Health Journey
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Monitor your fasting schedules, track health metrics, and achieve
            your wellness goals with our comprehensive health tracking platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Start Tracking</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-muted/50">
          <div className="container mx-auto px-4 py-24">
            <h3 className="mb-12 text-center text-3xl font-bold">
              Key Features
            </h3>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 text-xl font-semibold">
                  Fasting Tracker
                </h4>
                <p className="text-muted-foreground">
                  Track intermittent fasting, OMAD, and extended fasts with
                  customizable timers and reminders.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 text-xl font-semibold">
                  Health Metrics
                </h4>
                <p className="text-muted-foreground">
                  Monitor weight, blood pressure, glucose levels, and other
                  vital health indicators.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h4 className="mb-2 text-xl font-semibold">
                  Progress Analytics
                </h4>
                <p className="text-muted-foreground">
                  Visualize your progress with charts, streaks, and detailed
                  statistics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Health Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
