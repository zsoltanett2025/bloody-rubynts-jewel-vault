import { useState, useCallback, useEffect, useRef } from "react";
import { playSound, type SfxName } from "../../utils/audioManager";
import { getShardConfig } from "../../utils/shards";
import { getLevelConfig } from "./levelConfig";
import { getLevelRules, isGoalMet, type LevelGoal } from "./levels";

console.log("useMatch3 loaded v-STABLE-RESET-DRAGON-LUCK-FINAL");

export type GemType = "chest" | (string & {});
export type PowerType = "stripe_h" | "stripe_v" | "bomb" | "rainbow";
export type BoosterType = "bomb" | "striped" | "rainbow";

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

type ChallengeProgress = {
  bombsUsed: number;
  rainbowsUsed: number;
  rainbowsCreated: number;
};

type GoalProgress = {
  score: number;
  chests: number;
  cleared: Record<string, number>;
  challenge: ChallengeProgress;
};

export type ScorePop = {
  id: string;
  x: number;
  y: number;
  value: number;
};

type RefillAssist = {
  favoredTypes?: GemType[];
  helpMode?: boolean;
  luckyCascade?: boolean;
  movesLeft?: number;
  level?: number;
};

let __gid = 0;
function newId() {
  // @ts-ignore
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    // @ts-ignore
    return crypto.randomUUID();
  }
  __gid += 1;
  return `id_${Date.now()}_${__gid}_${Math.random().toString(16).slice(2)}`;
}

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

function pickWeightedGemType(pool: GemType[], favoredTypes?: GemType[], luckyCascade = false) {
  const validPool = pool.length > 0 ? pool : GEM_TYPES_ALL;
  const favored = (favoredTypes ?? []).filter(
    (t) => t !== "chest" && validPool.includes(t)
  );

  const favoredChance = luckyCascade ? 0.55 : 0.30;

  if (favored.length > 0 && Math.random() < favoredChance) {
    return favored[Math.floor(Math.random() * favored.length)];
  }

  return validPool[Math.floor(Math.random() * validPool.length)];
}

function getFavoredGemTypes(
  gems: Gem[],
  activeTypes: GemType[],
  goal: LevelGoal,
  targetScore: number,
  progress: GoalProgress
): GemType[] {
  if (goal.type === "clear") {
    return activeTypes.includes(goal.gem) ? [goal.gem] : [];
  }

  if (goal.type !== "score") return [];

  const counts = new Map<GemType, number>();
  for (const g of gems) {
    if (g.type === "chest") continue;
    if (!activeTypes.includes(g.type)) continue;
    counts.set(g.type, (counts.get(g.type) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, progress.score < targetScore * 0.6 ? 3 : 2)
    .map(([type]) => type);

  return sorted;
}

function shouldHelpPlayer(
  goal: LevelGoal,
  progress: GoalProgress,
  targetScore: number,
  movesLeft: number
) {
  if (movesLeft > 3) return false;

  if (goal.type === "score") {
    return progress.score < targetScore * 0.82;
  }

  if (goal.type === "clear") {
    const have = progress.cleared?.[goal.gem] ?? 0;
    const remaining = Math.max(0, goal.count - have);
    return remaining > 0 && remaining <= 8;
  }

  if (goal.type === "chest") {
    const remaining = Math.max(0, goal.count - (progress.chests ?? 0));
    return remaining > 0 && remaining <= 1;
  }

  return false;
}

function shouldLuckyCascade(goal: LevelGoal, helpMode: boolean, movesLeft: number) {
  if (!helpMode) return false;
  if (movesLeft > 1) return false;
  if (goal.type === "chest") return false;
  return Math.random() < 0.12;
}

function rollSpawnPower(level: number, helpMode: boolean, movesLeft: number): PowerType | undefined {
  if (level < 20) return undefined;

  let chance = 0.008;
  if (helpMode) chance = movesLeft <= 1 ? 0.022 : 0.012;

  if (Math.random() >= chance) return undefined;

  const r = Math.random();
  if (r < 0.42) return "bomb";
  if (r < 0.72) return "stripe_h";
  if (r < 0.97) return "stripe_v";

  if (helpMode && level >= 80) return "rainbow";
  return "bomb";
}

const generateRandomGem = (
  x: number,
  y: number,
  activeTypes: GemType[],
  chanceForChest = 0,
  assist?: RefillAssist
): Gem => {
  const isChest = Math.random() < chanceForChest;
  const pool = activeTypes.length > 0 ? activeTypes : GEM_TYPES_ALL;
  const type = isChest
    ? "chest"
    : pickWeightedGemType(pool, assist?.favoredTypes, !!assist?.luckyCascade);

  const power =
    isChest
      ? undefined
      : rollSpawnPower(assist?.level ?? 1, !!assist?.helpMode, assist?.movesLeft ?? 99);

  return {
    id: newId(),
    type,
    power,
    x,
    y,
  };
};

const buildGrid = (size: number, mask: boolean[][], gems: Gem[]) => {
  const grid: (Gem | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
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
  lvl: number,
  assist?: RefillAssist
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
        result.push(
          generateRandomGem(x, y, activeTypes, chestChance, {
            ...assist,
            level: lvl,
          })
        );
      }
    }
  }

  return result;
};

const findMatches = (gems: Gem[], size: number, mask: boolean[][]): Gem[] => {
  const grid = buildGrid(size, mask, gems);
  const matches = new Set<Gem>();

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

function normalizeGemsToMask(gems: Gem[], size: number, mask: boolean[][]) {
  return gems.filter(
    (g) => g.x >= 0 && g.x < size && g.y >= 0 && g.y < size && !!mask[g.y]?.[g.x]
  );
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

function rerollPlayable(
  size: number,
  mask: boolean[][],
  pool: GemType[],
  minMoves: number,
  maxTries = 420
): Gem[] {
  const activePositions: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mask[y]?.[x]) activePositions.push({ x, y });
    }
  }

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
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (mask[y]?.[x]) activePositions.push({ x, y });
    }
  }

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

function isChallengeMet(
  challenge:
    | { type: "none" }
    | { type: "lava"; intensity: 1 | 2 | 3 }
    | { type: "bomb_collect"; count: number }
    | { type: "rainbow_focus"; count: number }
    | { type: "dragon"; hp: number },
  progress: GoalProgress,
  dragonHp: number
) {
  switch (challenge.type) {
    case "none":
      return true;
    case "lava":
      return true;
    case "bomb_collect":
      return (progress.challenge?.bombsUsed ?? 0) >= challenge.count;
    case "rainbow_focus":
      return (
        (progress.challenge?.rainbowsUsed ?? 0) +
          (progress.challenge?.rainbowsCreated ?? 0) >=
        challenge.count
      );
    case "dragon":
      return dragonHp <= 0;
  }
}

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

  const keyToType = new Map<CellKey, GemType>();
  for (const k of matchKeys) keyToType.set(k, byKey[k]?.type);

  const visited = new Set<CellKey>();
  let bestGroup: CellKey[] = [];

  const neigh = (k: CellKey) => {
    const [xs, ys] = k.split(",");
    const x = Number(xs);
    const y = Number(ys);
    const out: CellKey[] = [];
    const cand: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of cand) {
      const kk = keyOf(nx, ny);
      if (matchKeys.has(kk)) out.push(kk);
    }
    return out;
  };

  for (const k of matchKeys) {
    if (visited.has(k)) continue;
    const t = keyToType.get(k);
    if (!t || t === "chest") {
      visited.add(k);
      continue;
    }

    const stack = [k];
    const group: CellKey[] = [];
    visited.add(k);

    while (stack.length) {
      const cur = stack.pop()!;
      group.push(cur);
      for (const nb of neigh(cur)) {
        if (visited.has(nb)) continue;
        if (keyToType.get(nb) !== t) continue;
        visited.add(nb);
        stack.push(nb);
      }
    }

    if (group.length >= 6 && group.length > bestGroup.length) bestGroup = group;
  }

  if (bestGroup.length >= 6) {
    const coords = bestGroup.map((k) => {
      const [xs, ys] = k.split(",");
      return { k, x: Number(xs), y: Number(ys) };
    });
    const ax = coords.reduce((s, c) => s + c.x, 0) / coords.length;
    const ay = coords.reduce((s, c) => s + c.y, 0) / coords.length;
    coords.sort(
      (a, b) =>
        Math.abs(a.x - ax) +
        Math.abs(a.y - ay) -
        (Math.abs(b.x - ax) + Math.abs(b.y - ay))
    );
    const g = byKey[coords[0].k];
    if (g && g.type !== "chest") {
      return { matches, createPower: { keepId: g.id, power: "rainbow" } };
    }
  }

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
    if (g && g.type !== "chest") {
      return { matches, createPower: { keepId: g.id, power: "bomb" } };
    }
  }

  let bestStripe: { k: CellKey; len: number; orient: "h" | "v" } | null = null;
  for (const k of matchKeys) {
    const hl = hLen[k] ?? 0;
    const vl = vLen[k] ?? 0;

    if (hl >= 4) {
      if (!bestStripe || hl > bestStripe.len) bestStripe = { k, len: hl, orient: "h" };
    }
    if (vl >= 4) {
      if (!bestStripe || vl > bestStripe.len) bestStripe = { k, len: vl, orient: "v" };
    }
  }
  if (bestStripe) {
    const g = byKey[bestStripe.k];
    if (g && g.type !== "chest") {
      return {
        matches,
        createPower: {
          keepId: g.id,
          power: bestStripe.orient === "h" ? "stripe_h" : "stripe_v",
        },
      };
    }
  }

  return { matches };
}

function expandClearIdsByPowers(
  allGems: Gem[],
  size: number,
  mask: boolean[][],
  clearIds: Set<string>
) {
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
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) addByCell(g.x + dx, g.y + dy);
      }
    }

    for (const nid of clearIds) {
      if (!visitedPower.has(nid)) queue.push(nid);
    }
  }
}

export const useMatch3 = (active: boolean = true) => {
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [armedBooster, setArmedBooster] = useState<BoosterType | null>(null);

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

  const [activeTypes, setActiveTypes] = useState<GemType[]>(() =>
    getActiveGemTypesForLevel(1, 5)
  );
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

  const [dragonHp, setDragonHp] = useState(0);
  const dragonHpRef = useRef(0);
  const [dragonJustHit, setDragonJustHit] = useState(false);

  useEffect(() => {
    dragonHpRef.current = dragonHp;
    setDragonJustHit(dragonHp < dragonHpRef.current);
  }, [dragonHp]);

  const [progress, setProgress] = useState<GoalProgress>({
    score: 0,
    chests: 0,
    cleared: {},
    challenge: {
      bombsUsed: 0,
      rainbowsUsed: 0,
      rainbowsCreated: 0,
    },
  });

  const progressRef = useRef<GoalProgress>({
    score: 0,
    chests: 0,
    cleared: {},
    challenge: {
      bombsUsed: 0,
      rainbowsUsed: 0,
      rainbowsCreated: 0,
    },
  });

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

  const setMovesSynced = useCallback((next: number | ((m: number) => number)) => {
    const prev = movesRef.current;
    const value = typeof next === "function" ? (next as (m: number) => number)(prev) : next;
    const clamped = Math.max(0, Math.floor(value));

    movesRef.current = clamped;
    setMoves(clamped);

    return clamped;
  }, []);

  const setScoreSynced = useCallback((next: number | ((s: number) => number)) => {
    setScore((prev) => {
      const value = typeof next === "function" ? (next as (s: number) => number)(prev) : next;
      const v = Math.max(0, Math.floor(value));
      scoreRef.current = v;
      return v;
    });
  }, []);

  const damageDragon = useCallback((amount: number) => {
    const dmg = Math.max(0, Math.floor(Number(amount) || 0));
    if (dmg <= 0) return;

    setDragonHp((prev) => {
      const next = Math.max(0, prev - dmg);
      dragonHpRef.current = next;
      return next;
    });

    setDragonJustHit(true);
    window.setTimeout(() => setDragonJustHit(false), 260);
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

  const addChallengeProgress = useCallback((delta: Partial<ChallengeProgress>) => {
    const bombsUsed = Math.max(0, Math.floor(Number(delta.bombsUsed) || 0));
    const rainbowsUsed = Math.max(0, Math.floor(Number(delta.rainbowsUsed) || 0));
    const rainbowsCreated = Math.max(0, Math.floor(Number(delta.rainbowsCreated) || 0));

    if (bombsUsed <= 0 && rainbowsUsed <= 0 && rainbowsCreated <= 0) return;

    setProgress((p) => {
      const next: GoalProgress = {
        ...p,
        challenge: {
          bombsUsed: (p.challenge?.bombsUsed ?? 0) + bombsUsed,
          rainbowsUsed: (p.challenge?.rainbowsUsed ?? 0) + rainbowsUsed,
          rainbowsCreated: (p.challenge?.rainbowsCreated ?? 0) + rainbowsCreated,
        },
      };
      progressRef.current = next;
      return next;
    });
  }, []);

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

  useEffect(() => {
    const rules = getLevelRules(level);
    if (rules.challenge?.type !== "dragon") return;
    if (dragonHp > 0) return;
    if (gameOver) return;

    setGameOver(true);
  }, [dragonHp, level, gameOver]);

  useEffect(() => {
    if (mode !== "moves") return;
    if (gameOver) return;
    if (moves <= 0) setGameOver(true);
  }, [mode, moves, gameOver]);

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

    if (findMatches(g, size, m).length === 0 && countPossibleMoves(g, size, m) >= minMoves) {
      return g;
    }

    const shuffled = shuffleToPlayable(g, size, m, pool, minMoves, 220);
    if (
      findMatches(shuffled, size, m).length === 0 &&
      countPossibleMoves(shuffled, size, m) >= minMoves
    ) {
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
      const rules = getLevelRules(lvl);
      const isDragonLevel = rules.challenge?.type === "dragon";

      try {
        let cascades = 0;
        const MAX_CASCADES = 30;

        while (true) {
          const { matches, createPower: rawCreatePower } = analyzeMatchesAndPower(activeGems, size, m);
          const createPower = lvl <= 10 && rawCreatePower?.power === "bomb" ? undefined : rawCreatePower;

          if (matches.length === 0) break;

          cascades++;
          if (cascades > MAX_CASCADES) {
            activeGems = ensurePlayable(activeGems, lvl);
            setGems([...activeGems]);
            break;
          }

          if (createPower?.power === "bomb") {
            addChallengeProgress({ bombsUsed: 1 });
          }
          if (createPower?.power === "rainbow") {
            addChallengeProgress({ rainbowsCreated: 1 });
          }

          const clearIds = new Set<string>(matches.map((g) => g.id));

          if (createPower) {
            clearIds.delete(createPower.keepId);
            activeGems = activeGems.map((g) =>
              g.id === createPower.keepId ? { ...g, power: createPower.power } : g
            );
          }

          expandClearIdsByPowers(activeGems, size, m, clearIds);

          const clearedGems = activeGems.filter((g) => clearIds.has(g.id));

          triggerMatchFx(
            Array.from(clearIds),
            clearedGems.slice(0, 8).map((gg) => ({
              id: `p_${newId()}_${gg.id}`,
              x: gg.x,
              y: gg.y,
              value: 10 * combo,
            }))
          );

          addScore(clearedGems.length * 10 * combo);
          countCleared(clearedGems);

          if (isDragonLevel) {
            const normalHitCount = clearedGems.filter((g) => g.type !== "chest").length;
            const baseDamage = Math.max(1, Math.floor(normalHitCount / 6));
            const comboBonus = combo >= 3 ? 1 : 0;
            const powerBonus = createPower ? 1 : 0;
            damageDragon(baseDamage + comboBonus + powerBonus);
          }

          safePlay(combo === 1 ? "match" : "combo");
          combo++;

          activeGems = activeGems.filter((g) => !clearIds.has(g.id));

          setGems([...activeGems]);
          await wait(CLEAR_MS);

          const cfg = getLevelConfig(lvl, GEM_TYPES_ALL.length);

          const helpMode = shouldHelpPlayer(
            rules.goal,
            progressRef.current,
            targetScore,
            movesRef.current
          );

          const luckyCascade = shouldLuckyCascade(
            rules.goal,
            helpMode,
            movesRef.current
          );

          const favoredTypes = helpMode
            ? getFavoredGemTypes(
                activeGems,
                activeTypesRef.current,
                rules.goal,
                targetScore,
                progressRef.current
              )
            : [];

          activeGems = applyGravityAndRefill(
            activeGems,
            activeTypesRef.current,
            size,
            m,
            cfg.chestChanceBoss,
            cfg.chestChanceNormal,
            lvl,
            {
              favoredTypes,
              helpMode,
              luckyCascade,
              movesLeft: movesRef.current,
              level: lvl,
            }
          );

          setGems([...activeGems]);
          await wait(GRAVITY_MS);
        }

        activeGems = ensurePlayable(activeGems, lvl);

        if (!hasAnyMove(activeGems, size, m)) {
          const minMoves = lvl >= 11 ? 6 : 1;
          activeGems = shuffleToPlayable(activeGems, size, m, activeTypesRef.current, minMoves, 320);
          activeGems = ensurePlayable(activeGems, lvl);
        }

        setGems([...activeGems]);
      } finally {
        setIsProcessing(false);
        processingRef.current = false;
      }
    },
    [addScore, countCleared, safePlay, ensurePlayable, triggerMatchFx, addChallengeProgress, damageDragon, targetScore]
  );

  const startNewGame = useCallback(
    (newLevel: number) => {
      const lvl = Math.max(1, Math.floor(Number(newLevel) || 1));

      setLevel(lvl);
      levelRef.current = lvl;

      setGameOver(false);
      setStars(0);
      starsRef.current = 0;

      setShuffleUses(1);
      shuffleUsesRef.current = 1;

      setFlashIds([]);
      setScorePops([]);
      setSelectedGem(null);
      setFoundChests(0);
      setArmedBooster(null);
      setIsProcessing(false);
      setIsShuffling(false);
      processingRef.current = false;

      setScore(0);
      scoreRef.current = 0;

      const cfg = getLevelConfig(lvl, GEM_TYPES_ALL.length);
      setBoardSize(cfg.boardSize);
      setMask(cfg.mask);
      boardSizeRef.current = cfg.boardSize;
      maskRef.current = cfg.mask;

      const pool = getActiveGemTypesForLevel(lvl, cfg.gemCount);
      setActiveTypes(pool);
      activeTypesRef.current = pool;

      const shardCfg = getShardConfig(lvl);
      const rules = getLevelRules(lvl);

      setDragonJustHit(false);

      if (rules.challenge?.type === "dragon") {
        const hp = Math.max(0, rules.challenge.hp);
        setDragonHp(hp);
        dragonHpRef.current = hp;
      } else {
        setDragonHp(0);
        dragonHpRef.current = 0;
      }

      if (shardCfg) {
        setMode("timed");
        setTimeLimitSec(shardCfg.timeLimitSec);
        setTimeLeftSec(shardCfg.timeLimitSec);

        const jitter = Math.random() < 0.5 ? 0 : 1;
        setMovesSynced(shardCfg.moveLimit + jitter);
      } else if (rules.timed?.seconds && rules.timed.seconds > 0) {
        setMode("timed");

        const bs = cfg.boardSize;
        const minT = 150;
        const maxT = bs >= 9 ? 210 : bs >= 8 ? 195 : 180;
        const sec = clamp(Math.floor(rules.timed.seconds), minT, maxT);

        setTimeLimitSec(sec);
        setTimeLeftSec(sec);

        setMovesSynced(clamp(rules.moves, 16, 34));
      } else {
        setMode("moves");
        setTimeLimitSec(0);
        setTimeLeftSec(0);

        setMovesSynced(clamp(rules.moves, 12, 34));
      }

      const rawTarget = rules.goal.type === "score" ? (rules.goal as any).target : 0;
      const minTarget = 600;
      const safeTarget = Math.max(minTarget, Math.floor(Number(rawTarget) || 0));

      setTargetScore(safeTarget);

      const resetProgress: GoalProgress = {
        score: 0,
        chests: 0,
        cleared: {},
        challenge: {
          bombsUsed: 0,
          rainbowsUsed: 0,
          rainbowsCreated: 0,
        },
      };

      setProgress(resetProgress);
      progressRef.current = resetProgress;

      const minMoves = lvl >= 11 ? 6 : 1;
      const fresh = rerollPlayable(cfg.boardSize, cfg.mask, pool, minMoves, 700);
      const clean = ensurePlayable(fresh, lvl);
      setGems(clean);
      gemsRef.current = clean;

      window.setTimeout(() => {
        if (processingRef.current) return;
        if (boardSizeRef.current !== cfg.boardSize) return;

        const size = boardSizeRef.current;
        const m = maskRef.current;

        if (findMatches(clean, size, m).length > 0) processMatches(clean, lvl);
      }, 0);
    },
    [processMatches, ensurePlayable, setMovesSynced, starsRef]
  );

  const shuffleBoard = useCallback(async () => {
    if (shuffleUsesRef.current <= 0 || isProcessing || isShuffling) return;

    setIsShuffling(true);
    try {
      const size = boardSizeRef.current;
      const m = maskRef.current;

      const minMoves = levelRef.current >= 11 ? 6 : 1;
      const current = gemsRef.current.map((g) => ({ ...g }));
      const shuffled = shuffleToPlayable(current, size, m, activeTypesRef.current, minMoves, 260);

      setShuffleUses((u) => u - 1);
      setSelectedGem(null);
      setArmedBooster(null);
      setGems(shuffled);
      gemsRef.current = shuffled;

      await wait(220);
      await processMatches(shuffled, levelRef.current);
    } finally {
      setIsShuffling(false);
    }
  }, [isProcessing, isShuffling, processMatches]);

  const armBooster = useCallback((type: BoosterType) => {
    setSelectedGem(null);
    setArmedBooster((prev) => (prev === type ? null : type));
  }, []);

  const cancelArmedBooster = useCallback(() => {
    setArmedBooster(null);
  }, []);

  const addBonusMoves = useCallback(
    (n: number) => {
      const add = Math.max(0, Math.floor(Number(n) || 0));
      if (add <= 0) return;
      setMovesSynced((m) => m + add);
    },
    [setMovesSynced]
  );

  const activateBoosterOnGem = useCallback(
    async (booster: BoosterType, gem: Gem) => {
      const size = boardSizeRef.current;
      const m = maskRef.current;
      const current = gemsRef.current.map((g) => ({ ...g }));
      const clearIds = new Set<string>();
      const rules = getLevelRules(levelRef.current);
      const isDragonLevel = rules.challenge?.type === "dragon";

      const grid = buildGrid(size, m, current);
      const addByCell = (x: number, y: number) => {
        if (!inBounds(x, y, size)) return;
        if (!m[y]?.[x]) return;
        const g = grid[y][x];
        if (!g) return;
        clearIds.add(g.id);
      };

      if (booster === "bomb") {
        addChallengeProgress({ bombsUsed: 1 });
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) addByCell(gem.x + dx, gem.y + dy);
        }
        safePlay("bomb");
      } else if (booster === "striped") {
        for (let x = 0; x < size; x++) addByCell(x, gem.y);
        for (let y = 0; y < size; y++) addByCell(gem.x, y);
        safePlay("stripe_h");
      } else if (booster === "rainbow") {
        addChallengeProgress({ rainbowsUsed: 1 });
        if (gem.type === "chest") {
          clearIds.add(gem.id);
        } else {
          for (const gg of current) {
            if (gg.type === gem.type) clearIds.add(gg.id);
          }
        }
        safePlay("mega_bomb");
      }

      if (clearIds.size <= 0) {
        setArmedBooster(null);
        return;
      }

      const cleared = current.filter((gg) => clearIds.has(gg.id));
      const chestHits = cleared.filter((gg) => gg.type === "chest").length;
      const normalHits = cleared.filter((gg) => gg.type !== "chest");

      triggerMatchFx(
        Array.from(clearIds),
        cleared.slice(0, 10).map((gg) => ({
          id: `p_${newId()}_${gg.id}_B`,
          x: gg.x,
          y: gg.y,
          value: gg.type === "chest" ? 500 : 20,
        }))
      );

      if (chestHits > 0) {
        setFoundChests((c) => c + chestHits);
        setProgress((p) => {
          const next: GoalProgress = { ...p, chests: p.chests + chestHits };
          progressRef.current = next;
          return next;
        });
      }

      if (normalHits.length > 0) countCleared(normalHits);

      if (isDragonLevel) {
        const boosterDamage = booster === "rainbow" ? 3 : 2;
        const hitDamage = Math.max(1, Math.floor(normalHits.length / 7));
        damageDragon(boosterDamage + hitDamage);
      }

      addScore(normalHits.length * 12 + chestHits * 500);

      let after = current.filter((gg) => !clearIds.has(gg.id));
      setGems(after);
      gemsRef.current = after;

      await wait(CLEAR_MS);

      const cfg = getLevelConfig(levelRef.current, GEM_TYPES_ALL.length);

      const helpMode = shouldHelpPlayer(
        rules.goal,
        progressRef.current,
        targetScore,
        movesRef.current
      );

      const luckyCascade = shouldLuckyCascade(
        rules.goal,
        helpMode,
        movesRef.current
      );

      const favoredTypes = helpMode
        ? getFavoredGemTypes(
            after,
            activeTypesRef.current,
            rules.goal,
            targetScore,
            progressRef.current
          )
        : [];

      after = applyGravityAndRefill(
        after,
        activeTypesRef.current,
        size,
        m,
        cfg.chestChanceBoss,
        cfg.chestChanceNormal,
        levelRef.current,
        {
          favoredTypes,
          helpMode,
          luckyCascade,
          movesLeft: movesRef.current,
          level: levelRef.current,
        }
      );

      setGems(after);
      gemsRef.current = after;

      await wait(GRAVITY_MS);
      await processMatches(after, levelRef.current);

      setSelectedGem(null);
      setArmedBooster(null);
    },
    [addScore, countCleared, processMatches, safePlay, triggerMatchFx, addChallengeProgress, damageDragon, targetScore]
  );

  const selectGem = useCallback(
    async (gem: Gem) => {
      if (!active) return;
      if (isProcessing || isShuffling) return;

      if (mode === "moves" && movesRef.current <= 0) return;
      if (mode === "timed" && timeLeftSec <= 0) return;
      if (gameOver) return;

      const size = boardSizeRef.current;
      const m = maskRef.current;
      const current = gemsRef.current;
      const rules = getLevelRules(levelRef.current);
      const isDragonLevel = rules.challenge?.type === "dragon";

      if (armedBooster) {
        setIsProcessing(true);
        try {
          await activateBoosterOnGem(armedBooster, gem);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      if (gem.type === "chest") {
        safePlay(Math.random() < 0.5 ? "chest_blue" : "chest_purple");

        setFoundChests((c) => c + 1);
        setProgress((p) => {
          const next: GoalProgress = { ...p, chests: p.chests + 1 };
          progressRef.current = next;
          return next;
        });

        if (isDragonLevel) {
          damageDragon(1);
        }

        triggerMatchFx([gem.id], [
          { id: `p_${newId()}_${gem.id}_CHEST`, x: gem.x, y: gem.y, value: 500 },
        ]);

        addScore(500);

        const afterClear = current.filter((g) => g.id !== gem.id);
        const cfg = getLevelConfig(levelRef.current, GEM_TYPES_ALL.length);

        const helpMode = shouldHelpPlayer(
          rules.goal,
          progressRef.current,
          targetScore,
          movesRef.current
        );

        const luckyCascade = shouldLuckyCascade(
          rules.goal,
          helpMode,
          movesRef.current
        );

        const favoredTypes = helpMode
          ? getFavoredGemTypes(
              afterClear,
              activeTypesRef.current,
              rules.goal,
              targetScore,
              progressRef.current
            )
          : [];

        let refilled = applyGravityAndRefill(
          afterClear,
          activeTypesRef.current,
          size,
          m,
          cfg.chestChanceBoss,
          cfg.chestChanceNormal,
          levelRef.current,
          {
            favoredTypes,
            helpMode,
            luckyCascade,
            movesLeft: movesRef.current,
            level: levelRef.current,
          }
        );

        setGems(refilled);
        gemsRef.current = refilled;

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

      if (mode === "moves") {
        setMovesSynced((mm) => Math.max(0, mm - 1));
      }

      setIsProcessing(true);

      const original = gemsRef.current.map((g) => ({ ...g }));
      const swapped = original.map((g) => {
        if (g.id === selectedGem.id) return { ...g, x: gem.x, y: gem.y };
        if (g.id === gem.id) return { ...g, x: selectedGem.x, y: selectedGem.y };
        return g;
      });

      setGems(swapped);
      gemsRef.current = swapped;

      await wait(SWAP_MS);

      const matches = findMatches(swapped, size, m);

      if (matches.length === 0) {
        const a = swapped.find((gg) => gg.id === selectedGem.id);
        const b = swapped.find((gg) => gg.id === gem.id);
        const hasPower = !!a?.power || !!b?.power;

        if (!hasPower) {
          setGems(original);
          gemsRef.current = original;
          setSelectedGem(null);
          setIsProcessing(false);

          if (!hasAnyMove(original, size, m)) {
            setIsShuffling(true);
            setSelectedGem(null);
            const fixed = ensurePlayable(original, levelRef.current);
            window.setTimeout(() => {
              if (!active) return;
              setGems(fixed);
              gemsRef.current = fixed;
              setIsShuffling(false);
            }, 300);
          }
          return;
        }

        const powers = [a?.power, b?.power].filter(Boolean) as PowerType[];

        if (powers.includes("rainbow")) safePlay("mega_bomb");
        else if (powers.includes("bomb")) safePlay("bomb");
        else if (powers.includes("stripe_h")) safePlay("stripe_h");
        else if (powers.includes("stripe_v")) safePlay("stripe_v");
        else safePlay("click");

        const clearIds = new Set<string>();

        const isRainbowA = a?.power === "rainbow";
        const isRainbowB = b?.power === "rainbow";

        if (powers.filter((p) => p === "bomb").length > 0) {
          addChallengeProgress({
            bombsUsed: powers.filter((p) => p === "bomb").length,
          });
        }

        const rainbowUsedCount = (isRainbowA ? 1 : 0) + (isRainbowB ? 1 : 0);

        if (rainbowUsedCount > 0) {
          addChallengeProgress({ rainbowsUsed: rainbowUsedCount });
        }

        if (isRainbowA && isRainbowB) {
          for (const gg of swapped) if (gg.type !== "chest") clearIds.add(gg.id);
        } else if (isRainbowA && b && b.type !== "chest") {
          for (const gg of swapped) if (gg.type === b.type) clearIds.add(gg.id);
          clearIds.add(a!.id);
        } else if (isRainbowB && a && a.type !== "chest") {
          for (const gg of swapped) if (gg.type === a.type) clearIds.add(gg.id);
          clearIds.add(b!.id);
        } else {
          if (a?.power) clearIds.add(a.id);
          if (b?.power) clearIds.add(b.id);
          expandClearIdsByPowers(swapped, size, m, clearIds);
        }

        const cleared = swapped.filter((gg) => clearIds.has(gg.id));
        triggerMatchFx(
          Array.from(clearIds),
          cleared.slice(0, 8).map((gg) => ({
            id: `p_${newId()}_${gg.id}_P`,
            x: gg.x,
            y: gg.y,
            value: 20,
          }))
        );

        if (isDragonLevel) {
          const powerDamage =
            (powers.includes("rainbow") ? 2 : 0) +
            (powers.includes("bomb") ? 1 : 0) +
            (powers.includes("stripe_h") || powers.includes("stripe_v") ? 1 : 0);

          const hitDamage = Math.max(
            1,
            Math.floor(cleared.filter((gg) => gg.type !== "chest").length / 7)
          );

          damageDragon(powerDamage + hitDamage);
        }

        addScore(cleared.length * 12);
        countCleared(cleared);

        let after = swapped.filter((gg) => !clearIds.has(gg.id));

        const cfg = getLevelConfig(levelRef.current, GEM_TYPES_ALL.length);

        const helpMode = shouldHelpPlayer(
          rules.goal,
          progressRef.current,
          targetScore,
          movesRef.current
        );

        const luckyCascade = shouldLuckyCascade(
          rules.goal,
          helpMode,
          movesRef.current
        );

        const favoredTypes = helpMode
          ? getFavoredGemTypes(
              after,
              activeTypesRef.current,
              rules.goal,
              targetScore,
              progressRef.current
            )
          : [];

        after = applyGravityAndRefill(
          after,
          activeTypesRef.current,
          size,
          m,
          cfg.chestChanceBoss,
          cfg.chestChanceNormal,
          levelRef.current,
          {
            favoredTypes,
            helpMode,
            luckyCascade,
            movesLeft: movesRef.current,
            level: levelRef.current,
          }
        );

        setGems(after);
        gemsRef.current = after;

        await wait(GRAVITY_MS);
        await processMatches(after, levelRef.current);

        setIsProcessing(false);
        setSelectedGem(null);
        return;
      }

      safePlay("click");
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
      armedBooster,
      activateBoosterOnGem,
      addChallengeProgress,
      damageDragon,
      targetScore,
    ]
  );

  useEffect(() => {
    if (gameOver) return;

    const safeTarget = Math.max(600, Math.floor(Number(targetScore) || 0));

    const star1 = safeTarget;
    const star2 = Math.floor(safeTarget * 1.5);
    const star3 = Math.floor(safeTarget * 2);

    const earnedStars =
      progress.score >= star3 ? 3 : progress.score >= star2 ? 2 : progress.score >= star1 ? 1 : 0;

    if (earnedStars !== stars) setStars(earnedStars);
  }, [gameOver, progress.score, targetScore, stars]);

  const currentRules = getLevelRules(level);
  const currentChallenge = currentRules.challenge ?? { type: "none" as const };

  const goalMet = isGoalMet(currentRules.goal, {
    score: progress.score,
    chests: progress.chests,
    cleared: progress.cleared,
  });

  const challengeMet = isChallengeMet(currentChallenge, progress, dragonHp);
  const passed = currentChallenge.type === "dragon" ? challengeMet : goalMet && challengeMet;
  const canGoNext = passed;

  return {
    gameOver,
    won: passed,
    stars,

    passed,
    canGoNext,

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

    armedBooster,
    armBooster,
    cancelArmedBooster,
    addBonusMoves,

    currentChallenge,
    challengeProgress: progress.challenge,
    goalMet,
    challengeMet,
    dragonHp,
    dragonMaxHp: currentChallenge.type === "dragon" ? currentChallenge.hp : 0,
    dragonJustHit,
  };
};