// src/components/game/StoryOverlay.tsx
import { useEffect } from "react";
import { assetUrl } from "../../utils/assetUrl";

type StoryOverlayProps = {
  open: boolean;
  textLeft: string;
  textRight: string;
  onClose: () => void;

  // későbbre (sárkányok)
  showDragons?: boolean;
};

export function StoryOverlay({
  open,
  textLeft,
  textRight,
  onClose,
  showDragons = false,
}: StoryOverlayProps) {
  if (!open) return null;

  const leftKnight = assetUrl("assets/ui/knight_left.png");
  const rightKnight = assetUrl("assets/ui/knight_right.png");

  // később: ha meglesznek a képek
  // const leftDragon = assetUrl("assets/ui/dragon_left.png");
  // const rightDragon = assetUrl("assets/ui/dragon_right.png");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      {/* katt a sötét háttérre -> bezár */}
      <button
        type="button"
        aria-label="Close story overlay"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
      />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border border-red-900/40 bg-[#120303]/92 p-6 md:p-7 relative shadow-2xl">
          {/* fejléc */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-red-200/80 tracking-[0.28em] uppercase text-xs md:text-sm">
                Chronicle
              </div>
              <h2 className="mt-1 text-3xl md:text-4xl text-red-100 font-lore font-gothic">
                The Shattered Ruby
              </h2>
            </div>

            {/* close */}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-4 py-2 rounded-full bg-black/40 border border-red-900/40 hover:bg-red-900/30 transition-colors"
            >
              Continue
            </button>
          </div>

          {/* dísz vonal */}
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-red-700/40 to-transparent" />

          {/* story text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6">
            <div className="text-red-100/90 text-lg md:text-xl leading-relaxed whitespace-pre-line font-lore font-gothic">
              {textLeft}
            </div>
            <div className="text-red-100/90 text-lg md:text-xl leading-relaxed whitespace-pre-line font-lore font-gothic">
              {textRight}
            </div>
          </div>

          {/* lábjegyzet */}
          <div className="mt-6 text-center text-red-200/50 text-xs tracking-[0.22em] uppercase">
            Bloody Rubynts Saga
          </div>
        </div>
      </div>

      {/* knights */}
      <img
        src={leftKnight}
        alt="Knight left"
        className="pointer-events-none select-none absolute left-2 bottom-2 w-[160px] md:w-[240px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)] opacity-95"
      />
      <img
        src={rightKnight}
        alt="Knight right"
        className="pointer-events-none select-none absolute right-2 bottom-2 w-[160px] md:w-[240px] drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)] opacity-95"
      />

      {/* dragons (később) */}
      {showDragons && (
        <>
          {/* ide majd betesszük a két sárkány PNG-t amikor elkészül */}
          {/* <img src={leftDragon} className="..." /> */}
          {/* <img src={rightDragon} className="..." /> */}
        </>
      )}
    </div>
  );
}
