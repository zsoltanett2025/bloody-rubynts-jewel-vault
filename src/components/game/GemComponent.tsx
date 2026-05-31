import { useMemo } from "react";
import { GAME_ASSETS } from "../../utils/gameAssets";
import type { Gem } from "./useMatch3";

function hashToIndex(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return mod === 0 ? 0 : h % mod;
}

const SIMPLE_SKINS_UNTIL_LEVEL = 10;
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

  const pools: Record<string, string[]> = {
    ruby: [
      GAME_ASSETS.gems.ruby_round,
      GAME_ASSETS.gems.ruby_oval,
      GAME_ASSETS.gems.ruby_cushion,
      GAME_ASSETS.gems.ruby_heart,
      GAME_ASSETS.gems.ruby_pear,
      GAME_ASSETS.gems.ruby_purple,
      GAME_ASSETS.gems.red_diamond,
    ],
    blood: [GAME_ASSETS.gems.blood_drop],
    amethyst: [GAME_ASSETS.gems.amethyst_oval, GAME_ASSETS.gems.amethyst_cushion],
    onyx: [GAME_ASSETS.gems.onyx_round],
    silver: [GAME_ASSETS.gems.emerald_round],
    chest: [GAME_ASSETS.chests.purple, GAME_ASSETS.chests.blue],
  };

  

  const simpleSkins = typeof level === "number" && level <= SIMPLE_SKINS_UNTIL_LEVEL;
  const isDragonLevel = typeof level === "number" && DRAGON_LEVELS.includes(level);

  const baseGemUrl = useMemo(() => {
  const currentPool =
    pools[gem.type] ?? [GAME_ASSETS.gems.ruby_round];

  if (simpleSkins) return currentPool[0];

  return currentPool[
    hashToIndex(gem.id, currentPool.length)
  ];
}, [simpleSkins, gem.type, gem.id]);

  const powerIcon =
    gem.power === "stripe_h"
      ? GAME_ASSETS.powerups.stripe_horizontal
      : gem.power === "stripe_v"
        ? GAME_ASSETS.powerups.stripe_vertical
        : gem.power === "bomb"
          ? GAME_ASSETS.powerups.bomb_3x3
          : gem.power === "rainbow"
            ? GAME_ASSETS.powerups.bomb_rainbow
            : null;

  const isPower = !!powerIcon && gem.type !== "chest";

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
        style={{ opacity: isPower ? 0.42 : 1 }}
      />

      {isPower && (
        <img
          src={powerIcon!}
          alt={gem.power}
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,120,120,0.45)] animate-pulse-slow" // WOW: Lassú pulzálás
        />
      )}

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

      <div className={`absolute inset-0 rounded-xl ${selectionRing}`} />
    </button>
  );
}
