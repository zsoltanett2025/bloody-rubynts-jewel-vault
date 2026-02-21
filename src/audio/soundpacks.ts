export type SoundKey =
  | "sfx_click"
  | "sfx_match"
  | "sfx_combo"
  | "sfx_win"
  | "sfx_defeat"
  | "sfx_booster"
  | "music_main"
  | "music_menu";
export type SoundPackId = "A" | "B";

export const SOUND_PACKS: Record<SoundPackId, Record<SoundKey, string>> = {
  A: {
    sfx_click: "/assets/audio/A/click.mp3",
    sfx_match: "/assets/audio/A/match.mp3",
    sfx_combo: "/assets/audio/A/combo.mp3",
    sfx_win: "/assets/audio/A/win.mp3",
    sfx_defeat: "/assets/audio/A/defeat.mp3",
    sfx_booster: "/assets/audio/A/booster.mp3",
    music_main: "/assets/audio/A/music.mp3",
    music_menu: "/assets/audio/A/menu.mp3",
  },
  B: {
    sfx_click: "/assets/audio/B/click.mp3",
    sfx_match: "/assets/audio/B/match.mp3",
    sfx_combo: "/assets/audio/B/combo.mp3",
    sfx_win: "/assets/audio/B/win.mp3",
    sfx_defeat: "/assets/audio/B/defeat.mp3",
    sfx_booster: "/assets/audio/B/booster.mp3",
    music_main: "/assets/audio/B/music.mp3",
    music_menu: "/assets/audio/B/menu.mp3",
  },
};
