import { useEffect, useMemo, useState } from "react";
import { GAME_ASSETS } from "../../utils/gameAssets";
import { LogOut, Wallet } from "lucide-react";

type TopBarVariant = "game" | "map" | "menu";

export function TopBar(props: {
  variant?: TopBarVariant;

  onBack?: () => void;
  onHome?: () => void;
  onOpenWallet?: () => void;
  onOpenShop?: () => void;

  shardCount?: number;
  onOpenShards?: () => void;

  onShuffle?: () => void;
  shuffleUses?: number;
  onLogout?: () => void;

  onOpenDaily?: () => void;

  rubyntBalance: number;
  score: number;
  targetScore: number;
  moves: number;
  level: number;

  lives: number;
  maxLives?: number;

  mode?: "moves" | "timed";
  timeLeftSec?: number;
  timeLimitSec?: number;
  activeGemCount?: number;

  objectiveTitle?: string;
  objectiveText?: string;
  objectiveIcon?: string;

    dragonHp?: number;
  dragonMaxHp?: number;
  dragonJustHit?: boolean;
  dragonDefeated?: boolean;
}) {
  const {
    variant = "game",

    onBack,
    onHome,
    onOpenWallet,
    onShuffle,
    shuffleUses = 0,

    rubyntBalance,
    score,
    targetScore,
    moves,
    level,

    lives,
    maxLives = 3,

    mode = "moves",
    timeLeftSec = 0,
    timeLimitSec = 0,

    activeGemCount,
    objectiveTitle,
    objectiveText,
    objectiveIcon,

    dragonHp = 0,
    dragonMaxHp = 0,
    dragonJustHit = false,
    dragonDefeated = false,
  } = props;

  if (variant === "menu") return null;

  const isGame = variant === "game";
  const isMap = variant === "map";
  const isDragonBoss = objectiveTitle === "Dragon Boss";

  const { star1, star2, star3, starsEarned, progressPct, t1Pct, t2Pct } =
    useMemo(() => {
      const safeTarget = Math.max(600, Math.floor(Number(targetScore) || 0));

      const s1 = safeTarget;
      const s2 = Math.max(s1 + 1, Math.floor(safeTarget * 1.5));
      const s3 = Math.max(s2 + 1, Math.floor(safeTarget * 2));

      const earned = score >= s3 ? 3 : score >= s2 ? 2 : score >= s1 ? 1 : 0;

      const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
      const prog = clamp01(score / s3);

      return {
        star1: s1,
        star2: s2,
        star3: s3,
        starsEarned: earned,
        progressPct: prog * 100,
        t1Pct: (s1 / s3) * 100,
        t2Pct: (s2 / s3) * 100,
      };
    }, [score, targetScore]);

  const [prevStars, setPrevStars] = useState(0);
  const [pop1, setPop1] = useState(false);
  const [pop2, setPop2] = useState(false);
  const [pop3, setPop3] = useState(false);

  useEffect(() => {
    setPrevStars(0);
    setPop1(false);
    setPop2(false);
    setPop3(false);
  }, [level, targetScore]);

  useEffect(() => {
    if (!isGame) return;

    if (starsEarned > prevStars) {
      if (starsEarned >= 1 && prevStars < 1) {
        setPop1(true);
        window.setTimeout(() => setPop1(false), 220);
      }
      if (starsEarned >= 2 && prevStars < 2) {
        setPop2(true);
        window.setTimeout(() => setPop2(false), 220);
      }
      if (starsEarned >= 3 && prevStars < 3) {
        setPop3(true);
        window.setTimeout(() => setPop3(false), 220);
      }
      setPrevStars(starsEarned);
    } else if (starsEarned < prevStars) {
      setPrevStars(starsEarned);
    }
  }, [starsEarned, prevStars, isGame]);

  const heartSrc = GAME_ASSETS.ui.heart;
  const livesClamped = Math.max(0, Math.min(maxLives, lives));

  const timeText = useMemo(() => {
    const t = Math.max(0, Math.floor(timeLeftSec));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [timeLeftSec]);

  const timePct = useMemo(() => {
    if (mode !== "timed" || !timeLimitSec) return 0;
    return Math.max(0, Math.min(100, (timeLeftSec / timeLimitSec) * 100));
  }, [mode, timeLeftSec, timeLimitSec]);

  const dailyIconSrc = `${import.meta.env.BASE_URL}assets/ui/ruby_chest_closed.png`;
  const hasObjective = Boolean(objectiveTitle || objectiveText || objectiveIcon);

  const dragonPct = useMemo(() => {
    if (!isDragonBoss || dragonMaxHp <= 0) return 0;
    return Math.max(0, Math.min(100, (dragonHp / dragonMaxHp) * 100));
  }, [isDragonBoss, dragonHp, dragonMaxHp]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-black/58 backdrop-blur-md border-b border-white/10 overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 active:bg-white/10"
                title="Back"
              >
                ←
              </button>
            )}

            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="h-8 w-8 grid place-items-center rounded-lg bg-white/5 border border-white/10 active:bg-white/10"
                title="Home"
              >
                ⌂
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white/90 whitespace-nowrap min-w-0">
            {isMap ? (
              <>
                <div className="font-gothic text-sm sm:text-base font-bold leading-none">
                  World Map
                </div>
                <div className="text-[11px] sm:text-xs text-white/60 leading-none">
                  Level {level}
                </div>
              </>
            ) : (
              <>
                <div className="font-gothic text-sm sm:text-base font-bold leading-none">
                  L{level}
                </div>

                <div className="text-xs sm:text-sm font-semibold leading-none">
                  {mode === "timed" ? `${moves} moves` : `${moves} moves`}
                </div>

                {mode === "timed" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs tabular-nums">{timeText}</span>
                    <div className="h-1.5 w-12 sm:w-20 rounded bg-white/15 overflow-hidden">
                      <div
                        className="h-full bg-red-600/80"
                        style={{ width: `${timePct}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              {Array.from({ length: maxLives }).map((_, i) => {
                const filled = i < livesClamped;
                return (
                  <img
                    key={i}
                    src={heartSrc}
                    alt="life"
                    className={[
                      "w-4 h-4 sm:w-[18px] sm:h-[18px]",
                      filled ? "opacity-100" : "opacity-30",
                    ].join(" ")}
                    draggable={false}
                  />
                );
              })}
            </div>

            {isGame && onShuffle && shuffleUses > 0 && (
              <button
                type="button"
                onClick={onShuffle}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 active:scale-95 transition relative"
                title="Shuffle"
              >
                <img
                  src={`${import.meta.env.BASE_URL}assets/ui/shuffle.png`}
                  alt="shuffle"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none p-0.5"
                />
                <span className="absolute -right-1 -bottom-1 text-[9px] px-1 rounded bg-black/75 border border-white/10">
                  {shuffleUses}
                </span>
              </button>
            )}

            {props.onOpenDaily && (
              <button
                type="button"
                onClick={props.onOpenDaily}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 active:scale-95 transition"
                title="Daily Reward"
              >
                <img
                  src={dailyIconSrc}
                  alt="daily"
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none p-1"
                />
              </button>
            )}

            {onOpenWallet && (
              <button
                type="button"
                onClick={onOpenWallet}
                className="h-8 w-9 grid place-items-center rounded-lg bg-white/5 border border-white/10 active:bg-white/10"
                title="Wallet"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}

            {props.onOpenShop && (
              <button
                type="button"
                onClick={props.onOpenShop}
                className="px-2.5 py-1 text-[11px] bg-white/10 rounded-lg hover:bg-white/15 transition"
              >
                Shop
              </button>
            )}

            {props.onLogout && (
              <button
                type="button"
                onClick={props.onLogout}
                className="ml-1 flex items-center gap-1 px-2 py-1.5 rounded-lg bg-black/35 border border-white/10 hover:bg-black/55 active:scale-95 transition"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-[11px] text-white/60">
                  Logout
                </span>
              </button>
            )}

            {typeof props.shardCount === "number" && props.onOpenShards && (
              <button
                type="button"
                onClick={() => props.onOpenShards?.()}
                className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] sm:text-[11px]"
                title="Ruby shards"
              >
                Shards {props.shardCount}/15
              </button>
            )}

            {(isGame || isMap) && (
              <div className="ml-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-black/35 border border-white/10">
                <span className="text-[10px] text-white/60">BR</span>
                <span className="text-xs sm:text-sm font-semibold tabular-nums text-white/90">
                  {rubyntBalance}
                </span>
              </div>
            )}
          </div>
        </div>

        {isGame && hasObjective && (
          <div className="max-w-5xl mx-auto mt-1.5">
            <div
              className={[
                "rounded-xl border px-2.5 py-2 flex items-center gap-2.5 transition-all duration-200",
                isDragonBoss
                  ? "bg-red-950/30 border-red-500/25 shadow-[0_0_14px_rgba(220,38,38,0.12)]"
                  : "bg-black/25 border-white/10",
                dragonJustHit ? "scale-[1.01] shadow-[0_0_22px_rgba(255,70,70,0.28)]" : "",
                dragonDefeated ? "ring-2 ring-yellow-400/40 shadow-[0_0_24px_rgba(250,204,21,0.18)]" : "",
              ].join(" ")}
              style={{
                transform: dragonJustHit ? "translateX(1px)" : undefined,
              }}
            >
              {objectiveIcon && (
                <img
                  src={objectiveIcon}
                  alt="objective"
                  draggable={false}
                  className={[
                    "w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 opacity-95",
                    isDragonBoss ? "drop-shadow-[0_0_6px_rgba(255,80,80,0.35)]" : "",
                  ].join(" ")}
                />
              )}

              <div className="min-w-0 flex-1">
                {objectiveTitle && (
                  <div
                    className={[
                      "text-[10px] uppercase tracking-[0.14em] font-semibold",
                      isDragonBoss ? "text-red-300" : "text-red-200/70",
                    ].join(" ")}
                  >
                    {objectiveTitle}
                  </div>
                )}

                {objectiveText && (
                  <div
                    className={[
                      "text-xs sm:text-sm leading-tight break-words",
                      isDragonBoss ? "text-red-50" : "text-white/90",
                    ].join(" ")}
                  >
                    {objectiveText}
                  </div>
                )}

                                {isDragonBoss && dragonMaxHp > 0 && (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] text-red-200/80 mb-1">
                      <span>{dragonDefeated ? "Dragon Defeated" : "Dragon HP"}</span>
                      <span className="tabular-nums">
                        {Math.max(0, dragonHp)} / {dragonMaxHp}
                      </span>
                    </div>

                    <div
                      className={[
                        "h-1.5 rounded-full bg-black/40 border border-red-500/20 overflow-hidden transition-all duration-200",
                        dragonJustHit ? "ring-1 ring-red-300/30" : "",
                        dragonDefeated ? "border-yellow-400/35" : "",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "h-full rounded-full transition-[width] duration-300 ease-out",
                          dragonDefeated
                            ? "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300"
                            : "bg-gradient-to-r from-red-700 via-red-500 to-orange-400",
                        ].join(" ")}
                        style={{ width: `${dragonPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isGame && (
          <div className="max-w-5xl mx-auto mt-1.5">
            <div className="hidden md:flex items-end justify-between gap-3">
              <div className="text-white/90">
                <div className="text-[10px] text-white/60">score</div>
                <div className="text-sm font-bold leading-none tabular-nums">
                  {score}{" "}
                  <span className="text-white/50 text-xs font-normal">
                    / {Math.max(600, Math.floor(Number(targetScore) || 0))}
                  </span>
                </div>

                {typeof activeGemCount === "number" && (
                  <div className="text-[9px] text-white/35 mt-0.5 font-sans">
                    Active gems: {activeGemCount}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-base select-none">
                <span
                  className={[
                    starsEarned >= 1 ? "text-yellow-300" : "text-white/25",
                    pop1 ? "scale-125" : "scale-100",
                    "inline-block transition-transform duration-200 ease-out",
                  ].join(" ")}
                >
                  ★
                </span>
                <span
                  className={[
                    starsEarned >= 2 ? "text-yellow-300" : "text-white/25",
                    pop2 ? "scale-125" : "scale-100",
                    "inline-block transition-transform duration-200 ease-out",
                  ].join(" ")}
                >
                  ★
                </span>
                <span
                  className={[
                    starsEarned >= 3 ? "text-yellow-300" : "text-white/25",
                    pop3 ? "scale-125" : "scale-100",
                    "inline-block transition-transform duration-200 ease-out",
                  ].join(" ")}
                >
                  ★
                </span>
              </div>
            </div>

            <div className="hidden md:block mt-1.5 relative">
              <div className="h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-600/80"
                  style={{
                    width: `${progressPct}%`,
                    transition: "width 180ms ease-out",
                  }}
                />
              </div>

              <div
                className="absolute -top-[1px] w-[2px] h-3 bg-white/35"
                style={{ left: `${t1Pct}%` }}
              />
              <div
                className="absolute -top-[1px] w-[2px] h-3 bg-white/35"
                style={{ left: `${t2Pct}%` }}
              />

              <div className="mt-1 flex justify-between text-[9px] text-white/45 tabular-nums">
                <span>1★ {star1}</span>
                <span>2★ {star2}</span>
                <span>3★ {star3}</span>
              </div>
            </div>

            <div className="md:hidden">
              <div className="flex items-center justify-between text-[11px] text-white/80 tabular-nums">
                <span>
                  {score}/{Math.max(600, Math.floor(Number(targetScore) || 0))}
                </span>
                <span className="text-white/55">★{starsEarned}/3</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-red-600/80"
                  style={{
                    width: `${progressPct}%`,
                    transition: "width 180ms ease-out",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}