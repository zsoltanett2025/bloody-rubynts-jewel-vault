// src/utils/gameAssets.ts
const BASE = import.meta.env.BASE_URL;
const u = (p: string) => `${BASE}${p.replace(/^\/+/, "")}`;

export const GAME_ASSETS = {
  gems: {
    ruby_round: u("assets/gems/ruby_round_v01.png"),
    ruby_oval: u("assets/gems/ruby_oval_v01.png"),
    ruby_cushion: u("assets/gems/ruby_cushion_v01.png"),
    ruby_heart: u("assets/gems/ruby_heart_v01.png"),
    ruby_pear: u("assets/gems/ruby_pear_v01.png"),
    ruby_purple: u("assets/gems/ruby_purple_v01.png"),
    red_diamond: u("assets/gems/red_diamond_v01.png"),

    onyx_round: u("assets/gems/onyx_round_v01.png"),
    blood_drop: u("assets/gems/blood_drop_v01.png"),

    amethyst_oval: u("assets/gems/amethyst_oval_v01.png"),
    amethyst_cushion: u("assets/gems/amethyst_cushion_v01.png"),

    emerald_round: u("assets/gems/emerald_round_v01.png"),
  },

  chests: {
    blue: u("assets/chests/chest_blue_v01.png"),
    purple: u("assets/chests/chest_purple_v01.png"),
  },

  powerups: {
    bomb_3x3: u("assets/powerups/bomb_3x3.png"),
    bomb_rainbow: u("assets/powerups/bomb_rainbow.png"),
    stripe_horizontal: u("assets/powerups/stripe_horizontal.png"),
    stripe_vertical: u("assets/powerups/stripe_vertical.png"),
  },

  ui: {
    heart: u("assets/ui/heart.png"),
    bolt: u("assets/ui/bolt.png"),
    shuffle: u("assets/ui/shuffle.png"),
  },

  // Menü háttér
  menuBackground: u("assets/backgrounds/menu.jpg"),

  // ✅ MAP / pályaválasztó hátterek (levels_sheet_001..011) — 20 pályánként vált
  mapBackgrounds: [
    u("assets/references/levels_sheet_001.png"),
    u("assets/references/levels_sheet_002.png"),
    u("assets/references/levels_sheet_003.png"),
    u("assets/references/levels_sheet_004.png"),
    u("assets/references/levels_sheet_005.png"),
    u("assets/references/levels_sheet_006.png"),
    u("assets/references/levels_sheet_007.png"),
    u("assets/references/levels_sheet_008.png"),
    u("assets/references/levels_sheet_009.png"),
    u("assets/references/levels_sheet_010.png"),
    u("assets/references/levels_sheet_011.png"),
  ] as const,

  // ✅ JÁTÉK / STORY hátterek (bg_001..bg_010) – 20 pályánként vált
storyBackgrounds: [
  u("assets/backgrounds/bg_001.png"),
  u("assets/backgrounds/bg_002.png"),
  u("assets/backgrounds/bg_003.png"),
  u("assets/backgrounds/bg_004.png"),
  u("assets/backgrounds/bg_005.png"),
  u("assets/backgrounds/bg_006.png"),
  u("assets/backgrounds/bg_007.png"),
  u("assets/backgrounds/bg_008.png"),
  u("assets/backgrounds/bg_009.png"),
  u("assets/backgrounds/bg_010.png"),
] as const,

  map: {
    knight: u("assets/backgrounds/map/knight/knight.png"),
    crackedRuby: u("assets/backgrounds/map/ruby/cracked_ruby.png"),
    rubyShards: [
      u("assets/backgrounds/map/ruby/ruby_shard_01.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_02.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_03.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_04.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_05.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_06.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_07.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_08.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_09.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_10.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_11.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_12.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_13.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_14.png"),
      u("assets/backgrounds/map/ruby/ruby_shard_15.png"),
    ] as const,
    gnomes: {
      g1: u("assets/backgrounds/map/gnomes/gnome_01.png"),
      g2: u("assets/backgrounds/map/gnomes/gnome_02.png"),
      g3: u("assets/backgrounds/map/gnomes/gnome_03.png"),
    },
  },
} as const;