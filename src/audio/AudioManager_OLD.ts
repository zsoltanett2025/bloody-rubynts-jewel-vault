// src/utils/audioManager.ts
import { SOUND_PACKS, type SoundKey, type SoundPackId } from "./soundpacks";

/**
 * Ezt hívja a játék:
 * playSound("click" | "match" | "combo" | "win" | "defeat" | "booster")
 */
export type SfxName = "click" | "match" | "combo" | "win" | "defeat" | "booster"  ;

type AudioState = {
  unlocked: boolean;
  pack: SoundPackId;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
};

const STORAGE_KEY = "br_audio_settings_v1";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function loadState(): AudioState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no state");
    const parsed = JSON.parse(raw);

    return {
      unlocked: false,
      pack: parsed.pack === "B" ? "B" : "A",
      sfxEnabled: parsed.sfxEnabled !== false,
      musicEnabled: parsed.musicEnabled !== false,
      sfxVolume: clamp01(Number(parsed.sfxVolume ?? 0.8)),
      musicVolume: clamp01(Number(parsed.musicVolume ?? 0.35)),
    };
  } catch {
    return {
      unlocked: false,
      pack: "A",
      sfxEnabled: true,
      musicEnabled: false,
      sfxVolume: 0.8,
      musicVolume: 0.35,
    };
  }
}

// ✅ csak olyan kulcs lehet itt, ami létezik a SoundKey union-ben
const SFX_MAP: Record<SfxName, Exclude<SoundKey, "music_main">> = {
  click: "sfx_click",
  match: "sfx_match",
  combo: "sfx_combo",
  win: "sfx_win",
  defeat: "sfx_defeat",
  booster: "sfx_booster",
};

class AudioManager {
  private state: AudioState = loadState();
  private sfxPool: Map<Exclude<SoundKey, "music_main">, HTMLAudioElement[]> = new Map();
  private musicEl: HTMLAudioElement | null = null;

  unlock = async () => {
    if (this.state.unlocked) return;
    try {
      const url = SOUND_PACKS[this.state.pack].sfx_click;
      const a = new Audio(url);
      a.volume = 0.0001;
      await a.play();
      a.pause();
      a.currentTime = 0;
      this.state.unlocked = true;
    } catch {
      this.state.unlocked = true;
    }
  };

  playSfx = (key: Exclude<SoundKey, "music_main">) => {
    if (!this.state.sfxEnabled) return;

    const url = SOUND_PACKS[this.state.pack][key];

    const pool = this.sfxPool.get(key) ?? [];
    let el = pool.find((a) => a.paused);

    if (!el) {
      el = new Audio(url);
      el.preload = "auto";
      pool.push(el);
      this.sfxPool.set(key, pool);
    }

    el.currentTime = 0;
void el.play().catch(() => {});

    el.volume = this.state.sfxVolume;
    el.currentTime = 0;
    void el.play().catch(() => {});
  };

  playMusic = () => {
    if (!this.state.musicEnabled) return;

    const url = SOUND_PACKS[this.state.pack].music_main;
    if (!this.musicEl) {
      this.musicEl = new Audio(url);
      this.musicEl.loop = true;
      this.musicEl.preload = "auto";
    }
    this.musicEl.volume = this.state.musicVolume;
    void this.musicEl.play().catch(() => {});
  };

  stopMusic = () => {
    if (!this.musicEl) return;
    this.musicEl.pause();
    this.musicEl.currentTime = 0;
  };
}

export const audioManager = new AudioManager();

export function unlockAudio() {
  void audioManager.unlock();
}

export function playSound(name: SfxName) {
  const key = SFX_MAP[name];
  audioManager.playSfx(key);
}
