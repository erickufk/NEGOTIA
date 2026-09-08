import { createContext, useContext, useState, useEffect } from "react";
import { dict } from "./translations";

const I18nCtx = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("negotia_lang") || "en");
  useEffect(() => { localStorage.setItem("negotia_lang", lang); }, [lang]);
  const t = dict[lang] || dict.en;
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
