import { isShardLevel } from "../../utils/shards";
import { getLevelRules } from "./levels";

export type LevelConfig = {
  boardSize: number;
  mask: boolean[][];
  gemCount: number;
  chestChanceBoss: number;
  chestChanceNormal: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeMask(size: number, fill = true) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function countActive(mm: boolean[][]) {
  let c = 0;
  for (let y = 0; y < mm.length; y++) {
    for (let x = 0; x < mm[y].length; x++) {
      if (mm[y][x]) c++;
    }
  }
  return c;
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
      ? [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]]
      : size === 8
        ? [[2, 2], [5, 2], [3, 4], [2, 5], [5, 5]]
        : size === 7
          ? [[2, 2], [4, 2], [3, 3], [2, 4], [4, 4]]
          : [[2, 2], [3, 3], [2, 4]];

  for (const [x, y] of holes) {
    if (m[y] && typeof m[y][x] === "boolean") m[y][x] = false;
  }

  return m;
}

function stepsMask(size: number) {
  const m = makeMask(size, false);

  for (let y = 0; y < size; y++) {
    const w = clamp(2 + Math.floor((y / (size - 1)) * (size - 2)), 2, size);
    for (let x = 0; x < w; x++) {
      m[size - 1 - y][x] = true;
    }
  }

  return m;
}

function hourglassMask(size: number) {
  const m = makeMask(size, false);

  for (let y = 0; y < size; y++) {
    const t = Math.abs(y - (size - 1) / 2);
    const margin = Math.floor(t);
    for (let x = margin; x < size - margin; x++) {
      m[y][x] = true;
    }
  }

  return m;
}

function splitMask(size: number) {
  const m = makeMask(size, true);

  const mid = Math.floor(size / 2);
  for (let y = 0; y < size; y++) {
    if (m[y]?.[mid] !== undefined) m[y][mid] = false;
    if (size >= 8 && m[y]?.[mid - 1] !== undefined && y % 2 === 0) {
      m[y][mid - 1] = false;
    }
  }

  return m;
}

function lavaMask(size: number) {
  const m = makeMask(size, true);

  const bottomRows = size >= 8 ? 2 : 1;
  for (let y = size - bottomRows; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x + y) % 3 === 1) m[y][x] = false;
    }
  }

  if (size >= 7) {
    const mid = Math.floor(size / 2);
    if (m[mid]?.[1] !== undefined) m[mid][1] = false;
    if (m[mid]?.[size - 2] !== undefined) m[mid][size - 2] = false;
  }

  return m;
}

function bombCollectMask(size: number) {
  return plusMask(size);
}

function rainbowFocusMask(size: number) {
  return hourglassMask(size);
}

function dragonCageMask(size: number) {
  const m = makeMask(size, true);

  const corner = size >= 8 ? 2 : 1;
  for (let y = 0; y < corner; y++) {
    for (let x = 0; x < corner; x++) {
      m[y][x] = false;
      m[y][size - 1 - x] = false;
      m[size - 1 - y][x] = false;
      m[size - 1 - y][size - 1 - x] = false;
    }
  }

  const mid = Math.floor(size / 2);
  const ring = [
    [mid - 2, mid - 1],
    [mid + 2, mid - 1],
    [mid - 2, mid + 1],
    [mid + 2, mid + 1],
  ];

  for (const [x, y] of ring) {
    if (m[y] && typeof m[y][x] === "boolean") m[y][x] = false;
  }

  return m;
}

function gemCountByLevel(level: number, maxGem: number) {
  const lvl = Math.max(1, Math.floor(level || 1));
  let want: number;

  if (lvl <= 40) want = 5 + Math.floor((lvl - 1) / 20);
  else if (lvl <= 80) want = 6 + Math.floor((lvl - 41) / 20);
  else if (lvl <= 120) want = 7 + Math.floor((lvl - 81) / 40);
  else want = 8 + Math.floor((lvl - 121) / 22);

  const cap = lvl <= 120 ? 8 : 12;
  return clamp(want, 5, clamp(Math.min(maxGem, cap), 5, cap));
}

function boardSizeByLevel(level: number) {
  const lvl = Math.max(1, Math.floor(level || 1));

  if (lvl <= 120) {
    const p = (lvl - 1) % 10;
    if (p === 3) return 7;
    if (p === 6) return 9;
    return 8;
  }

  if (lvl <= 200) {
    const p = (lvl - 1) % 12;
    if (p === 2) return 7;
    if (p === 5) return 9;
    if (p === 9) return 7;
    return 8;
  }

  const p = (lvl - 201) % 10;
  if (p === 0 || p === 1 || p === 2) return 6;
  if (p === 3 || p === 4) return 7;
  if (p === 5 || p === 6 || p === 7) return 8;
  return 9;
}

function maskByLevel(level: number, size: number) {
  const lvl = Math.max(1, Math.floor(level || 1));
  const shard = isShardLevel(lvl);
  const rules = getLevelRules(lvl);
  const challengeType = rules.challenge?.type ?? "none";

  if (challengeType === "lava") {
    let lava = lavaMask(size);
    if (countActive(lava) < 28) lava = cutCornersMask(size);
    return lava;
  }

  if (challengeType === "bomb_collect") {
    let bombMap = bombCollectMask(size);
    if (countActive(bombMap) < 28) bombMap = plusMask(size);
    return bombMap;
  }

  if (challengeType === "rainbow_focus") {
    let rainbowMap = rainbowFocusMask(size);
    if (countActive(rainbowMap) < 28) rainbowMap = hourglassMask(size);
    return rainbowMap;
  }

  if (lvl >= 351 && lvl % 25 === 0) {
    let dragonMap = dragonCageMask(size);
    if (countActive(dragonMap) < 28) dragonMap = cutCornersMask(size);
    return dragonMap;
  }

  const block = Math.floor((lvl - 1) / 30);
  const inBlock = (lvl - 1) % 30;

  const sets: Array<Array<(s: number) => boolean[][]>> = [
    [makeMask, cutCornersMask, diamondMask],
    [makeMask, plusMask, cutCornersMask],
    [makeMask, holesLightMask, diamondMask],
    [makeMask, stepsMask, cutCornersMask],
    [makeMask, hourglassMask, diamondMask],
    [makeMask, splitMask, plusMask],
    [makeMask, cutCornersMask, hourglassMask],
    [makeMask, stepsMask, holesLightMask],
    [makeMask, diamondMask, splitMask],
    [makeMask, plusMask, hourglassMask],
  ];

  const pack = sets[block % sets.length];
  const idx = Math.floor(inBlock / 8) % pack.length;

  const chosenFn = pack[idx];
  let mask = chosenFn(size);

  if (lvl <= 120 && lvl < 80 && chosenFn === holesLightMask) {
    mask = plusMask(size);
  }

  if (shard) {
    const active = countActive(mask);
    if (active < size * size - 6) {
      mask = lvl % 2 === 0 ? cutCornersMask(size) : diamondMask(size);
    }
  }

  return mask;
}

export function getLevelConfig(level: number, maxGem: number): LevelConfig {
  const lvl = Math.max(1, Math.floor(level || 1));
  const shard = isShardLevel(lvl);

  const boardSize = clamp(boardSizeByLevel(lvl), 6, 9);
  let mask = maskByLevel(lvl, boardSize);

  const active = countActive(mask);
  if (active < 28) mask = makeMask(boardSize, true);

  return {
    boardSize,
    mask,
    gemCount: gemCountByLevel(lvl, maxGem),
    chestChanceBoss: shard ? 0.02 : 0.015,
    chestChanceNormal: lvl <= 120 ? 0.00035 : 0.0006,
  };
}