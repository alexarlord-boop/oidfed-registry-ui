import { create } from 'zustand'
import { persist } from "zustand/middleware";
import  i18n from "../i18n"

export type Theme = "dark" | "light" | "system";
export type Lang = "en" | "fr";

type AppState = {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Language
  language: Lang,
  setLanguage: (language: Lang) => void;
  hydrateLanguage: () => void;

};

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),

      language: i18n.language as Lang,
      setLanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ language: lang });
      },

      hydrateLanguage: () => {
        const { language } = get();
        i18n.changeLanguage(language);
      },
    }),
    {
      name: "app-storage",
      onRehydrateStorage: () => (state) => {
        // This runs after Zustand rehydrates from localStorage
        if (state) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
