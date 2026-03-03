export type LevelGoal =
  | { type: "score"; target: number }
  | { type: "clear"; gem: string; count: number }
  | { type: "chest"; count: number };

export type LevelRules = {
  level: number;
  moves: number;
  goal: LevelGoal;
  timed?: { seconds: number }; // ha később akarod tréningben is
  spawn?: { extraGems?: string[] };
  rewards?: { chest?: boolean; br?: number };
};

// --- helpers ---
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Tréning hullám (1–120):
 *  - 10-es ciklusok, kis hullámzás: easy -> medium -> hard -> "mini vizsga"
 *  - 10., 20., 30..: chest cél (DE chest spawn már nerfelve a levelConfig-ban)
 */
function trainingWave(level: number) {
  const wave = (level - 1) % 10; // 0..9
  const block = Math.floor((level - 1) / 20); // 0..5 (lassú nehezítés)

  // Moves baseline (kevés gem miatt lejjebb)
  // early: 14-18, később: 16-20 környéke, de hullámzó
  const baseMoves = clamp(14 + block, 14, 20);

  // hullám: easy (0-2), medium (3-6), hard (7-8), exam (9)
  const waveDelta = wave <= 2 ? +2 : wave <= 6 ? 0 : wave <= 8 ? -2 : -3;

  const moves = clamp(baseMoves + waveDelta, 12, 20);

  // Score target: úgy állítjuk, hogy 5 gemmel se legyen “ingyen”
  // könnyű hullám: kicsit alacsonyabb, hard: magasabb
  const baseTarget = 520 + level * 40 + block * 120; // nő szépen
  const targetDelta = wave <= 2 ? -60 : wave <= 6 ? 0 : wave <= 8 ? +140 : +220;

  // Tréningben néha "clear" cél, hogy tanulós legyen
  // 15+, 30+, 60+ után fokozatosan több clear
  const allowClear = level >= 15;

  // Melyik gemet kérjük clear-re (egyszerű, 5 symbol)
  const clearGem = level % 2 === 0 ? "ruby" : "blood";
  const clearCount = level < 40 ? 10 : level < 80 ? 14 : 18;

  // ✅ FIX: 10. pálya legyen "könnyű score + jutalom érzet"
  // (nem chest), hogy a játékos azt érezze: "ez még nem nehéz"
  if (level === 10) {
    return {
      moves: 16,
      goal: { type: "score", target: 900 } as LevelGoal,
      rewards: { br: 5 } as LevelRules["rewards"],
    };
  }

  // 10-enként chest cél (1 db) – DE a 10-es már külön kezelve fent
  if (level % 10 === 0) {
    return {
      moves: clamp(baseMoves - 1, 12, 20),
      goal: { type: "chest", count: 1 } as LevelGoal,
      rewards: { chest: true } as LevelRules["rewards"],
    };
  }

  // “exam” hullám (9): legyen vagy nehezebb score, vagy clear
  if (wave === 9 && allowClear) {
    return {
      moves: clamp(baseMoves - 3, 12, 18),
      goal: { type: "clear", gem: clearGem, count: clearCount } as LevelGoal,
    };
  }

  // Hard hullám (7-8): magasabb score
  if (wave >= 7 && wave <= 8) {
    return {
      moves,
      goal: { type: "score", target: baseTarget + targetDelta } as LevelGoal,
    };
  }

  // Medium hullám: score
  if (wave >= 3 && wave <= 6) {
    // néha clear középen is (tanulós)
    if (allowClear && level % 12 === 0) {
      return {
        moves: clamp(moves, 12, 18),
        goal: { type: "clear", gem: clearGem, count: clamp(clearCount - 2, 8, 18) } as LevelGoal,
      };
    }
    return {
      moves,
      goal: { type: "score", target: baseTarget } as LevelGoal,
    };
  }

  // Easy hullám (0-2): alacsonyabb target, több moves
  return {
    moves,
    goal: { type: "score", target: clamp(baseTarget - 80, 380, 999999) } as LevelGoal,
  };
}

/**
 * 121–200 (már átmenet a “rendesebb” rész felé):
 *  - kevesebb moves, nagyobb target
 *  - több clear cél
 *  - 150+ után elkezdhetők az “igazi” kihívások később (rács/láva/sárkány)
 */
function midGame(level: number) {
  const stage = Math.floor((level - 121) / 20); // 0..3
  const wave = (level - 1) % 10;

  const movesBase = clamp(18 - stage, 14, 18);
  const moves = clamp(movesBase + (wave <= 2 ? +1 : wave >= 7 ? -2 : 0), 12, 18);

  const target = 1100 + (level - 120) * 55 + stage * 180;

  // több clear
  const clearGem = level % 3 === 0 ? "ruby" : level % 3 === 1 ? "blood" : "amethyst";
  const clearCount = clamp(16 + stage * 4 + (wave >= 7 ? 4 : 0), 14, 30);

  // 10-enként chest cél maradhat 1 db, de kevesebb moves
  if (level % 10 === 0) {
    return {
      moves: clamp(moves - 1, 12, 18),
      goal: { type: "chest", count: 1 } as LevelGoal,
      rewards: { chest: true } as LevelRules["rewards"],
    };
  }

  // minden 5. pálya clear
  if (level % 5 === 0) {
    return {
      moves,
      goal: { type: "clear", gem: clearGem, count: clearCount } as LevelGoal,
    };
  }

  return {
    moves,
    goal: { type: "score", target } as LevelGoal,
  };
}

export const LEVELS: LevelRules[] = Array.from({ length: 200 }, (_, i) => {
  const level = i + 1;

  if (level <= 120) {
    const r = trainingWave(level);
    return { level, ...r };
  }

  const r = midGame(level);
  return { level, ...r };
});

// ezt fogjuk használni a játékban
export function getLevelRules(level: number): LevelRules {
  const lvl = Math.max(1, Math.floor(level || 1));
  if (lvl <= LEVELS.length) return LEVELS[lvl - 1];
  // később 1000-ig úgyis skálázható
  return LEVELS[LEVELS.length - 1];
}

export function isGoalMet(
  goal: LevelGoal,
  progress: { score: number; chests: number; cleared: Record<string, number> }
): boolean {
  switch (goal.type) {
    case "score":
      return (progress.score ?? 0) >= goal.target;
    case "clear":
      return (progress.cleared?.[goal.gem] ?? 0) >= goal.count;
    case "chest":
      return (progress.chests ?? 0) >= goal.count;
  }
}