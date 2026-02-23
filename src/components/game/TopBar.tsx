import { useEffect, useMemo, useState } from "react";
import { GAME_ASSETS } from "../../utils/gameAssets";
import { Wallet } from "lucide-react";

// TopBar props bővítés

  {/* Mobil figyelmeztetés */}
  <div className="md:hidden bg-red-600/80 text-white text-xs text-center py-2">
    Mobile version is being optimized. Best experience on desktop.
  </div>

export function TopBar(props: {
  onBack?: () => void;
  onHome?: () => void;
  onOpenWallet?: () => void;

  onShuffle?: () => void;
  shuffleUses?: number;

  rubyntBalance: number;
  score: number;
  targetScore: number;
  moves: number;
  level: number;

  lives: number;
  maxLives?: number;

  // ✅ új
  mode?: "moves" | "timed";
  timeLeftSec?: number;
  timeLimitSec?: number;
  activeGemCount?: number;
}) {

  const {
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
  } = props;

  const { star1, star2, star3, starsEarned, progressPct, t1Pct, t2Pct } = useMemo(() => {
    const s1 = Math.max(1, Math.floor(targetScore));
    const s2 = Math.max(s1 + 1, Math.floor(targetScore * 1.5));
    const s3 = Math.max(s2 + 1, Math.floor(targetScore * 2));

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
    if (starsEarned > prevStars) {
      if (starsEarned >= 1 && prevStars < 1) {
        setPop1(true);
        window.setTimeout(() => setPop1(false), 260);
      }
      if (starsEarned >= 2 && prevStars < 2) {
        setPop2(true);
        window.setTimeout(() => setPop2(false), 260);
      }
      if (starsEarned >= 3 && prevStars < 3) {
        setPop3(true);
        window.setTimeout(() => setPop3(false), 260);
      }
      setPrevStars(starsEarned);
    } else if (starsEarned < prevStars) {
      setPrevStars(starsEarned);
    }
  }, [starsEarned, prevStars]);

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

  return (
  <div className="fixed top-0 left-0 right-0 z-[9999] h-6 md:h-20">
  <div className="w-full px-3 py-1 md:py-3 bg-black/45 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto flex flex-nowrap md:flex-wrap items-center gap-2">
          {/* Bal gombok */}
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                title="Vissza"
              >
                ←
              </button>
            )}
            {onHome && (
              <button
                type="button"
                onClick={onHome}
                className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                title="Home"
              >
                ⌂
              </button>
            )}
          </div>

          {/* Középső: Level + Moves + (Timed) */}
          <div className="flex items-center gap-3 min-w-[210px]">
            <div className="text-white/90 font-gothic">
              <div className="text-xs text-white/60">level</div>
              <div className="text-lg font-bold leading-none">{level}.</div>
            </div>

            <div className="text-white/90">
              <div className="text-xs text-white/60">moves</div>
              <div className="text-lg font-bold leading-none">{moves}</div>
            </div>

            {mode === "timed" && (
              <div className="text-white/90 min-w-[74px]">
                <div className="text-xs text-white/60">time</div>
                <div className="text-lg font-bold leading-none tabular-nums">{timeText}</div>
                <div className="mt-1 h-1 rounded bg-white/10 overflow-hidden">
                  <div className="h-full bg-red-600/80" style={{ width: `${timePct}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Score + progress */}
          <div className="w-full md:flex-1 order-3 md:order-none">
            <div className="flex items-end justify-between gap-3">
              <div className="text-white/90">
                <div className="text-xs text-white/60">score</div>
                <div className="text-base font-bold leading-none tabular-nums">
                  {score} <span className="text-white/50 text-sm font-normal">/ {targetScore}</span>
                </div>
                {typeof activeGemCount === "number" && (
                  <div className="text-[10px] text-white/35 mt-1 font-sans">
                    Active gems: {activeGemCount}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-lg select-none">
                <span className={[starsEarned >= 1 ? "text-yellow-300" : "text-white/25", pop1 ? "scale-125" : "scale-100", "inline-block transition-transform duration-200 ease-out"].join(" ")}>★</span>
                <span className={[starsEarned >= 2 ? "text-yellow-300" : "text-white/25", pop2 ? "scale-125" : "scale-100", "inline-block transition-transform duration-200 ease-out"].join(" ")}>★</span>
                <span className={[starsEarned >= 3 ? "text-yellow-300" : "text-white/25", pop3 ? "scale-125" : "scale-100", "inline-block transition-transform duration-200 ease-out"].join(" ")}>★</span>
              </div>
            </div>

            <div className="mt-2 relative">
              <div className="h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-red-600/80" style={{ width: `${progressPct}%`, transition: "width 180ms ease-out" }} />
              </div>
              <div className="absolute -top-[2px] w-[2px] h-4 bg-white/35" style={{ left: `${t1Pct}%` }} />
              <div className="absolute -top-[2px] w-[2px] h-4 bg-white/35" style={{ left: `${t2Pct}%` }} />

             <div className="mt-1 hidden md:flex justify-between text-[10px] text-white/45 tabular-nums">
               <span>1★ {star1}</span>
               <span>2★ {star2}</span>
               <span>3★ {star3}</span>
             </div>
            </div>
          </div>

          {/* Jobb oldal: Lives + Shuffle + Wallet */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: maxLives }).map((_, i) => {
                  const filled = i < livesClamped;
                  return (
                    <img
                      key={i}
                      src={heartSrc}
                      alt="life"
                      className={["w-5 h-5", filled ? "opacity-100" : "opacity-30"].join(" ")}
                      draggable={false}
                    />
                  );
                })}
              </div>

              {onShuffle && shuffleUses > 0 && (
                <button
                  type="button"
                  onClick={onShuffle}
                  className="ml-1 w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition relative"
                  title="Shuffle"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}assets/ui/shuffle.png`}
                    alt="shuffle"
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <span className="absolute -right-1 -bottom-1 text-[10px] px-1 rounded bg-black/70 border border-white/10">
                    {shuffleUses}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <div className="text-xs text-white/60">Rubynt</div>
                <div className="text-sm font-bold tabular-nums">{rubyntBalance}</div>
              </div>

              {onOpenWallet && (
                <button
                  type="button"
                  onClick={onOpenWallet}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                  title="Wallet"
                >
                  <Wallet></Wallet>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
