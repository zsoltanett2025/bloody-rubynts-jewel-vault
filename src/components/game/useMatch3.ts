// src/components/game/useMatch3.ts
import { useState, useCallback, useEffect, useRef } from "react";
import { playSound, type SfxName } from "../../utils/audioManager";
import { getShardConfig } from "../../utils/shards";
import { getLevelConfig } from "./levelConfig";

console.log("useMatch3 loaded v-DEAD-WATCHDOG-FIXED-11PLUS-OK");

export type GemType = "chest" | (string & {});
export type PowerType = "stripe_h" | "stripe_v" | "bomb" | "rainbow";

export interface Gem {
  id: string;
  type: GemType;
  power?: PowerType;
  x: number;
  y: number;
}

export const GEM_TYPES_ALL: GemType[] = ["ruby", "blood", "amethyst", "onyx", "silver"];

const SWAP_MS = 160;
const CLEAR_MS = 280;
const GRAVITY_MS = 420;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GoalProgress = {
  score: number;
  chests: number;
  cleared: Record<string, number>;
};

export type ScorePop = {
  id: string;
  x: number;
  y: number;
  value: number;
};

// ---------- seeded rng ----------
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: T[], rnd: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getActiveGemTypesForLevel(level: number, count: number): GemType[] {
  const rnd = mulberry32(100000 + level * 1337);
  const shuffled = shuffleWithRng(GEM_TYPES_ALL, rnd);
  return shuffled.slice(0, clamp(count, 1, shuffled.length));
}

const generateRandomGem = (x: number, y: number, activeTypes: GemType[], chanceForChest = 0): Gem => {
  const isChest = Math.random() < chanceForChest;
  const pool = activeTypes.length > 0 ? activeTypes : GEM_TYPES_ALL;

  return {
    id: Math.random().toString(36).slice(2, 11),
    type: isChest ? "chest" : pool[Math.floor(Math.random() * pool.length)],
    x,
    y,
  };
};

const buildGrid = (size: number, mask: boolean[][], gems: Gem[]) => {
  const grid: (Gem | null)[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  for (const g of gems) {
    if (g.x >= 0 && g.x < size && g.y >= 0 && g.y < size) {
      if (mask[g.y]?.[g.x]) grid[g.y][g.x] = g;
    }
  }
  return grid;
};

const applyGravityAndRefill = (
  gems: Gem[],
  activeTypes: GemType[],
  size: number,
  mask: boolean[][],
  chestChanceBoss: number,
  chestChanceNormal: number,
  lvl: number
) => {
  const grid = buildGrid(size, mask, gems);
  const result: Gem[] = [];

  for (let x = 0; x < size; x++) {
    const col: Gem[] = [];
    const activeYs: number[] = [];

    for (let y = size - 1; y >= 0; y--) {
      if (!mask[y]?.[x]) continue;
      activeYs.push(y);
      const g = grid[y][x];
      if (g) col.push(g);
    }

    let writeIndex = 0;
    for (let i = 0; i < activeYs.length; i++) {
      const y = activeYs[i];
      if (writeIndex < col.length) {
        const g = col[writeIndex++];
        result.push({ ...g, x, y });
      } else {
        const chestChance = lvl % 10 === 0 ? chestChanceBoss : chestChanceNormal;
        result.push(generateRandomGem(x, y, activeTypes, chestChance));
      }
    }
  }

  return result;
};

const findMatches = (gems: Gem[], size: number, mask: boolean[][]): Gem[] => {
  const grid = buildGrid(size, mask, gems);
  const matches = new Set<Gem>();

  // Horizontal
  for (let y = 0; y < size; y++) {
    let run: Gem[] = [];
    for (let x = 0; x < size; x++) {
      const cur = grid[y][x];

      if (!cur || cur.type === "chest") {
        if (run.length >= 3) run.forEach((g) => matches.add(g));
        run = [];
        continue;
      }

      if (run.length === 0 || run[0].type === cur.type) run.push(cur);
      else {
        if (run.length >= 3) run.forEach((g) => matches.add(g));
        run = [cur];
      }
    }
    if (run.length >= 3) run.forEach((g) => matches.add(g));
  }

  // Vertical
  for (let x = 0; x < size; x++) {
    let run: Gem[] = [];
    for (let y = 0; y < size; y++) {
      const cur = grid[y][x];

      if (!cur || cur.type === "chest") {
        if (run.length >= 3) run.forEach((g) => matches.add(g));
        run = [];
        continue;
      }

      if (run.length === 0 || run[0].type === cur.type) run.push(cur);
      else {
        if (run.length >= 3) run.forEach((g) => matches.add(g));
        run = [cur];
      }
    }
    if (run.length >= 3) run.forEach((g) => matches.add(g));
  }

  return Array.from(matches);
};

// --- Dead-board helpers ---
function normalizeGemsToMask(gems: Gem[], size: number, mask: boolean[][]) {
  return gems.filter((g) => g.x >= 0 && g.x < size && g.y >= 0 && g.y < size && !!mask[g.y]?.[g.x]);
}

function countPossibleMoves(gems: Gem[], size: number, mask: boolean[][]) {
  let count = 0;

  const cleaned = normalizeGemsToMask(gems, size, mask);
  const grid = buildGrid(size, mask, cleaned);

  const dirs: Array<[number, number]> = [
    [1, 0],
    [0, 1],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y]?.[x]) continue;

      const current = grid[y][x];
      if (!current || current.type === "chest") continue;

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        if (!mask[ny]?.[nx]) continue;

        const other = grid[ny][nx];
        if (!other || other.type === "chest") continue;

        // swap
        grid[y][x] = other;
        grid[ny][nx] = current;

        const swapped: Gem[] = [];
        for (let yy = 0; yy < size; yy++) {
          for (let xx = 0; xx < size; xx++) {
            if (!mask[yy]?.[xx]) continue;
            const g = grid[yy][xx];
            if (g) swapped.push({ ...g, x: xx, y: yy });
          }
        }

        if (findMatches(swapped, size, mask).length > 0) count++;

        // revert
        grid[y][x] = current;
        grid[ny][nx] = other;
      }
    }
  }

  return count;
}

function hasAnyMove(gems: Gem[], size: number, mask: boolean[][]) {
  return countPossibleMoves(gems, size, mask) > 0;
}

function rerollPlayable(size: number, mask: boolean[][], pool: GemType[], minMoves: number, maxTries = 420): Gem[] {
  const activePositions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (mask[y]?.[x]) activePositions.push({ x, y });

  let last: Gem[] = [];

  for (let t = 0; t < maxTries; t++) {
    const gems: Gem[] = [];
    for (const p of activePositions) gems.push(generateRandomGem(p.x, p.y, pool, 0));

    if (findMatches(gems, size, mask).length > 0) {
      last = gems;
      continue;
    }

    const moves = countPossibleMoves(gems, size, mask);
    if (moves >= minMoves) return gems;

    last = gems;
  }

  return last;
}

function shuffleToPlayable(
  gems: Gem[],
  size: number,
  mask: boolean[][],
  pool: GemType[],
  minMoves: number,
  maxTries = 180
): Gem[] {
  const activePositions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (mask[y]?.[x]) activePositions.push({ x, y });

  if (activePositions.length <= 1) return gems;

  const base = normalizeGemsToMask(gems, size, mask).map((g) => ({ ...g }));
  if (base.length !== activePositions.length) {
    return rerollPlayable(size, mask, pool, minMoves, 520);
  }

  for (let t = 0; t < maxTries; t++) {
    const pos = [...activePositions];
    for (let i = pos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pos[i], pos[j]] = [pos[j], pos[i]];
    }

    const shuffled = base.map((g, i) => ({ ...g, x: pos[i].x, y: pos[i].y }));

    if (findMatches(shuffled, size, mask).length > 0) continue;

    const moves = countPossibleMoves(shuffled, size, mask);
    if (moves >= minMoves) return shuffled;
  }

  return rerollPlayable(size, mask, pool, minMoves, 520);
}

function getGemCountForLevel(level: number) {
  if (level <= 10) return 5;
  const want = 5 + Math.floor((level - 1) / 10);
  return clamp(want, 5, Math.min(12, GEM_TYPES_ALL.length));
}

function findFirstMove(gems: Gem[], size: number, mask: boolean[][]) {
  const cleaned = normalizeGemsToMask(gems, size, mask);
  const grid = buildGrid(size, mask, cleaned);

  const dirs: Array<[number, number]> = [
    [1, 0],
    [0, 1],
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y]?.[x]) continue;
      const a = grid[y][x];
      if (!a || a.type === "chest") continue;

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
        if (!mask[ny]?.[nx]) continue;

        const b = grid[ny][nx];
        if (!b || b.type === "chest") continue;

        // swap
        grid[y][x] = b;
        grid[ny][nx] = a;

        const swapped: Gem[] = [];
        for (let yy = 0; yy < size; yy++) {
          for (let xx = 0; xx < size; xx++) {
            if (!mask[yy]?.[xx]) continue;
            const g = grid[yy][xx];
            if (g) swapped.push({ ...g, x: xx, y: yy });
          }
        }

        const ok = findMatches(swapped, size, mask).length > 0;

        // revert
        grid[y][x] = a;
        grid[ny][nx] = b;

        if (ok) return { from: { x, y, type: a.type }, to: { x: nx, y: ny, type: b.type } };
      }
    }
  }

  return null;
}

/* ===========================
   ✅ POWERUP HELPERS
   =========================== */

type CellKey = string;
const keyOf = (x: number, y: number) => `${x},${y}`;

function inBounds(x: number, y: number, size: number) {
  return x >= 0 && y >= 0 && x < size && y < size;
}

function analyzeMatchesAndPower(
  gems: Gem[],
  size: number,
  mask: boolean[][]
): { matches: Gem[]; createPower?: { keepId: string; power: PowerType } } {
  const grid = buildGrid(size, mask, gems);

  const hLen: Record<CellKey, number> = {};
  const vLen: Record<CellKey, number> = {};

  for (let y = 0; y < size; y++) {
    let run: Gem[] = [];
    for (let x = 0; x < size; x++) {
      const cur = grid[y][x];
      if (!cur || cur.type === "chest") {
        if (run.length >= 3) for (const g of run) hLen[keyOf(g.x, g.y)] = run.length;
        run = [];
        continue;
      }
      if (run.length === 0 || run[0].type === cur.type) run.push(cur);
      else {
        if (run.length >= 3) for (const g of run) hLen[keyOf(g.x, g.y)] = run.length;
        run = [cur];
      }
    }
    if (run.length >= 3) for (const g of run) hLen[keyOf(g.x, g.y)] = run.length;
  }

  for (let x = 0; x < size; x++) {
    let run: Gem[] = [];
    for (let y = 0; y < size; y++) {
      const cur = grid[y][x];
      if (!cur || cur.type === "chest") {
        if (run.length >= 3) for (const g of run) vLen[keyOf(g.x, g.y)] = run.length;
        run = [];
        continue;
      }
      if (run.length === 0 || run[0].type === cur.type) run.push(cur);
      else {
        if (run.length >= 3) for (const g of run) vLen[keyOf(g.x, g.y)] = run.length;
        run = [cur];
      }
    }
    if (run.length >= 3) for (const g of run) vLen[keyOf(g.x, g.y)] = run.length;
  }

  const matchKeys = new Set<CellKey>();
  for (const k of Object.keys(hLen)) if ((hLen[k] ?? 0) >= 3) matchKeys.add(k);
  for (const k of Object.keys(vLen)) if ((vLen[k] ?? 0) >= 3) matchKeys.add(k);

  const matches: Gem[] = [];
  const byKey: Record<CellKey, Gem> = {};
  for (const g of gems) byKey[keyOf(g.x, g.y)] = g;
  for (const k of matchKeys) {
    const g = byKey[k];
    if (g) matches.push(g);
  }

  if (matches.length === 0) return { matches };

  let bestBomb: { k: CellKey; score: number } | null = null;
  for (const k of matchKeys) {
    const hl = hLen[k] ?? 0;
    const vl = vLen[k] ?? 0;
    if (hl >= 3 && vl >= 3) {
      const s = hl + vl;
      if (!bestBomb || s > bestBomb.score) bestBomb = { k, score: s };
    }
  }
  if (bestBomb) {
    const g = byKey[bestBomb.k];
    if (g && g.type !== "chest") return { matches, createPower: { keepId: g.id, power: "bomb" } };
  }

  let bestStripe: { k: CellKey; len: number; orient: "h" | "v" } | null = null;
  for (const k of matchKeys) {
    const hl = hLen[k] ?? 0;
    const vl = vLen[k] ?? 0;

    if (hl >= 4) if (!bestStripe || hl > bestStripe.len) bestStripe = { k, len: hl, orient: "h" };
    if (vl >= 4) if (!bestStripe || vl > bestStripe.len) bestStripe = { k, len: vl, orient: "v" };
  }
  if (bestStripe) {
    const g = byKey[bestStripe.k];
    if (g && g.type !== "chest") {
      return {
        matches,
        createPower: { keepId: g.id, power: bestStripe.orient === "h" ? "stripe_h" : "stripe_v" },
      };
    }
  }

  return { matches };
}

function expandClearIdsByPowers(allGems: Gem[], size: number, mask: boolean[][], clearIds: Set<string>) {
  const grid = buildGrid(size, mask, allGems);

  const gemById = new Map<string, Gem>();
  for (const g of allGems) gemById.set(g.id, g);

  const visitedPower = new Set<string>();
  const queue: string[] = Array.from(clearIds);

  const addByCell = (x: number, y: number) => {
    if (!inBounds(x, y, size)) return;
    if (!mask[y]?.[x]) return;
    const g = grid[y][x];
    if (!g) return;
    clearIds.add(g.id);
  };

  while (queue.length) {
    const id = queue.shift()!;
    const g = gemById.get(id);
    if (!g || !g.power) continue;
    if (visitedPower.has(g.id)) continue;
    visitedPower.add(g.id);

    if (g.power === "stripe_h") {
      for (let x = 0; x < size; x++) addByCell(x, g.y);
    } else if (g.power === "stripe_v") {
      for (let y = 0; y < size; y++) addByCell(g.x, y);
    } else if (g.power === "bomb") {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) addByCell(g.x + dx, g.y + dy);
    }

    for (const nid of clearIds) {
      if (!visitedPower.has(nid)) queue.push(nid);
    }
  }
}

/* ===========================
   ✅ HOOK
   =========================== */

// ✅ active = csak akkor fusson a watchdog/auto shuffle, amikor tényleg GAME képernyőn vagyunk
export const useMatch3 = (active: boolean = true) => {
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);

  // ✅ Stars ref (mindig friss, UI-nak hasznos)
  const starsRef = useRef(0);
  useEffect(() => {
    starsRef.current = stars;
  }, [stars]);

  const [boardSize, setBoardSize] = useState<number>(8);
  const [mask, setMask] = useState<boolean[][]>(() =>
    Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => true))
  );

  const boardSizeRef = useRef(boardSize);
  const maskRef = useRef(mask);
  useEffect(() => {
    boardSizeRef.current = boardSize;
  }, [boardSize]);
  useEffect(() => {
    maskRef.current = mask;
  }, [mask]);

  const [gems, setGems] = useState<Gem[]>([]);
  const gemsRef = useRef<Gem[]>([]);
  useEffect(() => {
    gemsRef.current = gems;
  }, [gems]);

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const [moves, setMoves] = useState(20);
  const movesRef = useRef(20);
  useEffect(() => {
    movesRef.current = moves;
  }, [moves]);

  const [targetScore, setTargetScore] = useState(1000);
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const [mode, setMode] = useState<"moves" | "timed">("moves");
  const [timeLimitSec, setTimeLimitSec] = useState<number>(0);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);

  const [activeTypes, setActiveTypes] = useState<GemType[]>(() => getActiveGemTypesForLevel(1, 5));
  const activeTypesRef = useRef<GemType[]>(activeTypes);
  useEffect(() => {
    activeTypesRef.current = activeTypes;
  }, [activeTypes]);

  const [selectedGem, setSelectedGem] = useState<Gem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundChests, setFoundChests] = useState(0);

  const [shuffleUses, setShuffleUses] = useState(1);
  const shuffleUsesRef = useRef(1);
  useEffect(() => {
    shuffleUsesRef.current = shuffleUses;
  }, [shuffleUses]);

  const [progress, setProgress] = useState<GoalProgress>({ score: 0, chests: 0, cleared: {} });
  const progressRef = useRef<GoalProgress>({ score: 0, chests: 0, cleared: {} });
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const [flashIds, setFlashIds] = useState<string[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);

  const processingRef = useRef(false);

  const safePlay = useCallback((name: SfxName) => {
    try {
      playSound(name);
    } catch {}
  }, []);

  // ✅ dead-board timeout ref (ne fusson Map/Menu alatt)
  const shuffleTimeoutRef = useRef<number | null>(null);

  // ✅ ha nem aktív a játék képernyő, állítsuk le a pending shuffle-t
  useEffect(() => {
    if (active) return;

    if (shuffleTimeoutRef.current) {
      window.clearTimeout(shuffleTimeoutRef.current);
      shuffleTimeoutRef.current = null;
    }

    // UI state takarítás (biztonságos)
    setIsShuffling(false);
    setSelectedGem(null);
  }, [active]);

  // ✅ cleanup unmount
  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) window.clearTimeout(shuffleTimeoutRef.current);
    };
  }, []);

  // ✅ mindig state + ref együtt (HUD ne “0”-zzon)
  const setMovesSynced = useCallback((next: number | ((m: number) => number)) => {
    setMoves((prev) => {
      const value = typeof next === "function" ? (next as (m: number) => number)(prev) : next;
      const clamped = Math.max(0, Math.floor(value));
      movesRef.current = clamped;
      return clamped;
    });
  }, []);

  const setScoreSynced = useCallback((next: number | ((s: number) => number)) => {
    setScore((prev) => {
      const value = typeof next === "function" ? (next as (s: number) => number)(prev) : next;
      const v = Math.max(0, Math.floor(value));
      scoreRef.current = v;
      return v;
    });
  }, []);

  const triggerMatchFx = useCallback((ids: string[], pops: ScorePop[]) => {
    setFlashIds(ids);

    if (pops.length) setScorePops((prev) => [...prev, ...pops]);

    window.setTimeout(() => setFlashIds([]), 220);

    if (pops.length) {
      const popIds = new Set(pops.map((p) => p.id));
      window.setTimeout(() => {
        setScorePops((prev) => prev.filter((p) => !popIds.has(p.id)));
      }, 850);
    }
  }, []);

  const addScore = useCallback(
    (add: number) => {
      setScoreSynced((prev) => prev + add);

      setProgress((p) => {
        const next: GoalProgress = { ...p, score: p.score + add };
        progressRef.current = next;
        return next;
      });
    },
    [setScoreSynced]
  );

  const countCleared = useCallback((clearedGems: Gem[]): void => {
    const clearedDelta: Record<string, number> = {};
    for (const m of clearedGems) {
      if (m.type === "chest") continue;
      clearedDelta[String(m.type)] = (clearedDelta[String(m.type)] ?? 0) + 1;
    }

    setProgress((p) => {
      const nextCleared = { ...p.cleared };
      for (const k of Object.keys(clearedDelta)) {
        nextCleared[k] = (nextCleared[k] ?? 0) + (clearedDelta[k] ?? 0);
      }
      const next: GoalProgress = { ...p, cleared: nextCleared };
      progressRef.current = next;
      return next;
    });
  }, []);

  // Timer tick
  useEffect(() => {
    if (mode !== "timed") return;
    if (gameOver) return;
    if (timeLeftSec <= 0) return;

    const id = window.setInterval(() => setTimeLeftSec((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [mode, gameOver, timeLeftSec]);

  useEffect(() => {
    if (mode !== "timed") return;
    if (timeLeftSec > 0) return;
    setGameOver(true);
  }, [mode, timeLeftSec]);

  const ensurePlayable = useCallback((g: Gem[], lvl: number) => {
    const size = boardSizeRef.current;
    const m = maskRef.current;
    const pool = activeTypesRef.current;

    const minMoves = lvl >= 11 ? 6 : 1;

    if (findMatches(g, size, m).length === 0 && countPossibleMoves(g, size, m) >= minMoves) return g;

    const shuffled = shuffleToPlayable(g, size, m, pool, minMoves, 220);
    if (findMatches(shuffled, size, m).length === 0 && countPossibleMoves(shuffled, size, m) >= minMoves) {
      return shuffled;
    }

    return rerollPlayable(size, m, pool, minMoves, 520);
  }, []);

  const processMatches = useCallback(
    async (currentGems: Gem[], lvl: number) => {
      if (processingRef.current) return;

      processingRef.current = true;
      setIsProcessing(true);

      let activeGems = [...currentGems];
      let combo = 1;

      const size = boardSizeRef.current;
      const m = maskRef.current;

      try {
        let cascades = 0;
        const MAX_CASCADES = 30;

        while (true) {
          const { matches, createPower } = analyzeMatchesAndPower(activeGems, size, m);
          if (matches.length === 0) break;

          cascades++;
          if (cascades > MAX_CASCADES) {
            activeGems = ensurePlayable(activeGems, lvl);
            setGems([...activeGems]);
            break;
          }

          const clearIds = new Set<string>(matches.map((g) => g.id));

          if (createPower) {
            clearIds.delete(createPower.keepId);
            activeGems = activeGems.map((g) => (g.id === createPower.keepId ? { ...g, power: createPower.power } : g));
          }

          expandClearIdsByPowers(activeGems, size, m, clearIds);

          const clearedGems = activeGems.filter((g) => clearIds.has(g.id));

          triggerMatchFx(
            Array.from(clearIds),
            clearedGems.slice(0, 8).map((gg) => ({
              id: `${Date.now()}_${gg.id}`,
              x: gg.x,
              y: gg.y,
              value: 10 * combo,
            }))
          );

          addScore(clearedGems.length * 10 * combo);
          countCleared(clearedGems);

          safePlay(combo === 1 ? "match" : "combo");
          combo++;

          activeGems = activeGems.filter((g) => !clearIds.has(g.id));

          setGems([...activeGems]);
          await wait(CLEAR_MS);

          const cfg = getLevelConfig(lvl, GEM_TYPES_ALL.length);
          activeGems = applyGravityAndRefill(
            activeGems,
            activeTypesRef.current,
            size,
            m,
            cfg.chestChanceBoss,
            cfg.chestChanceNormal,
            lvl
          );

          setGems([...activeGems]);
          await wait(GRAVITY_MS);
        }

        activeGems = ensurePlayable(activeGems, lvl);
        setGems([...activeGems]);
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    },
    [addScore, countCleared, safePlay, ensurePlayable, triggerMatchFx]
  );

  const startNewGame = useCallback(
    (newLevel: number) => {
      const lvl = Math.max(1, Math.floor(Number(newLevel) || 1));

      setLevel(lvl);
      levelRef.current = lvl;

      setGameOver(false);
      setStars(0);
      setShuffleUses(1);
      shuffleUsesRef.current = 1;

      setFlashIds([]);
      setScorePops([]);

      const cfg = getLevelConfig(lvl, GEM_TYPES_ALL.length);
      setBoardSize(cfg.boardSize);
      setMask(cfg.mask);
      boardSizeRef.current = cfg.boardSize;
      maskRef.current = cfg.mask;

      const pool = getActiveGemTypesForLevel(lvl, cfg.gemCount);
      setActiveTypes(pool);

      const shardCfg = getShardConfig(lvl);

      // ✅ MOVES: egy helyen számoljuk ki + state+ref sync
      let nextMoves = 0;

      if (shardCfg) {
        setMode("timed");
        setTimeLimitSec(shardCfg.timeLimitSec);
        setTimeLeftSec(shardCfg.timeLimitSec);
        const jitter = Math.random() < 0.5 ? 0 : 1;
        nextMoves = shardCfg.moveLimit + jitter;
      } else {
        setMode("moves");
        setTimeLimitSec(0);
        setTimeLeftSec(0);

        const EARLY_MOVES: Record<number, number> = {
          1: 12,
          2: 14,
          3: 16,
          4: 18,
          5: 20,
        };

        if (EARLY_MOVES[lvl]) {
          nextMoves = EARLY_MOVES[lvl];
        } else {
          const base = 32 - Math.floor((cfg.gemCount - 5) * 1.5);
          const rnd = Math.floor(Math.random() * 5) - 2;
          nextMoves = clamp(base + rnd, 18, 34);
        }
      }

      setMovesSynced(nextMoves);

      setTargetScore(500 + lvl * 250);

      setScoreSynced(0);

      setFoundChests(0);
      setSelectedGem(null);

      const resetProgress: GoalProgress = { score: 0, chests: 0, cleared: {} };
      setProgress(resetProgress);
      progressRef.current = resetProgress;

      const minMoves = lvl >= 11 ? 6 : 1;
      const fresh = rerollPlayable(cfg.boardSize, cfg.mask, pool, minMoves, 700);
      const clean = ensurePlayable(fresh, lvl);
      setGems(clean);

      window.setTimeout(() => {
        if (processingRef.current) return;
        if (boardSizeRef.current !== cfg.boardSize) return;

        const size = boardSizeRef.current;
        const m = maskRef.current;

        if (findMatches(clean, size, m).length > 0) {
          processMatches(clean, lvl);
        }
      }, 0);
    },
    [processMatches, ensurePlayable, setMovesSynced, setScoreSynced]
  );

  const shuffleBoard = useCallback(async () => {
    if (shuffleUsesRef.current <= 0 || isProcessing || isShuffling) return;

    try {
      const size = boardSizeRef.current;
      const m = maskRef.current;

      const minMoves = levelRef.current >= 11 ? 6 : 1;
      const current = gemsRef.current.map((g) => ({ ...g }));
      const shuffled = shuffleToPlayable(current, size, m, activeTypesRef.current, minMoves, 260);

      setShuffleUses((u) => u - 1);
      setSelectedGem(null);
      setGems(shuffled);

      await wait(220);
      await processMatches(shuffled, levelRef.current);
    } catch {}
  }, [isProcessing, isShuffling, processMatches]);

  const selectGem = useCallback(
    async (gem: Gem) => {
      if (!active) return;

      if (isProcessing || isShuffling) return;
      if (movesRef.current <= 0) return;
      if (mode === "timed" && timeLeftSec <= 0) return;
      if (gameOver) return;

      const size = boardSizeRef.current;
      const m = maskRef.current;
      const current = gemsRef.current;

      if (gem.type === "chest") {
        safePlay(Math.random() < 0.5 ? "chest_blue" : "chest_purple");

        setFoundChests((c) => c + 1);
        setProgress((p) => {
          const next: GoalProgress = { ...p, chests: p.chests + 1 };
          progressRef.current = next;
          return next;
        });

        triggerMatchFx([gem.id], [{ id: `${Date.now()}_${gem.id}_CHEST`, x: gem.x, y: gem.y, value: 500 }]);

        addScore(500);

        const afterClear = current.filter((g) => g.id !== gem.id);
        const cfg = getLevelConfig(levelRef.current, GEM_TYPES_ALL.length);

        let refilled = applyGravityAndRefill(
          afterClear,
          activeTypesRef.current,
          size,
          m,
          cfg.chestChanceBoss,
          cfg.chestChanceNormal,
          levelRef.current
        );

        setGems(refilled);
        await wait(CLEAR_MS);
        await processMatches(refilled, levelRef.current);

        setSelectedGem(null);
        return;
      }

      if (!selectedGem) {
        setSelectedGem(gem);
        return;
      }
      if (selectedGem.id === gem.id) {
        setSelectedGem(null);
        return;
      }

      const adjacent =
        (Math.abs(selectedGem.x - gem.x) === 1 && selectedGem.y === gem.y) ||
        (Math.abs(selectedGem.y - gem.y) === 1 && selectedGem.x === gem.x);

      if (!adjacent) {
        setSelectedGem(gem);
        return;
      }

      setIsProcessing(true);

      const original = gemsRef.current.map((g) => ({ ...g }));
      const swapped = original.map((g) => {
        if (g.id === selectedGem.id) return { ...g, x: gem.x, y: gem.y };
        if (g.id === gem.id) return { ...g, x: selectedGem.x, y: selectedGem.y };
        return g;
      });

      setGems(swapped);
      await wait(SWAP_MS);

      const matches = findMatches(swapped, size, m);

      // -----------------------------
      // ❌ NINCS MATCH
      // -----------------------------
      if (matches.length === 0) {
        const a = swapped.find((gg) => gg.id === selectedGem.id);
        const b = swapped.find((gg) => gg.id === gem.id);

        const hasPower = !!a?.power || !!b?.power;

        // ✅ Simán rossz swap (nincs power)
        if (!hasPower) {
          setGems(original);
          setSelectedGem(null);
          setIsProcessing(false);

          // ✅ dead-board -> automata keverés, hogy legyen lépés
          if (!hasAnyMove(original, size, m)) {
            setIsShuffling(true);
            setSelectedGem(null);

            const fixed = ensurePlayable(original, levelRef.current);

            if (shuffleTimeoutRef.current) window.clearTimeout(shuffleTimeoutRef.current);
            shuffleTimeoutRef.current = window.setTimeout(() => {
              if (!active) return;
              setGems(fixed);
              setIsShuffling(false);
            }, 300);

            return;
          }

          return;
        }

        // ✅ Power swap (match nélkül is robbanhat)
        const powers = [a?.power, b?.power].filter(Boolean) as PowerType[];

        if (powers.includes("bomb")) safePlay("bomb");
        else if (powers.includes("stripe_h")) safePlay("stripe_h");
        else if (powers.includes("stripe_v")) safePlay("stripe_v");
        else if (powers.includes("rainbow")) safePlay("mega_bomb");
        else safePlay("click");

        const clearIds = new Set<string>();
        if (a?.power) clearIds.add(a.id);
        if (b?.power) clearIds.add(b.id);

        expandClearIdsByPowers(swapped, size, m, clearIds);

        const cleared = swapped.filter((gg) => clearIds.has(gg.id));
        triggerMatchFx(
          Array.from(clearIds),
          cleared.slice(0, 8).map((gg) => ({
            id: `${Date.now()}_${gg.id}_P`,
            x: gg.x,
            y: gg.y,
            value: 20,
          }))
        );

        addScore(cleared.length * 12);
        countCleared(cleared);

        let after = swapped.filter((gg) => !clearIds.has(gg.id));

        const cfg = getLevelConfig(levelRef.current, GEM_TYPES_ALL.length);
        after = applyGravityAndRefill(
          after,
          activeTypesRef.current,
          size,
          m,
          cfg.chestChanceBoss,
          cfg.chestChanceNormal,
          levelRef.current
        );

        setGems(after);
        await wait(GRAVITY_MS);
        await processMatches(after, levelRef.current);

        setIsProcessing(false);
        setSelectedGem(null);
        return;
      }

      // -----------------------------
      // ✅ VAN MATCH
      // -----------------------------
      safePlay("click");
      setMovesSynced((mm) => Math.max(0, mm - 1));
      setSelectedGem(null);

      addScore(5);
      await processMatches(swapped, levelRef.current);

      setIsProcessing(false);
    },
    [
      active,
      addScore,
      countCleared,
      processMatches,
      safePlay,
      selectedGem,
      mode,
      timeLeftSec,
      gameOver,
      isProcessing,
      isShuffling,
      ensurePlayable,
      triggerMatchFx,
      setMovesSynced,
    ]
  );

  // ✅ Stars only (NO "won" flag!)
  useEffect(() => {
    if (gameOver) return;

    const star1 = targetScore;
    const star2 = Math.floor(targetScore * 1.5);
    const star3 = Math.floor(targetScore * 2);

    const earnedStars =
      progress.score >= star3 ? 3 : progress.score >= star2 ? 2 : progress.score >= star1 ? 1 : 0;

    if (earnedStars !== stars) setStars(earnedStars);
  }, [gameOver, progress.score, targetScore, stars]);

  // ✅ WATCHDOG: csak GAME képernyőn fusson
  const deadFixingRef = useRef(false);
  const lastWdRef = useRef<{ level: number; possible: number; dead: boolean } | null>(null);

  const deadStreakRef = useRef(0);
  const lastShuffleAtRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => {
      const size = boardSizeRef.current;
      const m = maskRef.current;
      const g = gemsRef.current;

      if (!active) return;

      if (deadFixingRef.current) return;
      if (processingRef.current) return;
      if (isProcessing || gameOver) return;
      if (selectedGem) return;
      if (!g || g.length === 0) return;

      const possible = countPossibleMoves(g, size, m);
      const dead = possible <= 0;

      const last = lastWdRef.current;
      const changed = !last || last.level !== levelRef.current || last.possible !== possible || last.dead !== dead;

      if (dead || changed) {
        const hint = findFirstMove(g, size, m);
        console.log("[WATCHDOG]", {
          level: levelRef.current,
          size,
          possibleMoves: possible,
          dead,
          gemsLen: g.length,
          hint,
        });
        lastWdRef.current = { level: levelRef.current, possible, dead };
      }

      if (!dead) {
        deadStreakRef.current = 0;
        return;
      }

      deadStreakRef.current += 1;
      if (deadStreakRef.current < 2) return;

      const now = Date.now();
      if (now - lastShuffleAtRef.current < 1200) return;
      lastShuffleAtRef.current = now;

      deadFixingRef.current = true;
      try {
        const fixed = ensurePlayable(g, levelRef.current);
        setGems(fixed);
        deadStreakRef.current = 0;
      } finally {
        deadFixingRef.current = false;
      }
    }, 450);

    return () => window.clearInterval(id);
  }, [active, ensurePlayable, isProcessing, gameOver, selectedGem]);

  return {
    gameOver,
    won: false,
    stars,

    // ✅ új jelzések az App/UI-nak
    passed: stars >= 1,
    canGoNext: stars >= 3,

    gems,
    score,
    targetScore,
    moves,
    level,
    selectedGem,
    selectGem,
    isProcessing,
    startNewGame,
    foundChests,
    progress,

    shuffleBoard,
    shuffleUses,

    mode,
    timeLimitSec,
    timeLeftSec,

    flashIds,
    scorePops,

    activeGemCount: getGemCountForLevel(level),
    boardSize,

    starsRef,
    isShuffling,
  };
};