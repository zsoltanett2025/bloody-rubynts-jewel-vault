// src/utils/audioManager.ts
const BASE = import.meta.env.BASE_URL;

// ---------------- helpers ----------------
function url(p: string) {
  // BASE már tartalmazza a repo base path-et (GitHub Pages kompatibilis)
  return `${BASE}${p}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

// Fallback: ha a fájl nem ott van, ahol gondoljuk, próbáljuk meg A/sfx alatt is
function sfxPath(file: string) {
  // 1) primary: assets/audio/sfx/*
  // 2) fallback: assets/audio/A/sfx/*
  return {
    primary: url(`assets/audio/sfx/${file}`),
    fallback: url(`assets/audio/A/sfx/${file}`),
  };
}

// ---------------- SFX ----------------

// A-pack (régi, ami biztos működik)
const matchSfx = url("assets/audio/A/match.mp3");
const comboSfx = url("assets/audio/A/combo.mp3");
const winSfx = url("assets/audio/A/win.mp3");
const clickSfx = url("assets/audio/A/click.mp3");

// ÚJ: power hangok (NÁLAD: assets/audio/sfx/ vagy fallback assets/audio/A/sfx/)
const bombSfx = sfxPath("bomb.mp3");
const megaBombSfx = sfxPath("mega_bomb.mp3");
const stripeHSfx = sfxPath("stripe_h.mp3");
const stripeVSfx = sfxPath("stripe_v.mp3");
const defeatSfx = sfxPath("defeat.mp3");
const chestBlueSfx = sfxPath("chest_blue.mp3");
const chestPurpleSfx = sfxPath("chest_purple.mp3");

// swap hang (maradhat click)
const swapSfx = clickSfx;

export type SfxName =
  | "swap"
  | "match"
  | "combo"
  | "click"
  | "win"
  | "bomb"
  | "stripe_h"
  | "stripe_v"
  | "mega_bomb"
  | "defeat"
  | "chest_blue"
  | "chest_purple";

// Ha egy sfx-hez van primary+fallback, akkor a playSound megpróbálja mindkettőt
type Source = string | { primary: string; fallback: string };

const sources: Record<SfxName, Source> = {
  swap: swapSfx,
  match: matchSfx,
  combo: comboSfx,
  click: clickSfx,
  win: winSfx,

  bomb: bombSfx,
  mega_bomb: megaBombSfx,
  stripe_h: stripeHSfx,
  stripe_v: stripeVSfx,
  defeat: defeatSfx,
  chest_blue: chestBlueSfx,
  chest_purple: chestPurpleSfx,
};

let muted = false;
let sfxVolume = 0.8;
let musicVolume = 0.35;

// ---------------- SFX cache (stabilabb lejátszás) ----------------
const sfxCache = new Map<string, HTMLAudioElement>();

function getAudio(src: string) {
  let a = sfxCache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = "auto";
    sfxCache.set(src, a);
  }
  return a;
}

// mobil “felébresztés”
export function unlockAudio() {
  try {
    const a = new Audio();
    a.volume = 0.0001;
    void a.play().catch(() => {});
    a.pause();
  } catch {}
}

// opcionális: előtöltés (ha akarod App.tsx-ben hívni once)
export function preloadSfx() {
  try {
    for (const key of Object.keys(sources) as SfxName[]) {
      const src = sources[key];
      if (typeof src === "string") {
        getAudio(src);
      } else {
        getAudio(src.primary);
        getAudio(src.fallback);
      }
    }
  } catch {}
}

export function playSound(name: SfxName) {
  if (muted) return;

  const src = sources[name];
  if (!src) return;

  const tryPlay = (s: string) => {
    try {
      // cloneNode: így több gyors egymás utáni hang is működik
      const base = getAudio(s);
      const a = base.cloneNode(true) as HTMLAudioElement;
      a.volume = sfxVolume;
      a.currentTime = 0;
      void a.play().catch(() => {});
    } catch {}
  };

  if (typeof src === "string") {
    tryPlay(src);
    return;
  }

  // primary -> fallback
  tryPlay(src.primary);
  // ha a primary 404, a fallback legalább megszólalhat (nincs biztos 404 detect, ezért “double try”)
  // nagyon halk “dupla” esély minimális, de csak akkor lenne gond, ha mindkettő létezik ugyanazzal a hanggal
  // ha biztos vagy benne hogy csak 1 helyen van, nyugodtan töröld a fallback sort
  // tryPlay(src.fallback);
  setTimeout(() => tryPlay(src.fallback), 30);
}

export function setMuted(value: boolean) {
  muted = value;
  if (muted) stopMusic();
}

export function setSfxVolume(value: number) {
  sfxVolume = Math.max(0, Math.min(1, value));
}

export function setMusicVolume(value: number) {
  musicVolume = Math.max(0, Math.min(1, value));
  if (musicEl) musicEl.volume = musicVolume;
}

// ---------------- MUSIC ----------------
let musicEl: HTMLAudioElement | null = null;
let currentMusic: string | null = null;

export function playMusic(src: string) {
  if (muted) return;
  if (!src) return;
  if (musicEl && currentMusic === src && !musicEl.paused) return;

  if (!musicEl) musicEl = new Audio(src);
  else {
    musicEl.pause();
    musicEl.src = src;
  }

  currentMusic = src;
  musicEl.loop = true;
  musicEl.volume = musicVolume;
  musicEl.preload = "auto";
  void musicEl.play().catch(() => {});
}

export function stopMusic() {
  if (!musicEl) return;
  musicEl.pause();
  try {
    musicEl.currentTime = 0;
  } catch {}
  currentMusic = null;
}
