"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useGalleryStore, GALLERY_PAGE_SIZE } from "@/lib/galleryStore"
import { useGenerationSocket } from "@/hooks/useGenerationSocket"
import apiClient from "@/lib/apiClient"
import type { Generation } from "@/lib/generationsStore"

export default function GalleryPage() {
  useGenerationSocket()

  const [page, setPage] = useState(1)
  const [loadingPage, setLoadingPage] = useState<number | null>(null)

  const pages = useGalleryStore((s) => s.pages)
  const total = useGalleryStore((s) => s.total)
  const totalPages = useGalleryStore((s) => s.totalPages)
  const setPageData = useGalleryStore((s) => s.setPage)
  const getPage = useGalleryStore((s) => s.getPage)
  const removeItem = useGalleryStore((s) => s.removeItem)

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
        params: { page: n, limit: GALLERY_PAGE_SIZE, status: "completed" },
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
        <h1 className="text-xl font-semibold">Gallery</h1>
        <p className="text-sm text-muted-foreground">
          Completed generations, newest first.
        </p>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
            className="cursor-pointer rounded-md border px-2 py-1 disabled:opacity-50"
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
            className="cursor-pointer rounded-md border px-2 py-1 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {(page === 1 && items === undefined) ||
          (isLoading && displayItems.length === 0) ? (
          <p className="text-sm">Loading…</p>
        ) : null}
        {displayItems.map((item) => (
          <article
            key={item._id}
            className="flex flex-col gap-2 rounded-lg border bg-background p-3 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate font-medium">
                {item.name.length > 30 ? item.name.slice(0, 30) + "…" : item.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-muted-foreground">
                  {item.type}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-red-500 text-red-500 hover:bg-red-500/10"
                  type="button"
                  onClick={async () => {
                    await apiClient.delete(`/generations/${item._id}`)
                    removeItem(item._id)
                  }}
                  aria-label="Delete from gallery"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {item.type === "image" && item.resultImageUrl ? (
              <div className="flex h-[300px] md:h-[500px] w-full items-center justify-center">
                <img
                  src={item.resultImageUrl}
                  alt={item.name}
                  className="mt-1 h-full w-full max-h-[500px] md:max-h-[500px] max-w-full md:max-w-[500px] rounded-md object-contain"
                  style={{ display: "block" }}
                />
              </div>
            ) : (
              <div className="mt-1 space-y-1">
                <p className="whitespace-pre-wrap text-sm">
                  {item.resultText || "No content generated."}
                </p>
              </div>
            )}
            <p className="line-clamp-2 text-[11px] text-muted-foreground">
              Prompt: {item.prompt}
            </p>
          </article>
        ))}
        {displayItems.length === 0 &&
          total === 0 &&
          !(page === 1 && items === undefined) && (
            <p className="text-sm text-muted-foreground">
              No generations yet. Create one from the Generate page.
            </p>
          )}
      </div>
    </div>
  )
}
