import hu from "./locales/hu.json";
import en from "./locales/en.json";

export type Lang = "hu" | "en";

const LS_LANG = "br_lang";

export function getLang(): Lang {
  const v = (localStorage.getItem(LS_LANG) || "hu").toLowerCase();
  return v === "en" ? "en" : "hu";
}

export function setLang(lang: Lang) {
  localStorage.setItem(LS_LANG, lang);
}

export function t(key: string): string {
  const lang = getLang();
  const dict: any = lang === "en" ? en : hu;

  // dot-notation: "menu.title"
  return key.split(".").reduce((acc: any, part) => (acc ? acc[part] : undefined), dict) ?? key;
}

export function toggleLang() {
  setLang(getLang() === "hu" ? "en" : "hu");
}
