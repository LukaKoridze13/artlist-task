"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import apiClient from "@/lib/apiClient"
import { useGalleryStore } from "@/lib/galleryStore"
import { useHistoryStore } from "@/lib/historyStore"
import { GALLERY_PAGE_SIZE } from "@/lib/galleryStore"
import { HISTORY_PAGE_SIZE } from "@/lib/historyStore"

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { status } = useSession()
  const hasFetched = useRef(false)

  const gallerySetPage = useGalleryStore((s) => s.setPage)
  const historySetPage = useHistoryStore((s) => s.setPage)

  useEffect(() => {
    if (status === "unauthenticated") {
      hasFetched.current = false
      return
    }
    if (status !== "authenticated" || hasFetched.current) return
    hasFetched.current = true

    async function fetchInitial() {
      try {
        const [galleryRes, historyRes] = await Promise.all([
          apiClient.get<{
            items: unknown[]
            total: number
            page: number
            limit: number
            totalPages: number
          }>("/generations", {
            params: { page: 1, limit: GALLERY_PAGE_SIZE, status: "completed" },
          }),
          apiClient.get<{
            items: unknown[]
            total: number
            page: number
            limit: number
            totalPages: number
          }>("/generations", {
            params: {
              page: 1,
              limit: HISTORY_PAGE_SIZE,
              includeDeleted: true,
            },
          }),
        ])
        gallerySetPage(
          1,
          galleryRes.data.items as any[],
          galleryRes.data.total,
          galleryRes.data.totalPages
        )
        historySetPage(
          1,
          historyRes.data.items as any[],
          historyRes.data.total,
          historyRes.data.totalPages
        )
      } catch {
        // ignore
      }
    }

    fetchInitial()
  }, [status, gallerySetPage, historySetPage])

  return <>{children}</>
}
