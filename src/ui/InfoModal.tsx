// src/ui/InfoModal.tsx
import { useEffect, useState } from "react";

type Lang = "en" | "hu";

export function InfoModal(props: { open: boolean; onClose: () => void }) {
  const { open, onClose } = props;
  const [lang, setLang] = useState<Lang>("en");

  // ESC bezárás + scroll lock
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // (opcionális) ha van <html lang="hu">, akkor induljon HU-val
  useEffect(() => {
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("hu")) setLang("hu");
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        // háttérre kattintva zár
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#120404] border border-white/10 shadow-2xl overflow-hidden">
        {/* fejléc */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/30">
          <div className="text-white font-gothic text-xl">Info</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={[
                "px-3 py-2 rounded-xl border",
                lang === "en"
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("hu")}
              className={[
                "px-3 py-2 rounded-xl border",
                lang === "hu"
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
              ].join(" ")}
            >
              HU
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* tartalom (görgethető) */}
        <div className="p-5 text-white/85 space-y-6 text-sm leading-relaxed max-h-[75vh] overflow-y-auto">
          {lang === "en" ? (
            <>
              <section>
                <h3 className="text-white font-semibold mb-2">Public (Trial) Info</h3>
                <p>
                  <strong>Bloody Rubynts – Jewel Vault</strong> is a story-driven match-3 adventure.
                  Your goal is to clear levels, earn stars, and progress the journey.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">How to Play</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Swap two adjacent gems.</li>
                  <li>Match 3+ identical gems to clear them.</li>
                  <li>Clearing gems gives points.</li>
                  <li>Reach the target score before moves (or time) run out.</li>
                  <li>Earn up to 3 stars per level.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Boosters / Bombs</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>4 in a row</strong> → Line Bomb</li>
                  <li><strong>T or L shape</strong> → Area Bomb</li>
                  <li><strong>5 in a row</strong> → Power Gem</li>
                </ul>
                <p className="mt-2">
                  Activation: swap a bomb with any adjacent gem to trigger it.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Ruby Shards</h3>
                <p>
                  Some special challenge levels contain Ruby Shards. Collecting shards supports progression.
                  (Trial: visual/progression feature.)
                </p>
              </section>

              <p className="text-white/50 text-xs">
                Trial Version – features may change in future updates.
              </p>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-white font-semibold mb-2">Publikus (Próba) Infó</h3>
                <p>
                  A <strong>Bloody Rubynts – Jewel Vault</strong> egy történetvezérelt match-3 kaland.
                  A célod: pályák teljesítése, csillagok gyűjtése és a haladás a történetben.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Játékszabály</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Cserélj fel két szomszédos követ.</li>
                  <li>3+ azonos kő egyezésénél törlés történik.</li>
                  <li>A törlés pontot ad.</li>
                  <li>Érd el a célpontszámot, mielőtt elfogynak a lépések (vagy lejár az idő).</li>
                  <li>Pályánként maximum 3 csillagot szerezhetsz.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Boosterek / Bombák</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>4-es sor</strong> → Vonalbomba</li>
                  <li><strong>T vagy L alak</strong> → Területbomba</li>
                  <li><strong>5-ös sor</strong> → Erőkő (Power Gem)</li>
                </ul>
                <p className="mt-2">
                  Aktiválás: cseréld el a bombát bármelyik szomszédos kővel, és elsül.
                </p>
              </section>

              <section>
                <h3 className="text-white font-semibold mb-2">Rubin Szilánkok</h3>
                <p>
                  Bizonyos kihívás-szintek Rubinszilánkokat tartalmaznak. A szilánkok a haladást segítik.
                  (Próba verzió: főleg vizuális/haladás funkció.)
                </p>
              </section>

              <p className="text-white/50 text-xs">
                Próba verzió – a funkciók későbbi frissítésekben változhatnak.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}