import { useState } from "react";
import { t } from "../i8n/i18n";

const DISCORD_URL = "https://discord.gg/Sb3e8v3n";
const REDDIT_URL = "https://www.reddit.com/user/BloodyRubynts";
const WEBSITE_URL = "https://bloodyruby.com";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const copy = async () => {
    const payload =
      `BR Trial Feedback\n` +
      `----------------\n` +
      `${text || "(empty)"}\n` +
      `\n` +
      `Device/Browser: ${navigator.userAgent}\n` +
      `Time: ${new Date().toISOString()}\n`;

    try {
      await navigator.clipboard.writeText(payload);
      alert("Copied! Paste it in Discord/Reddit.");
    } catch {
      alert("Copy failed. Please select and copy manually.");
    }
  };

  const openLink = (url: string) => {
    if (!url || url.includes("PASTE_")) {
      alert("Link not set yet.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        className="fixed right-3 bottom-6 z-[9999] rounded-full bg-red-800 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        onClick={() => setOpen(true)}
        type="button"
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#140404] border border-red-900/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{t("feedback.title") || "Trial Feedback"}</h3>
              <button
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/15"
                onClick={() => setOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-white/70 mb-2">
              {t("feedback.subtitle") || "Write a bug/idea. Copy and paste into Discord or Reddit."}
            </p>

            <textarea
              className="w-full h-28 p-2 rounded bg-black/40 text-white outline-none"
              placeholder={t("feedback.placeholder") || "Bug, idea, suggestion..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex flex-wrap gap-2 justify-end mt-3">
              <button className="px-3 py-2 rounded bg-black/40 hover:bg-black/55" onClick={copy} type="button">
                Copy message
              </button>
              <button
                className="px-3 py-2 rounded bg-black/40 hover:bg-black/55"
                onClick={() => openLink(DISCORD_URL)}
                type="button"
              >
                Open Discord
              </button>
              <button
                className="px-3 py-2 rounded bg-black/40 hover:bg-black/55"
                onClick={() => openLink(REDDIT_URL)}
                type="button"
              >
                Open Reddit
              </button>
              <button
                className="px-3 py-2 rounded bg-black/40 hover:bg-black/55"
                onClick={() => openLink(WEBSITE_URL)}
                type="button"
              >
                Website
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
