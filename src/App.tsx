// src/App.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { t } from "./i8n/i18n";
import { IntroScreen } from "./components/IntroScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { playSound, unlockAudio, playMusic } from "./utils/audioManager";
import { GameProvider, useGame } from "./components/game/GameState";
import { LevelMap } from "./components/game/LevelMap";
import { WalletModal } from "./components/game/WalletModal";
import { ShopModal } from "./components/game/ShopModal";
import { GAME_ASSETS } from "./utils/gameAssets";
import { TopBar } from "./components/game/TopBar";
import { assetUrl } from "./utils/assetUrl";
import { StoryOverlay } from "./components/game/StoryOverlay";
import { StorySidePanels } from "./components/game/StorySidePanels";
import { isShardLevel, markShardFound } from "./utils/shards";

import { RubyProgressPanel } from "./components/game/RubyProgressPanel";
import confetti from "canvas-confetti";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage as LoginPageComp } from "./pages/LoginPage";
import { useAuth } from "./app/auth/AuthProvider";

import { useMatch3 } from "./components/game/useMatch3";
import { GemComponent } from "./components/game/GemComponent";

import {
  rewardLevelOnce,
  isHardLevel67,
  getUserKeyFromStorage,
  grantChestReward,
} from "./app/rewards/brRewards";

const LS_CURRENT = "br_currentLevel";
const LS_UNLOCKED = "br_unlockedLevel";
const LS_SEEN_INTRO = "br_seenIntro";
const LS_SEEN_WELCOME = "br_seenWelcome";

// ✅ shards local state persistence (safe, doesn’t break existing shards.ts)
const LS_SHARDS_FOUND = "br_shards_found_levels_v1";

// 15 shard levels (full saga plan – ok even if TOTAL_LEVELS is smaller for now)
const SHARD_LEVELS = [67, 134, 201, 268, 335, 402, 469, 536, 603, 670, 737, 804, 871, 938, 1000];

const TOTAL_LEVELS = 200;

const MUSIC_MENU = assetUrl("assets/audio/music/music_menu.mp3");
const MUSIC_BOSS_01 = assetUrl("assets/audio/music/music_boss_01.mp3");
const MUSIC_BOSS_02 = assetUrl("assets/audio/music/music_boss_02.mp3");
const MUSIC_BOSS_03 = assetUrl("assets/audio/music/music_boss_03.mp3");
const MUSIC_BOSS_04 = assetUrl("assets/audio/music/music_boss_04.mp3");
const MUSIC_BOSS_05 = assetUrl("assets/audio/music/music_boss_05.mp3");
const MUSIC_GAME_01 = assetUrl("assets/audio/music/music_game_01.mp3");
const MUSIC_GAME_02 = assetUrl("assets/audio/music/music_game_02.mp3");
const MUSIC_MENU_01 = assetUrl("assets/audio/music/music_menu_01.mp3");
const MUSIC_BOSS_06 = assetUrl("assets/audio/music/music_boss_06.mp3");
const MUSIC_BOSS_07 = assetUrl("assets/audio/music/music_boss_07.mp3");
const MUSIC_BOSS_08 = assetUrl("assets/audio/music/music_boss_08.mp3");
const MUSIC_BOSS_09 = assetUrl("assets/audio/music/music_boss_09.mp3");
const MUSIC_BOSS_10 = assetUrl("assets/audio/music/music_boss_10.mp3");
const MUSIC_BOSS_11 = assetUrl("assets/audio/music/music_boss_11.mp3");
const MUSIC_BOSS_12 = assetUrl("assets/audio/music/music_boss_12.mp3");
const MUSIC_BOSS_13 = assetUrl("assets/audio/music/music_boss_13.mp3");
const MUSIC_BOSS_14 = assetUrl("assets/audio/music/music_boss_14.mp3");
const MUSIC_BOSS_15 = assetUrl("assets/audio/music/music_boss_15.mp3");
const MUSIC_BOSS_16 = assetUrl("assets/audio/music/music_boss_16.mp3");
const MUSIC_BOSS_17 = assetUrl("assets/audio/music/music_boss_17.mp3");
const MUSIC_BOSS_18 = assetUrl("assets/audio/music/music_boss_18.mp3");
const MUSIC_BOSS_19 = assetUrl("assets/audio/music/music_boss_19.mp3");
const MUSIC_BOSS_20 = assetUrl("assets/audio/music/music_boss_20.mp3");
const MUSIC_BOSS_21 = assetUrl("assets/audio/music/music_boss_21.mp3");
const MUSIC_BOSS_22 = assetUrl("assets/audio/music/music_boss_22.mp3");
function clampLevel(n: number) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function pickBgByBlock(
  list: readonly string[],
  levelLike: number,
  blockSize: number,
  fallback: string
) {
  if (!list || list.length === 0) return fallback;
  const lvl = clampLevel(levelLike);
  const idx = Math.floor((lvl - 1) / blockSize) % list.length;
  return list[idx] ?? fallback;
}

function getStoryForLevel(lvlLike: number): { left: string; right: string } | null {
  const lvl = clampLevel(lvlLike);
  const blockStart = Math.floor((lvl - 1) / 10) * 10 + 1;

  switch (blockStart) {
    case 1:
      return {
        left:
          "Bloody Rubynts is no mere coin.\n" +
          "Once there was a single Ruby-Heart,\n" +
          "a crystal that held the night at bay.\n" +
          "Then it shattered.",
        right:
          "Its shards fell into groves and graves,\n" +
          "castles and catacombs.\n" +
          "Gather them, and balance may return…\n" +
          "or chaos may awaken.",
      };
    default:
      return null;
  }
}

function calcStars(score: number, targetScore: number) {
  const star1 = targetScore;
  const star2 = Math.floor(targetScore * 1.5);
  const star3 = Math.floor(targetScore * 2);
  return score >= star3 ? 3 : score >= star2 ? 2 : score >= star1 ? 1 : 0;
}

function shardIndexForLevel(level: number) {
  return SHARD_LEVELS.indexOf(clampLevel(level));
}
function shardValueByIndex(idx: number) {
  // 10, 15, 20, ... (simple and clear)
  return 10 + idx * 5;
}
function shardImageByIndex(idx: number) {
  const n = String(idx + 1).padStart(2, "0");
  // user’s confirmed path: public/assets/backgrounds/map/ruby/ruby_shard_09.png
  return assetUrl(`assets/backgrounds/map/ruby/ruby_shard_${n}.png`);
}

function readShardsFoundFromStorage(): number[] {
  try {
    const raw = localStorage.getItem(LS_SHARDS_FOUND);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const cleaned = arr
      .map((x) => clampLevel(Number(x)))
      .filter((x) => Number.isFinite(x) && x > 0);
    // unique
    return Array.from(new Set(cleaned));
  } catch {
    return [];
  }
}

function writeShardsFoundToStorage(levels: number[]) {
  try {
    localStorage.setItem(LS_SHARDS_FOUND, JSON.stringify(levels));
  } catch {}
}

// ✅ Shards modal (kept inside App.tsx so nothing else is required)
function ShardsModal(props: {
  onClose: () => void;
  foundLevels: number[];
}) {
  const foundSet = useMemo(() => new Set(props.foundLevels), [props.foundLevels]);

  return (
    <div
      className="fixed inset-0 z-[25000] bg-black/70 flex items-center justify-center p-4"
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold">Ruby Shards</h3>
            <div className="text-[11px] text-white/45">
              Progress:{" "}
              <span className="text-white/75">
                {props.foundLevels.length}/{SHARD_LEVELS.length}
              </span>
            </div>
          </div>

          <button
            onClick={props.onClose}
            className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition"
            type="button"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {SHARD_LEVELS.map((lvl, idx) => {
            const found = foundSet.has(lvl);
            const value = shardValueByIndex(idx);
            const img = shardImageByIndex(idx);

            return (
              <div
                key={lvl}
                className={`rounded-xl border p-2 bg-black/30 ${
                  found ? "border-red-300/50" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[11px] text-white/50">Shard {idx + 1}</div>
                  <div className={`text-[11px] ${found ? "text-red-200" : "text-white/35"}`}>
                    {found ? "FOUND" : "LOCKED"}
                  </div>
                </div>

                <div className="rounded-lg bg-black/40 border border-white/10 flex items-center justify-center aspect-square overflow-hidden">
                  {/* If image missing, it will just not show – still safe */}
                  <img
                    src={img}
                    alt={`Ruby shard ${idx + 1}`}
                    className={`w-full h-full object-contain ${found ? "" : "opacity-40 grayscale"}`}
                    draggable={false}
                  />
                </div>

                <div className="mt-2 text-[11px] text-white/45">
                  Level: <span className="text-white/70">{lvl}</span>
                </div>
                <div className="text-[11px] text-white/45">
                  Value:{" "}
                  <span className={found ? "text-red-200 font-semibold" : "text-white/60"}>
                    {value} BR
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-[11px] text-white/40">
          Tip: shards are earned on shard levels (special challenge stages). When you earn one, you also get the BR value.
        </div>
      </div>
    </div>
  );
}

const MainGame = ({ onLogout }: { onLogout: () => void }) => {
  const [lang] = useState<"hu" | "en">("en");

  type AppScreen = "menu" | "map" | "game";
  const [screen, setScreen] = useState<AppScreen>("menu");

  const {
    progress,
    completeLevel,
    isLoading,
    lives,
    maxLives,
    spendLife,
    refreshRubyntBalance,
  } = useGame();

  useEffect(() => {
  refreshRubyntBalance();
}, [refreshRubyntBalance]);
 
const [showWallet, setShowWallet] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const [endOpen, setEndOpen] = useState(false);
  const [endStars, setEndStars] = useState(0);
  const [endWon, setEndWon] = useState(false);

  // ✅ Shards UI state + persisted progress
  const [showShards, setShowShards] = useState(false);
  const [shardsFoundLevels, setShardsFoundLevels] = useState<number[]>(() => readShardsFoundFromStorage());
  const shardCount = shardsFoundLevels.length;

  const [currentLevel, setCurrentLevel] = useState(() => {
    const raw = localStorage.getItem(LS_CURRENT);
    return clampLevel(Number(raw ?? 1));
  });

  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const raw = localStorage.getItem(LS_UNLOCKED);
    return clampLevel(Number(raw ?? 1));
  });

  useEffect(() => localStorage.setItem(LS_CURRENT, String(currentLevel)), [currentLevel]);
  useEffect(() => localStorage.setItem(LS_UNLOCKED, String(unlockedLevel)), [unlockedLevel]);

  // ✅ keep shards in localStorage
  useEffect(() => {
    writeShardsFoundToStorage(shardsFoundLevels);
  }, [shardsFoundLevels]);

  const addShardFound = useCallback((level: number) => {
    const L = clampLevel(level);
    setShardsFoundLevels((prev) => {
      if (prev.includes(L)) return prev;
      const next = [...prev, L];
      // keep stable order by shard list order (nice UI)
      next.sort((a, b) => SHARD_LEVELS.indexOf(a) - SHARD_LEVELS.indexOf(b));
      return next;
    });
  }, []);

  function pickGameMusicByLevel(lvlLike: number): string | null {
    const lvl = clampLevel(lvlLike);

    if (lvl >= 1 && lvl <= 10) return MUSIC_BOSS_01;
    if (lvl >= 11 && lvl <= 20) return MUSIC_BOSS_02;
    if (lvl >= 21 && lvl <= 30) return MUSIC_BOSS_03;
    if (lvl >= 31 && lvl <= 40) return MUSIC_BOSS_04;
    if (lvl >= 41 && lvl <= 50) return MUSIC_BOSS_05;
    if (lvl >= 51 && lvl <= 60) return MUSIC_GAME_01;
    if (lvl >= 61 && lvl <= 70) return MUSIC_GAME_02;
    if (lvl >= 71 && lvl <= 80) return MUSIC_MENU_01;
   
     // 🔁 Ismétlés 81–160

    if (lvl >= 81 && lvl <= 90) return MUSIC_BOSS_01;
    if (lvl >= 91 && lvl <= 100) return MUSIC_BOSS_02;
    if (lvl >= 101 && lvl <= 110) return MUSIC_BOSS_03;
    if (lvl >= 111 && lvl <= 120) return MUSIC_BOSS_04;
    if (lvl >= 121 && lvl <= 130) return MUSIC_BOSS_05;

    if (lvl >= 131 && lvl <= 140) return MUSIC_GAME_01;
    if (lvl >= 141 && lvl <= 150) return MUSIC_GAME_02;
    if (lvl >= 151 && lvl <= 160) return MUSIC_MENU_01;

    // 🔥 161–500

if (lvl >= 161 && lvl <= 180) return MUSIC_BOSS_06;
if (lvl >= 181 && lvl <= 200) return MUSIC_BOSS_07;
if (lvl >= 201 && lvl <= 220) return MUSIC_BOSS_08;
if (lvl >= 221 && lvl <= 240) return MUSIC_BOSS_09;
if (lvl >= 241 && lvl <= 260) return MUSIC_BOSS_10;
if (lvl >= 261 && lvl <= 280) return MUSIC_BOSS_11;
if (lvl >= 281 && lvl <= 300) return MUSIC_BOSS_12;
if (lvl >= 301 && lvl <= 320) return MUSIC_BOSS_13;
if (lvl >= 321 && lvl <= 340) return MUSIC_BOSS_14;
if (lvl >= 341 && lvl <= 360) return MUSIC_BOSS_15;
if (lvl >= 361 && lvl <= 380) return MUSIC_BOSS_16;
if (lvl >= 381 && lvl <= 400) return MUSIC_BOSS_17;
if (lvl >= 401 && lvl <= 420) return MUSIC_BOSS_18;
if (lvl >= 421 && lvl <= 440) return MUSIC_BOSS_19;
if (lvl >= 441 && lvl <= 460) return MUSIC_BOSS_20;
if (lvl >= 461 && lvl <= 480) return MUSIC_BOSS_21;
if (lvl >= 481 && lvl <= 500) return MUSIC_BOSS_22;
    return null;
  }

  const [vw, setVw] = useState(() => window.innerWidth);
  const [vh, setVh] = useState(() => window.innerHeight);

  useEffect(() => {
    const onFirstGesture = async () => {
      try {
        await unlockAudio();
        playMusic(MUSIC_MENU);
      } catch {}
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    return () => window.removeEventListener("pointerdown", onFirstGesture);
  }, []);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize)
  }, []);

  // ✅ MATCH-3
  const m3 = useMatch3(screen === "game");

  // ✅ amikor screen vált, frissítsük a balance-t (nem bántja a játék logikát)
  useEffect(() => {
    try {
      refreshRubyntBalance();
    } catch {}
  }, [screen, refreshRubyntBalance]);

  // ✅ csak egyszer indítsuk el ugyanazt a levelt
  const lastStartedRef = useRef<number>(0);
  useEffect(() => {
    if (screen !== "game") return;
    if (lastStartedRef.current === currentLevel) return;
    lastStartedRef.current = currentLevel;

    m3.startNewGame(currentLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentLevel]);

  const tileSize = useMemo(() => {
    const bs = m3.boardSize || 8;
    return Math.max(40, Math.min(64, Math.floor(Math.min(vw - 32, vh * 0.62) / bs)));
  }, [vw, vh, m3.boardSize]);

  const desiredBg = useMemo(() => {
    const fallback = GAME_ASSETS.menuBackground;

    if (screen === "menu") return GAME_ASSETS.menuBackground;
    if (screen === "map")
      return pickBgByBlock(GAME_ASSETS.mapBackgrounds, currentLevel, 20, fallback);
    return pickBgByBlock(GAME_ASSETS.storyBackgrounds, m3.level, 20, fallback);
  }, [screen, currentLevel, m3.level]);

  const [bgUrl, setBgUrl] = useState<string>(GAME_ASSETS.menuBackground);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setBgUrl(desiredBg);
    };
    img.onerror = () => {
      if (!cancelled) setBgUrl(GAME_ASSETS.menuBackground);
    };
    img.src = desiredBg;

    return () => {
      cancelled = true;
    };
  }, [desiredBg]);

  // zene
  useEffect(() => {
    let track: string | null;
    if (screen === "menu" || screen === "map") track = MUSIC_MENU;
    else track = pickGameMusicByLevel(m3.level);

    try {
      if (track) playMusic(track);
    } catch {}
  }, [screen, m3.level]);

  // story popup
  useEffect(() => {
    if (screen !== "game") return;
    if ((m3.level - 1) % 20 === 0) {
      const s = getStoryForLevel(m3.level);
      if (s) setStoryOpen(true);
    }
  }, [screen, m3.level]);

  const starsNow = useMemo(() => {
    if (screen !== "game") return 0;
    return calcStars(m3.score, m3.targetScore);
  }, [screen, m3.score, m3.targetScore]);

  // ✅ CHEST reward figyelés (useMatch3 módosítás nélkül)
  // Megpróbáljuk megtalálni a chest számlálót több néven is.
  const chestCount = useMemo(() => {
    const v = (m3 as any)?.progress?.chests ?? (m3 as any)?.foundChests ?? 0;
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  }, [m3]);

  const prevChestRef = useRef<number>(0);
  useEffect(() => {
    if (screen !== "game") return;

    const userKey = getUserKeyFromStorage();
    if (!userKey || userKey === "guest") return;

    const prev = prevChestRef.current;
    if (chestCount > prev) {
      const delta = chestCount - prev;

      // ✅ stable chest rewards: seeded + ledger protected
      for (let i = 0; i < delta; i++) {
        const chestIndex = prev + i + 1; // 1..N
        try {
          grantChestReward(userKey, m3.level, chestIndex);
        } catch {}
      }

      try {
        refreshRubyntBalance();
      } catch {}
    }

    prevChestRef.current = chestCount;
  }, [screen, chestCount, refreshRubyntBalance, m3.level]);

  // pass report (1★) - egyszer
  const reportedPassRef = useRef<number>(0);
  useEffect(() => {
    if (screen !== "game") return;
    if (starsNow < 1) return;
    if (reportedPassRef.current === m3.level) return;

    reportedPassRef.current = m3.level;

    const next = clampLevel(m3.level + 1);
    setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));

    const userKey = getUserKeyFromStorage();

    const base = Math.max(1, Math.min(3, starsNow));
    rewardLevelOnce(userKey, m3.level, base, "level_clear");

    // ✅ shard bonus now follows shard index: 10, 15, 20, ...
    if (isShardLevel(m3.level)) {
      const idx = shardIndexForLevel(m3.level);
      const shardBonus = idx >= 0 ? shardValueByIndex(idx) : 10;

      rewardLevelOnce(userKey, m3.level + 1000000, shardBonus, "shard_bonus");

      // track in UI progress
      addShardFound(m3.level);
    }

    if (isHardLevel67(m3.level)) {
      rewardLevelOnce(userKey, m3.level + 2000000, 20, "hard_level_bonus");
    }

    try {
      refreshRubyntBalance();
    } catch {}

    try {
      completeLevel?.(m3.level, m3.score, starsNow);
      if (isShardLevel(m3.level)) markShardFound(m3.level);
    } catch {}
  }, [screen, starsNow, m3.level, m3.score, completeLevel, refreshRubyntBalance, addShardFound]);

  // end modal - egyszer
  const endShownForRef = useRef<string>("");
  useEffect(() => {
    if (screen !== "game") return;

    const timedOut = m3.mode === "timed" && m3.timeLeftSec <= 0;
    const noMoves = m3.mode === "moves" && m3.moves <= 0;
    if (!timedOut && !noMoves) return;

    const key = `${m3.level}:${timedOut ? "t" : "m"}`;
    if (endShownForRef.current === key) return;
    endShownForRef.current = key;

    const passed = starsNow >= 1;
    setEndWon(passed);
    setEndStars(starsNow);
    setEndOpen(true);
  }, [screen, m3.level, m3.mode, m3.timeLeftSec, m3.moves, starsNow]);

  // end sound + confetti (egyszer)
  const lastEndSoundRef = useRef<string>("");
  useEffect(() => {
    if (!endOpen) {
      lastEndSoundRef.current = "";
      return;
    }
    const key = endWon ? "win" : "defeat";
    if (lastEndSoundRef.current === key) return;

    lastEndSoundRef.current = key;
    playSound(key);

    if (key === "win") {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.3, y: 0.6 },
        colors: ["#b30000", "#ff1a1a", "#990000"],
      });
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.7, y: 0.6 },
        colors: ["#b30000", "#ff1a1a", "#990000"],
      });
    }
  }, [endOpen, endWon]);

  useEffect(() => {
    if (screen !== "game" && endOpen) setEndOpen(false);
    if (screen !== "game") endShownForRef.current = "";
  }, [screen, endOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-gothic animate-pulse">
        Summoning the Vault...
      </div>
    );
  }

  const story = getStoryForLevel(m3.level);

  // retry / next lock
  const endActionLockRef = useRef(false);

  return (
    <div className="min-h-screen w-full bg-[#1a0505] text-white overflow-hidden font-sans relative">
      {/* háttér */}
      <div
        className="fixed inset-0 z-0 transition-opacity duration-700 pointer-events-none"
        style={{
          backgroundImage: `url('${bgUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(1px)",
          opacity: 0.92,
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/40 via-red-950/20 to-black/70 md:from-black/20 md:via-red-950/10 md:to-black/40 pointer-events-none" />

      {/* content */}
      <div className="relative z-10 min-h-[100svh] w-full flex flex-col items-center justify-center pt-16 md:pt-24">
        {screen === "game" && story && (
          <StorySidePanels
            leftText={story.left}
            rightText={story.right}
            showKnights
            showDragons={m3.level >= 50}
          />
        )}

        {screen === "menu" && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 pt-16 md:pt-24">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-300 to-red-600 font-gothic tracking-wider uppercase">
                {t("menu.title")}
              </h1>
              <p className="text-red-200/60 text-sm mt-2 tracking-[0.3em] uppercase font-gothic">
                Bloody Rubynts Saga
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound("click");
                setScreen("map");
              }}
              className="px-12 py-4 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 text-xl font-gothic border border-red-500/30"
            >
              {t("menu.enter")}
            </button>
          </div>
        )}

        {screen === "map" && (
          <div
            className="relative w-full"
            style={{ paddingTop: 56, height: "100svh", overflow: "hidden" }}
          >
            <RubyProgressPanel />
            {story && <StorySidePanels leftText={story.left} rightText={story.right} showKnights={true} />}

            <div className="w-full h-full">
              <LevelMap
                totalLevels={TOTAL_LEVELS}
                currentLevel={currentLevel}
                unlockedLevel={unlockedLevel}
                onSelectLevel={(l: number) => {
                  const L = typeof lives === "number" ? lives : 3;
                  if (L <= 0) {
                    playSound("click");
                    setShowShop(true);
                    return;
                  }

                  playSound("click");
                  setEndOpen(false);

                  reportedPassRef.current = 0;
                  endShownForRef.current = "";
                  endActionLockRef.current = false;

                  const picked = clampLevel(l);
                  setCurrentLevel(picked);

                  lastStartedRef.current = 0;
                  setScreen("game");
                }}
              />
            </div>
          </div>
        )}

        {screen === "game" && (
          <>
            <div
              className="relative rounded-3xl bg-black/20 backdrop-blur-sm border border-white/10"
              style={{
                width: m3.boardSize * tileSize,
                height: m3.boardSize * tileSize,
              }}
            >
              {m3.gems.map((g) => (
                <GemComponent
                  key={g.id}
                  gem={g}
                  size={tileSize}
                  isSelected={m3.selectedGem?.id === g.id}
                  isFlashing={m3.flashIds.includes(g.id)}
                  onClick={() => m3.selectGem(g)}
                  level={m3.level}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                playSound("click");
                setScreen("map");
              }}
              className="px-6 py-2 bg-red-900/50 hover:bg-red-800 rounded-full text-sm font-gothic mt-6 mb-8"
            >
              {lang === "hu" ? "Vissza a térképre" : "Back to map"}
            </button>
          </>
        )}
      </div>

      {/* TOPBAR */}
      <TopBar
        variant={screen === "game" ? "game" : screen === "map" ? "map" : "menu"}
        onBack={
          screen === "game"
            ? () => {
                playSound("click");
                setScreen("map");
              }
            : undefined
        }
        onHome={() => {
          playSound("click");
          setScreen("menu");
        }}
        onLogout={() => {
          playSound("click");
          onLogout();
        }}
       onOpenShop={() => {
  playSound("click");
  try {
    refreshRubyntBalance();
  } catch {}
  setShowShop(true);
}}
        shardCount={shardCount}
        onOpenShards={() => {
  playSound("click");
  try {
    refreshRubyntBalance();
  } catch {}
  setShowShards(true);
}}
        rubyntBalance={progress?.rubyntBalance ?? 0}
      onOpenWallet={() => {
  playSound("click");
  try {
    refreshRubyntBalance();
  } catch {}
  setShowWallet(true);
}}
        score={screen === "game" ? m3.score : 0}
        targetScore={screen === "game" ? m3.targetScore : 0}
        moves={screen === "game" ? m3.moves : 0}
        level={screen === "game" ? m3.level : currentLevel}
        lives={typeof lives === "number" ? lives : 3}
        maxLives={typeof maxLives === "number" ? maxLives : 3}
        onShuffle={
          screen === "game"
            ? () => {
                playSound("click");
                m3.shuffleBoard();
              }
            : undefined
        }
        shuffleUses={screen === "game" ? m3.shuffleUses : 0}
        mode={screen === "game" ? m3.mode : "moves"}
        timeLeftSec={screen === "game" ? m3.timeLeftSec : 0}
        timeLimitSec={screen === "game" ? m3.timeLimitSec : 0}
        activeGemCount={screen === "game" ? m3.activeGemCount : 0}
      />

      {endOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#140404] border border-red-900/40 p-5 text-center br-win-modal">
            <h2 className="text-2xl font-gothic mb-2">
              {endWon
                ? lang === "hu"
                  ? "Gratulálunk!"
                  : "Congratulations!"
                : m3.mode === "timed"
                  ? lang === "hu"
                    ? "Lejárt az idő!"
                    : "Time’s up!"
                  : lang === "hu"
                    ? "Elfogytak a lépések!"
                    : "Out of moves!"}
            </h2>

            {endWon && (
              <>
                <div className="text-xl mb-3">
                  {"★".repeat(endStars)}
                  {"☆".repeat(3 - endStars)}
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Reward: <span className="text-red-200 font-bold">+{endStars}</span> Vault Stars
                </div>
              </>
            )}

            <div className="flex gap-3 justify-center mt-4">
              <button
                className="px-4 py-2 rounded-full bg-black/40 border border-red-900/40 br-win-modal"
                onClick={() => {
                  playSound("click");
                  setEndOpen(false);
                  setScreen("map");
                }}
                type="button"
              >
                {lang === "hu" ? "Térkép" : "Map"}
              </button>

              <button
                className="px-4 py-2 rounded-full bg-red-900/60 hover:bg-red-800 br-win-modal"
                onClick={() => {
                  if (endActionLockRef.current) return;
                  endActionLockRef.current = true;

                  playSound("click");
                  setEndOpen(false);

                  if (endWon) {
                    const next = clampLevel(m3.level + 1);
                    setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));
                    setCurrentLevel(next);

                    reportedPassRef.current = 0;
                    endShownForRef.current = "";

                    lastStartedRef.current = 0;
                    m3.startNewGame(next);
                    setScreen("game");
                  } else {
                    const L = typeof lives === "number" ? lives : 3;
                    if (L <= 0) {
                      setScreen("map");
                      endActionLockRef.current = false;
                      return;
                    }

                    try {
                      spendLife();
                    } catch {}

                    reportedPassRef.current = 0;
                    endShownForRef.current = "";

                    lastStartedRef.current = 0;
                    m3.startNewGame(m3.level);
                    setScreen("game");
                  }

                  window.setTimeout(() => {
                    endActionLockRef.current = false;
                  }, 350);
                }}
                type="button"
              >
                {endWon ? (lang === "hu" ? "Következő pálya" : "Next Level") : lang === "hu" ? "Újra" : "Retry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {story && (
        <StoryOverlay
          open={storyOpen}
          textLeft={story.left}
          textRight={story.right}
          onClose={() => setStoryOpen(false)}
          showDragons={m3.level >= 50}
        />
      )}

      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* ✅ Shards modal */}
      {showShards && (
        <ShardsModal
          onClose={() => setShowShards(false)}
          foundLevels={shardsFoundLevels}
        />
      )}
    </div>
  );
};

export default function App() {
  const { user, setUser } = useAuth() as any;
  const [stage, setStage] = useState<"intro" | "welcome" | "login" | "register" | "game">("intro");

  const handleLogout = () => {
    try {
      localStorage.removeItem("br_user");
      localStorage.removeItem("br_auth_user");
      localStorage.removeItem("br_token");
    } catch {}

    setUser(null);
    setStage("login");
  };

  useEffect(() => {
    const seenIntro = localStorage.getItem(LS_SEEN_INTRO) === "1";
    const seenWelcome = localStorage.getItem(LS_SEEN_WELCOME) === "1";

    if (!seenIntro) setStage("intro");
    else if (!seenWelcome) setStage("welcome");
    else if (user) setStage("game");
    else setStage("login");
  }, [user]);

  return (
    <GameProvider>
      {stage === "intro" && (
        <IntroScreen
          onContinue={() => {
            localStorage.setItem(LS_SEEN_INTRO, "1");
            setStage("welcome");
          }}
        />
      )}

      {stage === "welcome" && (
        <WelcomeScreen
          onContinue={() => {
            localStorage.setItem(LS_SEEN_WELCOME, "1");
            setStage("login");
          }}
        />
      )}

      {stage === "login" && (
        <LoginPageComp
          onGoRegister={() => setStage("register")}
          onDone={() => setStage("game")}
        />
      )}

      {stage === "register" && (
        <RegisterPage
          onBack={() => setStage("login")}
          onDone={() => setStage("game")}
        />
      )}

      {stage === "game" && <MainGame onLogout={handleLogout} />}
    </GameProvider>
  );
}