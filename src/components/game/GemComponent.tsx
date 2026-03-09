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
  onClick,
  level,
}: {
  gem: Gem;
  size: number;
  isSelected: boolean;
  isFlashing?: boolean;
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

  const pool = pools[gem.type] ?? [GAME_ASSETS.gems.ruby_round];

  const simpleSkins = typeof level === "number" && level <= SIMPLE_SKINS_UNTIL_LEVEL;
  const isDragonLevel = typeof level === "number" && DRAGON_LEVELS.includes(level);

  const baseGemUrl = useMemo(() => {
    if (simpleSkins) return pool[0] ?? GAME_ASSETS.gems.ruby_round;
    return pool[hashToIndex(gem.id, pool.length)] ?? GAME_ASSETS.gems.ruby_round;
  }, [simpleSkins, pool, gem.id]);

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

  const transform = `translate3d(${x}px, ${y}px, 0) scale(${isSelected ? 1.04 : 1})`;

  const dragonGlow =
    isDragonLevel && gem.type !== "chest"
      ? "drop-shadow-[0_0_8px_rgba(255,70,70,0.22)]"
      : "";

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
      className={`absolute rounded-xl overflow-hidden select-none ${isFlashing ? "br-match-flash" : ""}`}
      style={{
        width: size,
        height: size,
        touchAction: "manipulation",
        willChange: "transform",
        transform,
        transition: "transform 180ms ease-out",
      }}
    >
      <img
        src={baseGemUrl}
        alt={gem.type}
        draggable={false}
        className={`w-full h-full object-cover pointer-events-none ${dragonGlow}`}
        style={{ opacity: isPower ? 0.35 : 1 }}
      />

      {isPower && (
        <img
          src={powerIcon!}
          alt={gem.power}
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_12px_rgba(255,120,120,0.45)]"
        />
      )}

      {isDragonLevel && !isPower && gem.type !== "chest" && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/6 via-transparent to-black/8" />
      )}

      <div className={`absolute inset-0 rounded-xl ${selectionRing}`} />
    </button>
  );
}