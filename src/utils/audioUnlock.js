// src/utils/audioUnlock.js
let unlocked = false;

export async function unlockAudio() {
  if (unlocked) return;
  unlocked = true;

  // iOS/Android miatt: egy néma play/pause trükk
  try {
    const a = new Audio();
    a.volume = 0;
    await a.play();
    a.pause();
  } catch (_) {
    // nem gond, majd a következő interakciónál megy
  }
}

export function isAudioUnlocked() {
  return unlocked;
}
