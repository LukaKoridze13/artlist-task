import { create } from "zustand"
import type { Generation } from "./generationsStore"

const PAGE_SIZE = 10

interface GalleryState {
  pages: Record<number, Generation[]>
  total: number
  totalPages: number
  setPage: (page: number, items: Generation[], total: number, totalPages: number) => void
  prependItem: (item: Generation) => void
  removeItem: (id: string) => void
  getPage: (page: number) => Generation[] | undefined
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  pages: {},
  total: 0,
  totalPages: 0,

  setPage: (page, items, total, totalPages) =>
    set((state) => ({
      pages: { ...state.pages, [page]: items },
      total,
      totalPages,
    })),

  prependItem: (item) =>
    set((state) => {
      const page1 = state.pages[1] ?? []
      const rest = page1.filter((g) => g._id !== item._id)
      return {
        pages: { ...state.pages, 1: [item, ...rest] },
        total: state.total + 1,
      }
    }),

  removeItem: (id) =>
    set((state) => {
      const nextPages = { ...state.pages }
      for (const p of Object.keys(nextPages)) {
        const num = Number(p)
        const list = nextPages[num].filter((g) => g._id !== id)
        if (list.length !== nextPages[num].length) {
          nextPages[num] = list
          return { pages: nextPages, total: Math.max(0, state.total - 1) }
        }
      }
      return state
    }),

  getPage: (page) => get().pages[page],
}))

export { PAGE_SIZE as GALLERY_PAGE_SIZE }
