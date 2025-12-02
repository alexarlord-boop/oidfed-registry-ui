import { create } from 'zustand'
import { persist } from "zustand/middleware";
import  i18n from "../i18n"
import type { AuthUser } from '@/lib/auth';

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

  // Auth - NOT persisted (managed by UnifiedAuth + TokenManager)
  user: AuthUser | null;
  isAuthLoading: boolean;
  authError: string | null;
  setAuthState: (state: { user?: AuthUser | null; isAuthLoading?: boolean; authError?: string | null }) => void;
  clearAuth: () => void;
};

export const useAppState = create<AppState>()(
  persist(
    (set, get) => ({
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

      // Auth state - NOT persisted (managed by UnifiedAuth)
      user: null,
      isAuthLoading: true,
      authError: null,
      setAuthState: (state) => set(state),
      clearAuth: () => set({ user: null, isAuthLoading: false, authError: null }),
    }),
    {
      name: "app-storage",
      // Only persist theme and language, NOT auth state
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language 
      }),
      onRehydrateStorage: () => (state) => {
        // This runs after Zustand rehydrates from localStorage
        if (state) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);
