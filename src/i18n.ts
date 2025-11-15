import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "Welcome to React": "Welcome to React and react-i18next",
      "Dashboard": "Dashboard",
      "API": "API",
      "Home": "Home",
      "Language": "Language",
      "Settings": "Settings",
      "Management": "Management",
      "Explore": "Explore"
    }
  },
  fr: {
    translation: {
      "Welcome to React": "Bienvenue à React et react-i18next",
      "Dashboard": "Tableau de bord",
      "API": "API",
      "Home": "Accueil",
      "Language": "Langue",
      "Settings": "Paramètres",
      "Management": "Gestion",
      "Explore": "Explorer"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en", // fallback language if translation is missing
    
    interpolation: {
      escapeValue: false // react already safes from xss
    },
    
    react: {
      useSuspense: false // disable suspense for better compatibility
    }
  });

export default i18n;