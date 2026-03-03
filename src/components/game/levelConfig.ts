// src/components/game/levelConfig.ts
import { isShardLevel } from "../../utils/shards";

export type LevelConfig = {
  boardSize: number;         // 6 / 7 / 8 / 9 (minimum 6)
  mask: boolean[][];         // true = van cella, false = lyuk
  gemCount: number;          // 5..12 (maxGem-hez clamp)
  chestChanceBoss: number;   // boss/shard pálya chest esély
  chestChanceNormal: number; // normál pálya chest esély
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeMask(size: number, fill = true) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function diamondMask(size: number) {
  const m = makeMask(size, false);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x - c);
      const dy = Math.abs(y - c);
      if (dx + dy <= c) m[y][x] = true;
    }
  }
  return m;
}

function cutCornersMask(size: number) {
  const m = makeMask(size, true);
  const k = size >= 9 ? 3 : size >= 8 ? 2 : 1;
  for (let y = 0; y < k; y++) {
    for (let x = 0; x < k; x++) {
      m[y][x] = false;
      m[y][size - 1 - x] = false;
      m[size - 1 - y][x] = false;
      m[size - 1 - y][size - 1 - x] = false;
    }
  }
  return m;
}

function plusMask(size: number) {
  const m = makeMask(size, false);
  const mid = Math.floor(size / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const thick = size >= 8 ? 1 : 0;
      const inRow = Math.abs(y - mid) <= thick;
      const inCol = Math.abs(x - mid) <= thick;
      if (inRow || inCol) m[y][x] = true;
    }
  }
  return m;
}

function holesLightMask(size: number) {
  const m = makeMask(size, true);
  const holes =
    size === 9
      ? [
          [2, 2],
          [6, 2],
          [4, 4],
          [2, 6],
          [6, 6],
        ]
      : size === 8
        ? [
            [2, 2],
            [5, 2],
            [3, 4],
            [2, 5],
            [5, 5],
          ]
        : size === 7
          ? [
              [2, 2],
              [4, 2],
              [3, 3],
              [2, 4],
              [4, 4],
            ]
          : [
              [2, 2],
              [3, 3],
              [2, 4],
            ];
  for (const [x, y] of holes) {
    if (m[y] && typeof m[y][x] === "boolean") m[y][x] = false;
  }
  return m;
}

function countActive(mm: boolean[][]) {
  let c = 0;
  for (let y = 0; y < mm.length; y++) {
    for (let x = 0; x < mm[y].length; x++) if (mm[y][x]) c++;
  }
  return c;
}

/**
 * Gem count progression:
 * - Training (1–120): slow, max 8
 * - After 120: can grow to 12
 */
function gemCountByLevel(level: number, maxGem: number) {
  const lvl = Math.max(1, Math.floor(level || 1));

  let want: number;

  if (lvl <= 40) want = 5 + Math.floor((lvl - 1) / 20);        // 5..6
  else if (lvl <= 80) want = 6 + Math.floor((lvl - 41) / 20);  // 6..7
  else if (lvl <= 120) want = 7 + Math.floor((lvl - 81) / 40); // 7..8
  else want = 8 + Math.floor((lvl - 121) / 25);                // 8..12 (slow)

  const cap = lvl <= 120 ? 8 : 12;
  return clamp(want, 5, clamp(Math.min(maxGem, cap), 5, cap));
}

/**
 * Board size progression:
 * - Keep it readable in training: mostly 8, sometimes 7/9
 * - Never below 6
 */
function boardSizeByLevel(level: number) {
  const lvl = Math.max(1, Math.floor(level || 1));

  // Training era: mostly 8
  if (lvl <= 120) {
    const p = (lvl - 1) % 10;
    // 8,8,8,7,8,8,9,8,8,8  (ritkán 7/9)
    if (p === 3) return 7;
    if (p === 6) return 9;
    return 8;
  }

  // After 120: more variety (still safe)
  const p = (lvl - 1) % 12;
  if (p === 2) return 7;
  if (p === 5) return 9;
  if (p === 9) return 7;
  return 8;
}

/**
 * Shape selection:
 * - Training (1–120): mostly full + gentle shapes, holes rarely
 * - After 120: more frequent complex masks
 */
function maskByLevel(level: number, size: number) {
  const lvl = Math.max(1, Math.floor(level || 1));

  const roll = (lvl - 1) % 10;

  if (lvl <= 120) {
    // 70% full, 20% cut corners/diamond, 10% plus, holes only later in training
    if (roll <= 6) return makeMask(size, true);
    if (roll === 7) return cutCornersMask(size);
    if (roll === 8) return diamondMask(size);
    // roll === 9
    // holes csak 80+ után
    return lvl >= 80 ? holesLightMask(size) : plusMask(size);
  }

  // 120+ (kihívások előtt/mellett) – több variáció
  const s = (lvl - 1) % 5;
  if (s === 0) return diamondMask(size);
  if (s === 1) return cutCornersMask(size);
  if (s === 2) return plusMask(size);
  if (s === 3) return holesLightMask(size);
  return makeMask(size, true);
}

export function getLevelConfig(level: number, maxGem: number): LevelConfig {
  const lvl = Math.max(1, Math.floor(level || 1));
  const shard = isShardLevel(lvl);

  const boardSize = clamp(boardSizeByLevel(lvl), 6, 9);
  let mask = maskByLevel(lvl, boardSize);

  // safety: ne legyen túl kicsi aktív terület (auto-shuffle / no-move problémák ellen)
  const active = countActive(mask);
  if (active < 28) {
    mask = makeMask(boardSize, true);
  }

  // shard pályák: kicsit komolyabb shape (de ne törjük el)
  if (shard) {
    // shardon ritkábban lyuk, inkább karakteres shape:
    // ha holes lett volna, cseréljük cutCorners/diamond-ra
    const isTooHole = countActive(mask) < boardSize * boardSize - 6;
    if (isTooHole) {
      mask = (lvl % 2 === 0) ? cutCornersMask(boardSize) : diamondMask(boardSize);
    }
  }

   return {
    boardSize,
    mask,
    gemCount: gemCountByLevel(lvl, maxGem),

    // ✅ kevesebb chest overall (különösen, mert kevés gemtype van -> könnyebb a játék)
    // Boss/shard: ne legyen "eső", csak ritkább jutalom
    chestChanceBoss: shard ? 0.02 : 0.015,

    // Normál: nagyon ritka
    chestChanceNormal: lvl <= 120 ? 0.00035 : 0.0006,
  };
}