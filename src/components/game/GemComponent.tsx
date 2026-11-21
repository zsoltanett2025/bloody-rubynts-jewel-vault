import { GAME_ASSETS, GEM_SKIN } from "../../utils/gameAssets";
import { GEM_ART_V2 } from "../../utils/gemArtV2";
import { POWER_ART_V2 } from "../../utils/powerArtV2";
import type { Gem } from "./useMatch3";

const DRAGON_LEVELS = [67, 134, 201, 268, 335, 402, 469];

export function GemComponent({
  gem,
  size,
  isSelected,
  isFlashing,
  isSpawning, // ÚJ: Jelzi, hogy most született-e a kő
  onClick,
  level,
}: {
  gem: Gem;
  size: number;
  isSelected: boolean;
  isFlashing?: boolean;
  isSpawning?: boolean; // ÚJ
  onClick: () => void;
  level?: number;
}) {
  const x = Math.round(gem.x * size);
  const y = Math.round(gem.y * size);

  // BR-JV-P0: one type = one picture (no random per-gem skins)
  // BR-JV-P1a: new vector art
  // BR-JV-P1c: power-ups are drawn INTO the gem picture (striped gem, vault-lock bomb, six-colour crystal)
  const plainGemUrl = GEM_SKIN[gem.type] ?? GAME_ASSETS.gems.ruby_round;
  const baseGemUrl =
    gem.type === "chest"
      ? GEM_ART_V2.chest
      : gem.power === "rainbow"
        ? POWER_ART_V2.rainbow
        : gem.power === "stripe_h"
          ? POWER_ART_V2.stripe_h[gem.type] ?? plainGemUrl
          : gem.power === "stripe_v"
            ? POWER_ART_V2.stripe_v[gem.type] ?? plainGemUrl
            : gem.power === "bomb"
              ? POWER_ART_V2.bomb[gem.type] ?? plainGemUrl
              : plainGemUrl;

  const isDragonLevel = typeof level === "number" && DRAGON_LEVELS.includes(level);

  const isPower = !!gem.power && gem.type !== "chest";

  // WOW: Dinamikus skálázás (Spawn -> Flash -> Select)
  let scale = 1;
  if (isSpawning) scale = 1.3; 
  else if (isFlashing) scale = 1.12;
  else if (isSelected) scale = 1.04;

  const transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

  const dragonGlow =
    isDragonLevel && gem.type !== "chest"
      ? "drop-shadow-[0_0_8px_rgba(255,70,70,0.22)]"
      : "";

  const matchGlow = isFlashing
    ? "drop-shadow-[0_0_20px_rgba(255,90,90,0.6)] drop-shadow-[0_0_30px_rgba(255,255,255,0.25)]"
    : isPower
      ? "drop-shadow-[0_0_10px_rgba(255,120,120,0.28)]"
      : "drop-shadow-[0_0_6px_rgba(255,255,255,0.08)]";

  const selectionRing = isSelected
    ? "ring-2 ring-white"
    : isDragonLevel
      ? "ring-1 ring-red-300/15"
      : "ring-1 ring-white/10";

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute rounded-xl overflow-hidden select-none 
        ${isFlashing ? "br-match-flash" : ""} 
        ${isSpawning ? "animate-bounce-short" : ""}`} // WOW: Gyors ugrás születéskor
      style={{
        width: size,
        height: size,
        touchAction: "manipulation",
        willChange: "transform, opacity, filter",
        transform,
        transition: isSpawning 
          ? "transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)" // Rugalmas belépés
          : "transform 180ms ease-out, filter 180ms ease-out, opacity 180ms ease-out",
      }}
    >
      <img
        src={baseGemUrl}
        alt={gem.type}
        draggable={false}
        className={`w-full h-full object-cover pointer-events-none ${dragonGlow} ${matchGlow}`}
        style={{ opacity: 1 }}
      />

      {isDragonLevel && !isPower && gem.type !== "chest" && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/6 via-transparent to-black/8" />
      )}

      {/* WOW: Spawn effekt (Fehér villanás születéskor) */}
      {isSpawning && (
        <div className="pointer-events-none absolute inset-0 bg-white animate-ping opacity-50 rounded-xl" />
      )}

      {isFlashing && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-white/30 animate-pulse" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-300/35 via-transparent to-red-900/25" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 animate-ping" />
          <div className="pointer-events-none absolute left-[18%] top-[20%] h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
          <div className="pointer-events-none absolute right-[20%] top-[28%] h-1 w-1 rounded-full bg-red-200/90 shadow-[0_0_10px_rgba(255,120,120,0.9)]" />
          <div className="pointer-events-none absolute bottom-[22%] left-[30%] h-1 w-1 rounded-full bg-white/75 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
        </>
      )}

      {!isFlashing && !isPower && gem.type !== "chest" && (
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-black/10" />
)}

{gem.gridLevel && gem.gridLevel > 0 && (
  <div className="br-gem-cage">
    {gem.gridLevel > 1 && (
      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">
        {gem.gridLevel}
      </div>
    )}
  </div>
)}

<div className={`absolute inset-0 rounded-xl ${selectionRing}`} />
    </button>
  );
}
