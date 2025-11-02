import { create } from 'zustand'

enum pageType {
    home = "HOME",
    dashboard = "DASHBOARD"
}

export const useAppState = create((set) => ({
  appState: {
    currentPage: pageType,
    updatePage: (newPage: pageType) => set({ currentPage: newPage }),
  },

}))
