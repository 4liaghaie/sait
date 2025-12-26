"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "@/lib/translations";

const LanguageContext = createContext({ lang: "en", setLang: () => {} });
const COOKIE_KEY = "lang";

const readLang = () => {
  if (typeof document === "undefined") return "en";
  const cookieMatch = document.cookie.match(new RegExp(`${COOKIE_KEY}=([^;]+)`));
  if (cookieMatch) return cookieMatch[1];
  const stored = localStorage.getItem(COOKIE_KEY);
  return stored || "en";
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    setLangState(readLang());
  }, []);

  const setLang = (value) => {
    setLangState(value);
    if (typeof document !== "undefined") {
      document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=31536000`;
      localStorage.setItem(COOKIE_KEY, value);
      window.location.reload();
    }
  };

  const t = (key) =>
    translations[lang]?.[key] ??
    translations.en?.[key] ??
    key;

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
