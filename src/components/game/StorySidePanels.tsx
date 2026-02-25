// src/components/game/StorySidePanels.tsx
import { assetUrl } from "../../utils/assetUrl";

type Props = {
  leftText: string;
  rightText: string;
  showKnights?: boolean;
  showDragons?: boolean; // később
};

export function StorySidePanels({
  leftText,
  rightText,
  showKnights = true,
  showDragons = false,
}: Props) {
  const leftKnight = assetUrl("assets/ui/knight_left.png");
  const rightKnightPrimary = assetUrl("assets/ui/knight_right.png");
  const rightKnightFallback = assetUrl("assets/ui/knight_righ.png"); // ha így van elmentve nálad

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Bal panel */}
      <div className="hidden lg:block absolute left-0 top-0 h-full w-[320px] xl:w-[380px] p-4">
        <div className="h-full rounded-2xl border border-red-900/30 bg-black/35 backdrop-blur-sm p-4 br-panel-glow">
          <div className="mt-28 text-red-200/70 tracking-[0.28em] uppercase text-xs">

            Chronicle
          </div>

          <div className="mt-2 text-3xl xl:text-4xl text-red-100 font-lore font-gothic">
            The Shattered Ruby
          </div>

          <div className="mt-6 text-red-100/90 text-xl xl:text-2xl leading-relaxed whitespace-pre-line font-lore font-gothic">
            {leftText}
          </div>
        </div>
      </div>

      {/* Jobb panel */}
      <div className="hidden lg:block absolute right-0 top-0 h-full w-[320px] xl:w-[380px] p-4">
       <div className="rounded-2xl border border-red-900/30 bg-black/35 backdrop-blur-sm p-4 br-panel-glow">
          <div className="mt-28 text-red-200/70 tracking-[0.28em] uppercase text-xs text-right">

            Chronicle
          </div>

          <div className="mt-2 text-3xl xl:text-4xl text-red-100 font-lore font-gothic text-right">
            The Shattered Ruby
          </div>

          <div className="mt-6 text-red-100/90 text-xl xl:text-2xl leading-relaxed whitespace-pre-line font-lore font-gothic text-right">
            {rightText}
          </div>
        </div>
      </div>

      {/* Lovagok a két alsó sarokban */}
      {showKnights && (
        <>
          <img
            src={leftKnight}
            alt="Knight left"
            className="pointer-events-auto hidden lg:block absolute left-3 bottom-3 w-[180px] xl:w-[220px] opacity-95 drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
          />

          <img
            src={rightKnightPrimary}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = rightKnightFallback;
            }}
            alt="Knight right"
            className="pointer-events-auto hidden lg:block absolute right-3 bottom-3 w-[180px] xl:w-[220px] opacity-95 drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
          />
        </>
      )}

      {/* sárkányok (később 50-től) */}
      {showDragons && (
        <>
          {/* ide majd: bal/jobb felső sarok */}
        </>
      )}
    </div>
  );
}
