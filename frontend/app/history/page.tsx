"use client"

import { useState } from "react"
import { useHistoryStore, HISTORY_PAGE_SIZE } from "@/lib/historyStore"
import { useGenerationSocket } from "@/hooks/useGenerationSocket"
import apiClient from "@/lib/apiClient"
import type { Generation } from "@/lib/generationsStore"

export default function HistoryPage() {
  useGenerationSocket()

  const [page, setPage] = useState(1)
  const [loadingPage, setLoadingPage] = useState<number | null>(null)

  const pages = useHistoryStore((s) => s.pages)
  const total = useHistoryStore((s) => s.total)
  const totalPages = useHistoryStore((s) => s.totalPages)
  const setPageData = useHistoryStore((s) => s.setPage)
  const getPage = useHistoryStore((s) => s.getPage)

  const items = getPage(page)
  const isLoading = loadingPage === page

  async function ensurePage(n: number) {
    if (pages[n] != null) return
    setLoadingPage(n)
    try {
      const { data } = await apiClient.get<{
        items: Generation[]
        total: number
        totalPages: number
      }>("/generations", {
        params: {
          page: n,
          limit: HISTORY_PAGE_SIZE,
          includeDeleted: true,
        },
      })
      setPageData(n, data.items, data.total, data.totalPages)
    } finally {
      setLoadingPage(null)
    }
  }

  const handlePageChange = (next: number) => {
    setPage(next)
    ensurePage(next)
  }

  if (items === undefined && !isLoading && page > 1) {
    ensurePage(page)
  }

  const displayItems = items ?? []

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">History</h1>
        <p className="text-sm text-muted-foreground">
          All past generations with timing and status details.
        </p>
      </div>
      <div className="space-y-2">
        {(page === 1 && items === undefined) ||
          (isLoading && displayItems.length === 0) ? (
          <p className="text-sm">Loading…</p>
        ) : null}
        {displayItems.map((item) => {
          const created = new Date(item.createdAt)
          const started = item.startedAt
            ? new Date(item.startedAt)
            : undefined
          const completed = item.completedAt
            ? new Date(item.completedAt)
            : undefined

          let durationLabel = ""
          if (started && completed) {
            const ms = completed.getTime() - started.getTime()
            const seconds = Math.max(Math.round(ms / 1000), 1)
            durationLabel = `${seconds}s`
          }

          return (
            <article
              key={item._id}
              className="flex flex-col gap-1 rounded-lg border bg-background p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <h2 className="truncate font-medium">{item.name}</h2>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {item.prompt}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[11px] uppercase text-muted-foreground">
                    {item.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      item.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : item.status === "failed"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>Created: {created.toLocaleString()}</span>
                {started && (
                  <span>Started: {started.toLocaleTimeString()}</span>
                )}
                {completed && (
                  <span>Completed: {completed.toLocaleTimeString()}</span>
                )}
                {durationLabel && <span>Duration: {durationLabel}</span>}
              </div>
              {item.errorMessage && (
                <p className="text-xs text-red-500">
                  Error: {item.errorMessage}
                </p>
              )}
            </article>
          )
        })}
        {displayItems.length === 0 &&
          total === 0 &&
          !(page === 1 && items === undefined) && (
            <p className="text-sm text-muted-foreground">
              No generations yet. Create one from the Generate page.
            </p>
          )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="rounded-md border px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
