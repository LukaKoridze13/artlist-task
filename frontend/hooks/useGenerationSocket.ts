"use client"

import { useEffect, useRef } from "react"
import { toast } from "react-toastify"
import { getSocket } from "@/lib/socketClient"
import { useGenerationStore, type Generation } from "@/lib/generationsStore"
import { useGalleryStore } from "@/lib/galleryStore"
import { useHistoryStore } from "@/lib/historyStore"

export function useGenerationSocket() {
  const upsertOne = useGenerationStore((s) => s.upsertOne)
  const galleryPrepend = useGalleryStore((s) => s.prependItem)
  const historyPrepend = useHistoryStore((s) => s.prependItem)
  const prevStatusByRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handler = (payload: Generation) => {
      const prevStatus = prevStatusByRef.current[payload._id]
      prevStatusByRef.current[payload._id] = payload.status
      upsertOne(payload)

      if (payload.status === "completed" && prevStatus !== "completed") {
        toast.success(`Generation "${payload.name}" completed.`)
        galleryPrepend(payload)
        historyPrepend(payload)
      } else if (payload.status === "failed" && prevStatus !== "failed") {
        toast.error(
          `Generation "${payload.name}" failed${payload.errorMessage ? `: ${payload.errorMessage}` : "."}`
        )
        historyPrepend(payload)
      }
    }

    socket.on("generation:updated", handler)
    return () => {
      socket.off("generation:updated", handler)
    }
  }, [upsertOne, galleryPrepend, historyPrepend])
}
