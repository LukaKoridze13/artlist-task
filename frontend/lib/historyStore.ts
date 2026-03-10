import { create } from "zustand"
import type { Generation } from "./generationsStore"

const PAGE_SIZE = 10

interface HistoryState {
  pages: Record<number, Generation[]>
  total: number
  totalPages: number
  setPage: (page: number, items: Generation[], total: number, totalPages: number) => void
  prependItem: (item: Generation) => void
  getPage: (page: number) => Generation[] | undefined
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
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

  getPage: (page) => get().pages[page],
}))

export { PAGE_SIZE as HISTORY_PAGE_SIZE }
