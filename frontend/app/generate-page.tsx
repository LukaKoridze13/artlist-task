"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, XCircle, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/apiClient"
import { getSocket } from "@/lib/socketClient"
import {
  useGenerationStore,
  type Generation,
  type GenerationType,
} from "@/lib/generationsStore"
import { useGenerationSocket } from "@/hooks/useGenerationSocket"

const RECENT_WINDOW_MINUTES = 30

export function GeneratePage() {
  useGenerationSocket()

  const [type, setType] = useState<GenerationType>("text")
  const [prompt, setPrompt] = useState("")
  const [imageSize, setImageSize] = useState<string>("auto")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [enhancePromptPulse, setEnhancePromptPulse] = useState(false)

  const generations = useGenerationStore((s) => s.generations)
  const upsertOne = useGenerationStore((s) => s.upsertOne)
  const removeOne = useGenerationStore((s) => s.removeOne)

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const wordCount = useMemo(
    () => prompt.trim().split(/\s+/).filter(Boolean).length,
    [prompt]
  )

  const recentJobs = useMemo(() => {
    const since = Date.now() - RECENT_WINDOW_MINUTES * 60 * 1000
    return Object.values(generations)
      .filter((g) => new Date(g.createdAt).getTime() >= since)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
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

  const handleRetryFailed = (job: Generation) => {
    setPrompt(job.prompt)
    setType(job.type)
    setImageSize(job.imageSize || "auto")
    setError(null)
    setEnhancePromptPulse(true)
    setTimeout(() => setEnhancePromptPulse(false), 4000)
  }

  const handleCancelJob = async (jobId: string) => {
    setCancellingId(jobId)
    try {
      const { data } = await apiClient.post<Generation>(
        `/generations/${jobId}/cancel`
      )
      upsertOne(data)
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to cancel generation."
      toast.error(message)
    } finally {
      setCancellingId(null)
    }
  }

  const handleEnhancePrompt = async () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error("Enter a prompt first to enhance it.")
      return
    }
    setIsEnhancing(true)
    setError(null)
    try {
      const { data } = await apiClient.post<{ prompt: string }>(
        "/generations/enhance",
        { prompt: trimmed, type }
      )
      setPrompt(data.prompt ?? trimmed)
      toast.success("Prompt enhanced.")
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? "Failed to enhance prompt."
      setError(message)
      toast.error(message)
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <section className="flex-1 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Generate</h1>
          <p className="text-sm text-muted-foreground">
            Choose a type and write a prompt. Jobs run asynchronously so you can
            queue multiple generations.
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
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              placeholder="Describe what you want to generate..."
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{wordCount} / 500 words</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isEnhancing || !prompt.trim()}
                onClick={handleEnhancePrompt}
                className={`h-8 gap-1.5 border-purple-600! bg-purple-600/50! text-xs text-white! disabled:opacity-50! ${enhancePromptPulse ? "animate-bounce" : ""}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isEnhancing ? "Enhancing…" : "Enhance prompt"}
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting..." : "Start generation"}
          </Button>
        </form>
      </section>

      <aside className="w-full shrink-0 space-y-3 rounded-lg border bg-background p-4 text-sm md:w-80">
        <h2 className="font-semibold">Ongoing jobs</h2>
        <div className="max-h-[480px] space-y-2 overflow-y-auto">
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
            } else if (started) {
              const ms = now - started.getTime()
              const seconds = Math.max(Math.floor(ms / 1000), 0)
              durationLabel = `${seconds}s`
            } else if (!completed) {
              const ms = now - created.getTime()
              const seconds = Math.max(Math.floor(ms / 1000), 0)
              durationLabel = `${seconds}s`
            }

            return (
              <div
                key={job._id}
                className="rounded-md border px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{job.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">
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
                          : job.status === "cancelled"
                            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    }`}
                  >
                    {job.status}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {job.status === "failed" && (
                      <button
                        type="button"
                        onClick={() => handleRetryFailed(job)}
                        className="flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Fill form with this prompt to retry"
                        aria-label="Retry: fill prompt"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Retry
                      </button>
                    )}
                    {(job.status === "pending" ||
                      job.status === "generating") && (
                      <button
                        type="button"
                        onClick={() => handleCancelJob(job._id)}
                        disabled={cancellingId === job._id}
                        className="flex items-center gap-1 rounded p-1 text-red-600 disabled:opacity-50"
                        title="Cancel job"
                        aria-label="Cancel job"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </button>
                    )}
                    <span className="w-6 text-end text-[10px] text-muted-foreground">
                      {durationLabel}
                    </span>
                  </span>
                </div>
                {job.status === "failed" && job.errorMessage && (
                  <p className="mt-1.5 line-clamp-2 text-[10px] text-muted-foreground">
                    {job.errorMessage}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
