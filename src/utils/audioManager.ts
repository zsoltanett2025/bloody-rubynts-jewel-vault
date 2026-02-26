// src/utils/audioManager.ts
import { SOUND_PACKS, type SoundPackId } from "../audio/soundpacks";

const BASE = import.meta.env.BASE_URL;
const DEFAULT_PACK: SoundPackId = "A";

// ---------------- helpers ----------------
function url(p: string) {
  // BASE már tartalmazza a repo base path-et (GitHub Pages kompatibilis)
  return `${BASE}${p}`.replace(/\/{2,}/g, "/").replace(":/", "://");
}

function sharedSfx(file: string) {
  return url(`assets/audio/sfx/${file}`);
}

function packA(file: string) {
  return url(`assets/audio/A/${file}`);
}

// ---------------- SFX ----------------

// A-pack (biztosan létező nálad)
const matchSfx = packA("match.mp3");

// shared sfx (a képed alapján ezek itt vannak)
const clickSfx = sharedSfx("click.mp3");
const comboSfx = sharedSfx("combo.mp3");
const defeatSfx = sharedSfx("defeat.mp3");

const bombSfx = sharedSfx("bomb.mp3");
const megaBombSfx = sharedSfx("mega_bomb.mp3");
const stripeHSfx = sharedSfx("stripe_h.mp3");
const stripeVSfx = sharedSfx("stripe_v.mp3");
const chestBlueSfx = sharedSfx("chest_blue.mp3");
const chestPurpleSfx = sharedSfx("chest_purple.mp3");

// swap hang (maradhat click)
const swapSfx = "";

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

function getSources(packId: SoundPackId): Record<SfxName, string> {
  const pack = SOUND_PACKS[packId];

  return {
    swap: swapSfx,
    match: matchSfx,
    combo: comboSfx,
    click: clickSfx,

    // ezek a packból jönnek (SOUND_PACKS-ban már url()-ezve vannak)
    win: pack.sfx_win,
    defeat: pack.sfx_defeat ?? defeatSfx,

    bomb: bombSfx,
    mega_bomb: megaBombSfx,
    stripe_h: stripeHSfx,
    stripe_v: stripeVSfx,
    chest_blue: chestBlueSfx,
    chest_purple: chestPurpleSfx,
  };
}

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
export function preloadSfx(packId: SoundPackId = DEFAULT_PACK) {
  try {
    const sources = getSources(packId);
    for (const key of Object.keys(sources) as SfxName[]) {
      getAudio(sources[key]);
    }
  } catch {}
}

export function playSound(name: SfxName, packId: SoundPackId = DEFAULT_PACK) {
  if (muted) return;

  const src = getSources(packId)[name];
  if (!src) return;

  try {
    // cloneNode: így több gyors egymás utáni hang is működik
    const base = getAudio(src);
    const a = base.cloneNode(true) as HTMLAudioElement;
    a.volume = sfxVolume;
    a.currentTime = 0;
    void a.play().catch(() => {});
  } catch {}
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