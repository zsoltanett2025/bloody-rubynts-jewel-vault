import React, { createContext, useContext, useMemo, useState } from "react";

type Progress = {
  rubyntBalance: number;
  inventory: { bombs: number; wizards: number };
};

type GameCtx = {
  progress: Progress;
  isLoading: boolean;

  lives: number;
  maxLives: number;
  spendLife: () => void;
  resetLives: () => void;

  completeLevel: (level: number, score: number, stars: number) => void;
};

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [progress] = useState<Progress>({
    rubyntBalance: 0,
    inventory: { bombs: 3, wizards: 3 },
  });

  const maxLives = 3;
  const [lives, setLives] = useState(maxLives);

  const spendLife = () => setLives((v) => Math.max(0, v - 1));
  const resetLives = () => setLives(maxLives);

  const value = useMemo<GameCtx>(
    () => ({
      progress,
      isLoading: false,

      lives,
      maxLives,
      spendLife,
      resetLives,

      completeLevel: () => {},
    }),
    [progress, lives]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
