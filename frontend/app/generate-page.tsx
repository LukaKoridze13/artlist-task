"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/apiClient"
import { getSocket } from "@/lib/socketClient"
import { useGenerationStore, type Generation, type GenerationType } from "@/lib/generationsStore"
import { useGenerationSocket } from "@/hooks/useGenerationSocket"

const RECENT_WINDOW_MINUTES = 30

export function GeneratePage() {
  useGenerationSocket()

  const [type, setType] = useState<GenerationType>("text")
  const [prompt, setPrompt] = useState("")
  const [imageSize, setImageSize] = useState<string>("auto")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const generations = useGenerationStore((s) => s.generations)
  const upsertOne = useGenerationStore((s) => s.upsertOne)
  const removeOne = useGenerationStore((s) => s.removeOne)

  const wordCount = useMemo(
    () => prompt.trim().split(/\s+/).filter(Boolean).length,
    [prompt]
  )

  const recentJobs = useMemo(() => {
    const since = Date.now() - RECENT_WINDOW_MINUTES * 60 * 1000
    return Object.values(generations)
      .filter((g) => new Date(g.createdAt).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [generations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!prompt.trim()) {
      setError("Prompt is required.")
      return
    }

    if (wordCount > 500) {
      setError("Prompt is too long. Maximum is 500 words.")
      return
    }

    const socket = getSocket()
    const socketId = socket?.id ?? undefined

    const tempId = `pending-${Date.now()}`
    upsertOne({
      _id: tempId,
      name: prompt.trim().slice(0, 60) || "New generation",
      prompt,
      type,
      status: "pending",
      createdAt: new Date().toISOString(),
    })
    setPrompt("")

    setIsSubmitting(true)
    try {
      const { data } = await apiClient.post<Generation>("/generations", {
        type,
        prompt,
        imageSize: type === "image" ? imageSize : undefined,
        socketId,
      })
      removeOne(tempId)
      upsertOne(data)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to start generation."
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <section className="flex-1 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Generate</h1>
          <p className="text-sm text-muted-foreground">
            Choose a type and write a prompt. Jobs run asynchronously so you
            can queue multiple generations.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("text")}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                type === "text"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted"
              }`}
            >
              Text
            </button>
            <button
              type="button"
              onClick={() => setType("image")}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                type === "image"
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted"
              }`}
            >
              Image
            </button>
          </div>
          {type === "image" && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="image-size">
                Image size
              </label>
              <select
                id="image-size"
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="auto">Auto</option>
                <option value="1024x1024">1024 x 1024</option>
                <option value="1024x1536">1024 x 1536</option>
                <option value="1536x1024">1536 x 1024</option>
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="prompt">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe what you want to generate..."
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{wordCount} / 500 words</span>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Start generation"}
          </Button>
        </form>
      </section>

      <aside className="md:w-80 w-full shrink-0 space-y-3 rounded-lg border bg-background p-4 text-sm">
        <h2 className="font-semibold">Ongoing jobs</h2>
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {recentJobs.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No jobs yet. Start a generation to see it here.
            </p>
          )}
          {recentJobs.map((job) => {
            const created = new Date(job.createdAt)
            const started = job.startedAt ? new Date(job.startedAt) : undefined
            const completed = job.completedAt
              ? new Date(job.completedAt)
              : undefined

            let durationLabel = ""
            if (started && completed) {
              const ms = completed.getTime() - started.getTime()
              const seconds = Math.max(Math.round(ms / 1000), 1)
              durationLabel = `${seconds}s`
            }

            return (
              <div
                key={job._id}
                className="rounded-md border px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{job.name}</span>
                  <span className="uppercase text-[10px] text-muted-foreground">
                    {job.type}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      job.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : job.status === "failed"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {durationLabel || created.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
