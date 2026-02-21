import { useState } from "react";
import { getLang, toggleLang } from "../i8n/i18n";

export function LangToggle() {
  const [lang, setLangState] = useState(getLang());

  return (
    <button
      className="fixed right-3 top-28 z-[9999] rounded-md bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur hover:bg-black/75"
      type="button"
      onClick={() => {
        toggleLang();
        setLangState(getLang());
        window.location.reload(); // stabil trial megoldás
      }}
    >
      {lang.toUpperCase()}
    </button>
  );
}
