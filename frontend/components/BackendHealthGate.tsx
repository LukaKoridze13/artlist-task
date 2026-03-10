"use client"

import { useEffect, useState } from "react"

const HEALTH_POLL_INTERVAL_MS = 10_000

type BackendHealthGateProps = {
  children: React.ReactNode
}

export function BackendHealthGate({ children }: BackendHealthGateProps) {
  const [ready, setReady] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    const healthUrl = `${baseUrl.replace(/\/+$/, "")}/health`

    const checkHealth = async () => {
      try {
        const res = await fetch(healthUrl, {
          method: "GET",
          cache: "no-store",
        })
        if (!cancelled && res.ok) {
          setReady(true)
          setLastError(null)
          return
        }
        if (!cancelled) {
          setLastError(`Backend is not ready yet (${res.status}).`)
        }
      } catch (err: any) {
        if (!cancelled) {
          setLastError("Backend is waking up on Render.")
        }
      }
    }

    // initial attempt
    void checkHealth()

    const id = window.setInterval(() => {
      if (!cancelled && !ready) {
        void checkHealth()
      }
    }, HEALTH_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 px-4 text-center">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
        <h1 className="mb-2 text-lg font-semibold">Preparing your workspace…</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Our backend is hosted on Render and may take{" "}
          <span className="font-medium text-amber-600 dark:text-amber-400">
            2–3 minutes
          </span>{" "}
          to wake up after a period of inactivity. We&apos;re checking the
          server status every 10 seconds and will continue automatically once
          it&apos;s ready.
        </p>
        {lastError && (
          <p className="mt-3 text-xs text-muted-foreground">
            Latest status: {lastError}
          </p>
        )}
      </div>
    )
  }

  return <>{children}</>
}

