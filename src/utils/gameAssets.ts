import { GEM_ART_V2 } from "./gemArtV2";

const BASE = import.meta.env.BASE_URL;
const u = (p: string) => `${BASE}${p.replace(/^\/+/, "")}`;

// BR-JV-P5: unused pictures removed; used pictures converted to WebP (approved 2026-11-21).
export const GAME_ASSETS = {
  gems: {
    // fallback picture for an unknown gem type (new vector ruby)
    ruby_round: GEM_ART_V2.ruby,
  },

  ui: {
    heart: u("assets/ui/heart.webp"),
    shuffle: u("assets/ui/shuffle.webp"),
  },

  menuBackground: u("assets/backgrounds/menu.jpg"),

  storyBackgrounds: [
    u("assets/backgrounds/bg_001.webp"),
    u("assets/backgrounds/bg_002.webp"),
    u("assets/backgrounds/bg_003.webp"),
    u("assets/backgrounds/bg_004.webp"),
    u("assets/backgrounds/bg_005.webp"),
    u("assets/backgrounds/bg_006.webp"),
    u("assets/backgrounds/bg_007.webp"),
    u("assets/backgrounds/bg_008.webp"),
    u("assets/backgrounds/bg_009.webp"),
    u("assets/backgrounds/bg_010.webp"),
    u("assets/backgrounds/bg_011.webp"),
    u("assets/backgrounds/bg_012.webp"),
    u("assets/backgrounds/bg_013.webp"),
    u("assets/backgrounds/bg_014.webp"),
    u("assets/backgrounds/bg_015.webp"),
    u("assets/backgrounds/bg_016.webp"),
    u("assets/backgrounds/bg_017.webp"),
    u("assets/backgrounds/bg_018.webp"),
    u("assets/backgrounds/bg_019.webp"),
    u("assets/backgrounds/bg_020.webp"),
    u("assets/backgrounds/bg_021.webp"),
    u("assets/backgrounds/bg_022.webp"),
    u("assets/backgrounds/bg_023.webp"),
    u("assets/backgrounds/bg_024.webp"),
    u("assets/backgrounds/bg_025.webp"),
    u("assets/backgrounds/bg_026.webp"),
    u("assets/backgrounds/bg_027.webp"),
    u("assets/backgrounds/bg_028.webp"),
    u("assets/backgrounds/bg_029.webp"),
    u("assets/backgrounds/bg_030.webp"),
  ] as const,

  map: {
    knight: u("assets/backgrounds/map/knight/knight.webp"),
  },
} as const;
/**
 * Phase 0 readability fix (BR-JV-P0): exactly ONE picture per gem type,
 * each with its own colour AND shape. Code names are unchanged, so game
 * logic and saved progress are not affected. Used by the board and the
 * level-goal icon so both always show the same picture.
 * BR-JV-P1a: pictures switched to the new vector art (GEM_ART_V2).
 */
export const GEM_SKIN: Record<string, string> = {
  ruby: GEM_ART_V2.ruby, // red, round faceted
  blood: GEM_ART_V2.blood, // yellow topaz, star
  amethyst: GEM_ART_V2.amethyst, // purple, square cushion
  onyx: GEM_ART_V2.onyx, // blue sapphire, hexagon
  silver: GEM_ART_V2.silver, // green emerald, triangle
  rose: GEM_ART_V2.rose, // pink, heart (BR-JV-P1b, from level 61)
};
