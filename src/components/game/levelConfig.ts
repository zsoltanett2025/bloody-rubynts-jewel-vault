// src/components/game/levelConfig.ts

export type LevelConfig = {
  boardSize: number;         // 7 / 8 / 9
  mask: boolean[][];         // true = van cella, false = lyuk
  gemCount: number;          // 5..12 (maxGem-hez clamp)
  chestChanceBoss: number;   // boss pálya chest esély
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
  const k = size >= 9 ? 3 : 2;
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
      const thick = size >= 7 ? 1 : 0;
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
        : [
            [2, 2],
            [4, 2],
            [3, 4],
            [2, 4],
          ];
  for (const [x, y] of holes) {
    if (m[y] && typeof m[y][x] === "boolean") m[y][x] = false;
  }
  return m;
}

function gemCountByLevel(level: number, maxGem: number) {
  const want = 5 + Math.floor((level - 1) / 10);
  return clamp(want, 5, clamp(maxGem, 5, 12));
}

export function getLevelConfig(level: number, maxGem: number): LevelConfig {
  const lvl = Math.max(1, Math.floor(level || 1));

  const phase = Math.floor((lvl - 1) / 10) % 3;
  const boardSize = phase === 0 ? 8 : phase === 1 ? 7 : 9;

  const shape = (lvl - 1) % 5;
  let mask: boolean[][];

  if (shape === 0) mask = diamondMask(boardSize);
  else if (shape === 1) mask = cutCornersMask(boardSize);
  else if (shape === 2) mask = plusMask(boardSize);
  else if (shape === 3) mask = holesLightMask(boardSize);
  else mask = makeMask(boardSize, true);

  function countActive(mm: boolean[][]) {
    let c = 0;
    for (let y = 0; y < mm.length; y++) for (let x = 0; x < mm[y].length; x++) if (mm[y][x]) c++;
    return c;
  }
  const active = countActive(mask);
  if (active < 24) {
    mask = makeMask(boardSize, true);
  }

  return {
    boardSize,
    mask,
    gemCount: gemCountByLevel(lvl, maxGem),
    chestChanceBoss: 0.05,
    chestChanceNormal: 0.001,
  };
}
