export type LevelGoal =
  | { type: "score"; target: number }
  | { type: "clear"; gem: string; count: number }
  | { type: "chest"; count: number }
  | { type: "collect_multi"; targets: Record<string, number> };

export type LevelChallenge =
  | { type: "none" }
  | { type: "lava"; intensity: 1 | 2 | 3 }
  | { type: "bomb_collect"; count: number }
  | { type: "rainbow_focus"; count: number }
  | { type: "dragon"; hp: number }
  | { type: "cage"; count: number }
  | {
    type: "cage";
    hits: 1 | 2;
    pattern: "small_cluster" | "bottom_row" | "border";
  };

export type LevelRules = {
  level: number;
  moves: number;
  goal: LevelGoal;
  timed?: { seconds: number };
  spawn?: { extraGems?: string[] };
  rewards?: { chest?: boolean; br?: number }; // FIX: a 'br' most már opcionális (br?), így nem lesz TS hiba
  challenge?: LevelChallenge;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function pick<T>(arr: T[], idx: number) {
  return arr[(idx % arr.length + arr.length) % arr.length];
}

const MAX_SCORE_TARGET = 5000;

function scoreTarget(level: number, moves: number, timedSec?: number) {
  const L = Math.max(1, Math.floor(level || 1));
  const m = clamp(Math.floor(moves || 20), 10, 40);
  let base = m * 170; 
  
  if (L <= 40) base *= 0.85;
  else if (L <= 120) base *= 0.95;
  else if (L <= 200) base *= 1.0;
  else if (L <= 350) base *= 1.05; 
  else base *= 1.1;
  
  if (timedSec && timedSec > 0) {
    const t = clamp(timedSec, 150, 210);
    base += (t - 150) * 8;
  }
  return clamp(Math.floor(base), 900, MAX_SCORE_TARGET);
}

function clearCount(level: number) {
  const L = Math.max(1, Math.floor(level || 1));
  if (L <= 40) return 15;
  if (L <= 80) return 25;
  if (L <= 120) return 26;
  if (L <= 200) return 28;
  if (L <= 350) return 30;
  return 30;
}

function clearGemByLevel(level: number) {
  const L = Math.max(1, Math.floor(level || 1));
  const pool = ["ruby", "blood", "amethyst", "onyx", "silver"];
  return pick(pool, L * 7 + 3);
}

const DRAGON_LEVELS = [67, 134, 201, 268, 335, 402, 469];

function dragonLevel(level: number): Omit<LevelRules, "level"> {
  const moves = 30;
  let hp = 30;
  if (level >= 201) hp = 32;
  if (level >= 335) hp = 35;
  return { moves, goal: { type: "score", target: scoreTarget(level, moves) }, challenge: { type: "dragon", hp }, rewards: { br: 10 } };
}

function trainingWave(level: number): Omit<LevelRules, "level"> {
  const wave = (level - 1) % 10;
  const block = Math.floor((level - 1) / 20);
  const baseMoves = clamp(17 + block, 17, 23);
  const waveDelta = wave <= 2 ? +2 : wave <= 6 ? 0 : wave <= 8 ? -1 : -2;
  const bonusMoves = level >= 15 && level <= 30 ? 4 : 0;
  const rawMoves = baseMoves + waveDelta;
  const moves = clamp(rawMoves + bonusMoves, 16, 27);
 if (level === 25) {
  return {
    moves: 20,
    goal: { type: "score", target: 1400 },
    timed: { seconds: 90 },
    challenge: { type: "cage", count: 6 },
  };
}

if (level === 35) {
  return {
    moves: 25,
    goal: { type: "score", target: 1700 },
    challenge: { type: "cage", count: 8 },
  };
}

if (level === 45) {
  return {
    moves: 26,
    goal: { type: "score", target: 2000 },
    challenge: { type: "cage", count: 8 },
  };
}

if (level === 60) {
  return {
    moves: 27,
    goal: { type: "score", target: 2400 },
    challenge: { type: "cage", count: 10 },
  };
}

 if (level === 70) {
  return {
    moves: 28,
    goal: { type: "score", target: 2600 },
    challenge: { type: "cage", count: 7 },
  };
}

if (level === 90) {
  return {
    moves: 30,
    goal: { type: "score", target: 3000 },
    challenge: { type: "cage", count: 16 },
  };
}

if (level === 120) {
  return {
    moves: 30,
    goal: { type: "score", target: 3400 },
    challenge: { type: "cage", count: 12 },
  };
}
  
if (level === 150) {
  return {
    moves: 28,
    goal: { type: "score", target: 3800 },
    challenge: { type: "cage", count: 9 },
  };
}

if (level === 10) return { moves: 16, goal: { type: "score", target: 950 }, rewards: { br: 5 }, challenge: { type: "none" } };
  if (level % 10 === 0) return { moves: clamp(baseMoves - 1 + bonusMoves, 16, 27), goal: { type: "chest", count: 1 }, rewards: { chest: true }, challenge: { type: "none" } };
  const allowClear = level >= 15;
  if (wave === 9 && allowClear) {
    return {
      moves: clamp(baseMoves - 3 + bonusMoves, 16, 27),
      goal: { type: "clear", gem: clearGemByLevel(level), count: clamp(clearCount(level) - 4, 8, 18) },
      challenge: { type: "none" },
    };
  }
  return { moves, goal: { type: "score", target: scoreTarget(level, rawMoves) }, challenge: { type: "none" } };
}

function midGame(level: number): Omit<LevelRules, "level"> {
  const stage = Math.floor((level - 121) / 20);
  const wave = (level - 1) % 10;
  const movesBase = clamp(18 - stage, 16, 23);
  const moves = clamp(movesBase + (wave <= 2 ? +1 : wave >= 7 ? -2 : 0), 16, 23);
  if (level % 10 === 0) return { moves: clamp(moves - 1, 16, 23), goal: { type: "chest", count: 1 }, rewards: { chest: true }, challenge: { type: "none" } };
  if (level % 5 === 0) return { moves, goal: { type: "clear", gem: clearGemByLevel(level), count: clamp(clearCount(level), 16, 28) }, challenge: { type: "none" } };
  return { moves, goal: { type: "score", target: scoreTarget(level, moves) }, challenge: { type: "none" } };
}

function saga(level: number): Omit<LevelRules, "level"> {
  const L = Math.max(201, Math.floor(level || 201));
  const wave = (L - 201) % 12;
  const block = Math.floor((L - 201) / 30);
  const isEasyWave = (L - 1) % 15 === 0; 
  const moves = clamp(28 - Math.floor(block / 3) + (wave <= 2 ? +1 : wave >= 9 ? -2 : 0) - (isEasyWave ? 5 : 0), 16, 35);
  const isTimed = wave === 11 || L % 30 === 0;
  const timedSec = L <= 500 ? clamp(150 + (L % 3) * 15, 150, 180) : clamp(180 + (L % 3) * 15, 180, 220);
  const isChest = L % 10 === 0;
  const isClear = L % 6 === 0;
  
  let challenge: LevelChallenge = { type: "none" };
  
  if (L >= 261) {
    if ((L - 261) % 14 === 0) {
      challenge = { type: "bomb_collect", count: clamp(2 + Math.floor((L - 260) / 60), 2, 8) };
    } else if (L >= 351 && (L - 351) % 18 === 0) {
      challenge = { type: "lava", intensity: L % 3 === 0 ? 3 : 2 };
    } else if (L >= 400 && (L - 400) % 20 === 0) {
      challenge = { type: "rainbow_focus", count: clamp(1 + Math.floor((L - 400) / 100), 1, 4) };
    }
  }

  if (isChest) return { moves: clamp(moves - 2, 15, 30), goal: { type: "chest", count: 1 }, rewards: { chest: true, br: Math.floor(L / 100) + 5 }, ...(isTimed ? { timed: { seconds: timedSec } } : {}), challenge };
  if (isClear) {
    const cnt = clamp(clearCount(L) + (isTimed ? 2 : 0), 18, 50);
    return { moves, goal: { type: "clear", gem: clearGemByLevel(L), count: cnt }, ...(isTimed ? { timed: { seconds: timedSec } } : {}), challenge };
  }
  return { moves, goal: { type: "score", target: scoreTarget(L, moves, isTimed ? timedSec : undefined) }, ...(isTimed ? { timed: { seconds: timedSec } } : {}), challenge };
}

export const LEVELS: LevelRules[] = Array.from({ length: 1000 }, (_, i) => {
  const level = i + 1;
  if (DRAGON_LEVELS.includes(level)) return { level, ...dragonLevel(level) };
  if (level <= 120) return { level, ...trainingWave(level) };
  if (level <= 200) return { level, ...midGame(level) };
  return { level, ...saga(level) };
});

export function getLevelRules(level: number): LevelRules {
  const lvl = Math.max(1, Math.floor(level || 1));
  if (lvl <= LEVELS.length) return LEVELS[lvl - 1];
  return LEVELS[LEVELS.length - 1];
}

export function isGoalMet(
  goal: LevelGoal,
  progress: { score: number; chests: number; cleared: Record<string, number> }
): boolean {
  switch (goal.type) {
    case "score": return (progress.score ?? 0) >= goal.target;
    case "clear": return (progress.cleared?.[goal.gem] ?? 0) >= goal.count;
    case "chest": return (progress.chests ?? 0) >= goal.count;
    case "collect_multi": {
      return Object.entries(goal.targets).every(([gem, target]) => (progress.cleared?.[gem] ?? 0) >= target);
    }
  }
}
