const BASE = import.meta.env.BASE_URL;

function p(path: string) {
  return `${BASE}${path}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

export type SoundKey =
  | "sfx_click"
  | "sfx_match"
  | "sfx_combo"
  | "sfx_win"
  | "sfx_defeat"
  | "sfx_booster"
  | "sfx_bomb"
  | "sfx_mega_bomb"
  | "sfx_stripe_h"
  | "sfx_stripe_v"
  | "music_main"
  | "music_menu";

export type SoundPackId = "A" | "B";

export const SOUND_PACKS: Record<SoundPackId, Record<SoundKey, string>> = {
  A: {
    // ezek nálad az A mappában vannak:
    sfx_match: p("assets/audio/A/match.mp3"),
    sfx_win: p("assets/audio/A/win.mp3"),
    sfx_booster: p("assets/audio/A/booster.mp3"),
    music_main: p("assets/audio/A/music.mp3"),

    // ezek nálad a shared sfx mappában vannak:
    sfx_click: p("assets/audio/sfx/click.mp3"),
    sfx_combo: p("assets/audio/sfx/combo.mp3"),
    sfx_defeat: p("assets/audio/sfx/defeat.mp3"),
    sfx_bomb: p("assets/audio/sfx/bomb.mp3"),
    sfx_mega_bomb: p("assets/audio/sfx/mega_bomb.mp3"),
    sfx_stripe_h: p("assets/audio/sfx/stripe_h.mp3"),
    sfx_stripe_v: p("assets/audio/sfx/stripe_v.mp3"),
    // ha nincs külön menü zene fájl, ideiglenesen használd a main-t:
    music_menu: p("assets/audio/A/music.mp3"),
  },

  // B: akkor lesz igazi, ha létrehozod a public/assets/audio/B/* fájlokat.
  // Addig célszerű A-t tükrözni vagy ugyanazokat használni:
  B: {
    sfx_match: p("assets/audio/A/match.mp3"),
    sfx_win: p("assets/audio/A/win.mp3"),
    sfx_booster: p("assets/audio/A/booster.mp3"),
    music_main: p("assets/audio/A/music.mp3"),

    sfx_click: p("assets/audio/sfx/click.mp3"),
    sfx_combo: p("assets/audio/sfx/combo.mp3"),
    sfx_defeat: p("assets/audio/sfx/defeat.mp3"),

    sfx_bomb: p("assets/audio/sfx/bomb.mp3"),
    sfx_mega_bomb: p("assets/audio/sfx/mega_bomb.mp3"),
    sfx_stripe_h: p("assets/audio/sfx/stripe_h.mp3"),
    sfx_stripe_v: p("assets/audio/sfx/stripe_v.mp3"),
    music_menu: p("assets/audio/A/music.mp3"),
  },
};
