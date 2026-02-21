 export interface AudioManager {
  unlock(): Promise<void>;
  playSfx(key: string): void;
  playMusic(key: string): void;
  stopMusic(): void;
  setMusicVolume(volume: number): void;
  setSfxVolume(volume: number): void;
}

export const audioManager: AudioManager;