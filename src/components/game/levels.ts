export type LevelGoal =
  | { type: "score"; target: number }
  | { type: "clear"; gem: string; count: number } // pl. "ruby", "skull" stb.
  | { type: "chest"; count: number };

export type LevelRules = {
  level: number;
  moves: number;          // lépésszám limit
  goal: LevelGoal;        // fő cél
  spawn?: {
    // később ide jöhet: ritkább gemek, új színek, special spawn
    extraGems?: string[];
  };
  rewards?: {
    chest?: boolean;      // level végén chest popup
    br?: number;          // BR jutalom (később on-chain/off-chain)
  };
};

export const LEVELS: LevelRules[] = Array.from({ length: 200 }, (_, i) => {
  const level = i + 1;
  const block = Math.floor((level - 1) / 20);

  // 10-enként CHEST cél
  if (level % 10 === 0) {
    return {
      level,
      moves: 20 + Math.min(8, block),
      goal: { type: "chest", count: 1 },
      rewards: { chest: true },
    };
  }

  // alap SCORE
  return {
    level,
    moves: 18 + Math.min(8, block),
    goal: { type: "score", target: 800 + block * 300 + level * 10 },
  };
});

export function isGoalMet(goal: LevelGoal, progress: {
  score: number;
  chests: number;
  cleared: Record<string, number>;
}): boolean {
  switch (goal.type) {
    case "score":
      return (progress.score ?? 0) >= goal.target;

    case "clear":
      return (progress.cleared?.[goal.gem] ?? 0) >= goal.count;

    case "chest":
      return (progress.chests ?? 0) >= goal.count;
  }
}
