import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Element } from "./data/types";
import { uiEnglish } from "./i18n/ui-en";

export type Language = "zh" | "en";
export const LANGUAGE_STORAGE_KEY = "element-atlas-language";
export function translateText(
  zh: string,
  language: Language,
  en?: string,
): string {
  return language === "en"
    ? (en ?? uiEnglish[zh] ?? uiEnglish[zh.trim().replace(/\s+/g, " ")] ?? zh)
    : zh;
}
export const elementName = (
  element: Pick<Element, "name" | "englishName">,
  language: Language,
) => (language === "en" ? element.englishName : element.name);

function initialLanguage(): Language {
  const query = new URLSearchParams(location.search).get("lang");
  if (query === "en" || query === "zh") return query;
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}
type I18n = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (zh: string, en?: string) => string;
};
const I18nContext = createContext<I18n | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = language;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* Private storage can be disabled. */
    }
  }, [language]);
  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => {
        setLanguage(next);
        const url = new URL(location.href);
        url.searchParams.set("lang", next);
        history.replaceState(history.state, "", url);
      },
      t: (zh: string, en?: string) => translateText(zh, language, en),
    }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("LanguageProvider is missing");
  return value;
}
