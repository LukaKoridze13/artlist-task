import { create } from "zustand"

export type GenerationStatus =
  | "pending"
  | "generating"
  | "completed"
  | "failed"
  | "cancelled"
export type GenerationType = "text" | "image"

export interface Generation {
  _id: string
  name: string
  prompt: string
  type: GenerationType
  status: GenerationStatus
  imageSize?: string
  resultText?: string
  resultImageUrl?: string
  errorMessage?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  deletedAt?: string
}

interface GenerationState {
  generations: Record<string, Generation>
  upsertOne: (item: Generation) => void
  upsertMany: (items: Generation[]) => void
  removeOne: (id: string) => void
  getById: (id: string) => Generation | undefined
  getRecentJobs: (windowMinutes?: number) => Generation[]
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  generations: {},

  upsertOne: (item) =>
    set((state) => ({
      generations: {
        ...state.generations,
        [item._id]: { ...item },
      },
    })),

  upsertMany: (items) =>
    set((state) => {
      const next = { ...state.generations }
      for (const item of items) {
        next[item._id] = { ...item }
      }
      return { generations: next }
    }),

  removeOne: (id) =>
    set((state) => {
      const next = { ...state.generations }
      delete next[id]
      return { generations: next }
    }),

  getById: (id) => get().generations[id],

  getRecentJobs: (windowMinutes = 30) => {
    const { generations } = get()
    const since = Date.now() - windowMinutes * 60 * 1000
    return Object.values(generations)
      .filter((g) => new Date(g.createdAt).getTime() >= since)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },
}))
