// src/components/game/Match3Runtime.tsx
import { useEffect, useMemo, useRef } from "react";
import { useMatch3, type Gem } from "./useMatch3";
import { GemComponent } from "./GemComponent";

export type Match3State = {
  gems: Gem[];
  score: number;
  targetScore: number;
  moves: number;
  level: number;
  selectedGem: Gem | null;
  shuffleUses: number;

  mode: "moves" | "timed";
  timeLeftSec: number;
  timeLimitSec: number;

  activeGemCount: number;
  boardSize: number;

  scorePops: Array<{ id: string; x: number; y: number; value: number }>;
  flashIds: string[];
};

export type Match3Api = {
  startNewGame: (level: number) => void;
  shuffleBoard: () => void;
};

export function Match3Runtime(props: {
  active: boolean;
  levelToStart: number;
  tileSize: number;
  onApi?: (api: Match3Api) => void;
  onState?: (state: Match3State) => void;
}) {
  const { active, levelToStart, tileSize, onApi, onState } = props;

  const m = useMatch3(active);

  // ✅ stabil API
  const api = useMemo<Match3Api>(
    () => ({
      startNewGame: (lvl: number) => m.startNewGame(lvl),
      shuffleBoard: () => m.shuffleBoard(),
    }),
    [m]
  );

  // ✅ adja vissza az API-t az App.tsx-nek
  useEffect(() => {
    onApi?.(api);
  }, [api, onApi]);

  // ✅ KULCS: mountkor + level váltáskor mindig induljon új pálya
  const lastStartedRef = useRef<number>(0);
  useEffect(() => {
    if (!active) return;

    const lvl = Math.max(1, Math.floor(Number(levelToStart) || 1));

    // csak akkor indítsuk, ha tényleg új vagy most aktiváltuk
    if (lastStartedRef.current !== lvl) {
      lastStartedRef.current = lvl;
      m.startNewGame(lvl);
    }
  }, [active, levelToStart, m]);

  // ✅ állapot push az App.tsx felé (TopBar / end modal)
  useEffect(() => {
    onState?.({
      gems: m.gems,
      score: m.score,
      targetScore: m.targetScore,
      moves: m.moves,
      level: m.level,
      selectedGem: m.selectedGem,
      shuffleUses: m.shuffleUses,

      mode: m.mode,
      timeLeftSec: m.timeLeftSec,
      timeLimitSec: m.timeLimitSec,

      activeGemCount: m.activeGemCount,
      boardSize: m.boardSize,

      scorePops: m.scorePops,
      flashIds: m.flashIds,
    });
  }, [
    onState,
    m.gems,
    m.score,
    m.targetScore,
    m.moves,
    m.level,
    m.selectedGem,
    m.shuffleUses,
    m.mode,
    m.timeLeftSec,
    m.timeLimitSec,
    m.activeGemCount,
    m.boardSize,
    m.scorePops,
    m.flashIds,
  ]);

  const size = Math.max(1, m.boardSize || 8);
  const boardPx = size * tileSize;

  return (
    <div className="relative flex items-center justify-center w-full">
      <div
        className="relative rounded-2xl"
        style={{
          width: boardPx,
          height: boardPx,
          background: "rgba(0,0,0,0.18)",
          backdropFilter: "blur(1px)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        {/* Gems */}
        {m.gems.map((g) => (
          <GemComponent
            key={g.id}
            gem={g}
            size={tileSize}
            isSelected={!!m.selectedGem && m.selectedGem.id === g.id}
            isFlashing={m.flashIds.includes(g.id)}
            onClick={() => m.selectGem(g)}
            level={m.level}
          />
        ))}

        {/* Score pops */}
        {m.scorePops.map((p) => (
          <div
            key={p.id}
            className="absolute text-white text-sm font-bold drop-shadow pointer-events-none"
            style={{
              left: p.x * tileSize + tileSize / 2,
              top: p.y * tileSize + tileSize / 2,
              transform: "translate(-50%, -50%)",
            }}
          >
            +{p.value}
          </div>
        ))}
      </div>
    </div>
  );
}