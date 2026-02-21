import { motion } from "motion/react";
import { GAME_ASSETS } from "../../utils/gameAssets";
import type { Gem } from "./useMatch3";

function hashToIndex(id: string, mod: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return mod === 0 ? 0 : h % mod;
}

const SIMPLE_SKINS_UNTIL_LEVEL = 10;

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
  isFlashing?: boolean; // ✅ FX: match flash
  onClick: () => void;
  level?: number; // ✅ új
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

  // ✅ 1–10: egyszerű kinézet (típusonként 1 fix kép)
  const simpleSkins = typeof level === "number" && level <= SIMPLE_SKINS_UNTIL_LEVEL;

  const baseGemUrl = simpleSkins
    ? (pool[0] ?? GAME_ASSETS.gems.ruby_round)
    : (pool[hashToIndex(gem.id, pool.length)] ?? GAME_ASSETS.gems.ruby_round);

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

  return (
    <motion.button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`absolute rounded-xl overflow-hidden select-none ${isFlashing ? "br-match-flash" : ""}`}
      style={{
        width: size,
        height: size,
        touchAction: "manipulation",
        willChange: "transform",
      }}
      initial={false}
      animate={{
        x,
        y,
        scale: isSelected ? 1.05 : 1,
        opacity: 1,
      }}
      transition={{
        x: { type: "tween", duration: 0.22, ease: "easeOut" },
        y: { type: "tween", duration: 0.22, ease: "easeOut" },
        scale: { type: "tween", duration: 0.14, ease: "easeOut" },
      }}
    >
      <img
        src={baseGemUrl}
        alt={gem.type}
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
        style={{ opacity: isPower ? 0.35 : 1 }}
      />

      {isPower && (
        <img
          src={powerIcon!}
          alt={gem.power}
          draggable={false}
          className="pointer-events-none absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_14px_rgba(255,120,120,0.55)]"
        />
      )}

      <div
        className={`absolute inset-0 rounded-xl ${
          isSelected ? "ring-2 ring-white" : "ring-1 ring-white/10"
        }`}
      />
    </motion.button>
  );
}
