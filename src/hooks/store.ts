import { create } from 'zustand'

export type Theme = "dark" | "light" | "system";

type AppState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const useAppState = create<AppState>((set) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
  },
}));
