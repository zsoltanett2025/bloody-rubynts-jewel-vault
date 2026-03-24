import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { t } from "./i8n/i18n";
import { IntroScreen } from "./components/IntroScreen";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { playSound, unlockAudio, playMusic } from "./utils/audioManager";
import { GameProvider } from "./components/game/GameState";
import { useGame } from "./components/game/GameState";
import { LevelMap } from "./components/game/LevelMap";
import { WalletModal } from "./components/game/WalletModal";
import { ShopModal } from "./components/game/ShopModal";
import { GAME_ASSETS } from "./utils/gameAssets";
import { TopBar } from "./components/game/TopBar";
import { assetUrl } from "./utils/assetUrl";
import { StoryOverlay } from "./components/game/StoryOverlay";
import { StorySidePanels } from "./components/game/StorySidePanels";
import { isShardLevel, markShardFound } from "./utils/shards";
import { ShardModal } from "./components/game/ShardModal";

import confetti from "canvas-confetti";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage as LoginPageComp } from "./pages/LoginPage";
import { useAuth } from "./app/auth/AuthProvider";

import { useMatch3 } from "./components/game/useMatch3";
import { GemComponent } from "./components/game/GemComponent";
import { DailyChestModal } from "./components/daily/DailyChestModal";
import { DevPanel } from "./components/dev/DevPanel";
import { getLevelRules, type LevelRules } from "./components/game/levels";
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
const LS_INF_LIFE_UNTIL = "br_infinite_life_until_v1";
const LS_SHARDS_FOUND = "br_shards_found_levels_v1";

const SHARD_LEVELS = [
  67, 134, 201, 268, 335, 402, 469, 536, 603, 670, 737, 804, 871, 938, 1000,
];

const TOTAL_LEVELS = 1000;

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

function safeStoredLevel(value: string | null, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return clampLevel(n);
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
  return 10 + idx * 5;
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

function getInfiniteLifeLeftMs(): number {
  try {
    const until = Number(localStorage.getItem(LS_INF_LIFE_UNTIL) || 0);
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

function formatDurationShort(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getObjectiveIcon(rules: LevelRules): string {
  if (rules.challenge?.type === "lava") {
    return assetUrl("assets/objectives/objective_dragon_caged_01.png");
  }

  if (rules.challenge?.type === "bomb_collect") {
    return assetUrl("assets/objectives/objective_dragon_caged_02.png");
  }

  if (rules.challenge?.type === "rainbow_focus") {
    return assetUrl("assets/objectives/objective_dragon_caged_03.png");
  }

  if (rules.challenge?.type === "dragon") {
    return assetUrl("assets/objectives/objective_dragon_caged_02.png");
  }

  if (rules.goal.type === "chest") {
    return GAME_ASSETS.chests.purple;
  }

  if (rules.goal.type === "clear") {
    const gemMap: Record<string, string> = {
      ruby: GAME_ASSETS.gems.ruby_round,
      blood: GAME_ASSETS.gems.blood_drop,
      amethyst: GAME_ASSETS.gems.amethyst_oval,
      onyx: GAME_ASSETS.gems.onyx_round,
      silver: GAME_ASSETS.gems.emerald_round,
    };
    return gemMap[rules.goal.gem] ?? GAME_ASSETS.gems.ruby_round;
  }

  return GAME_ASSETS.gems.ruby_round;
}

function getObjectiveTitle(rules: LevelRules): string {
  if (rules.challenge?.type === "lava") return "Challenge";
  if (rules.challenge?.type === "bomb_collect") return "Challenge";
  if (rules.challenge?.type === "rainbow_focus") return "Challenge";
  if (rules.challenge?.type === "dragon") return "Dragon Boss";

  if (rules.goal.type === "score") return "Objective";
  if (rules.goal.type === "clear") return "Objective";
  if (rules.goal.type === "chest") return "Objective";

  return "Objective";
}

function getObjectiveText(
  rules: LevelRules,
  progress: { score: number; chests: number; cleared: Record<string, number> },
  dragonHp?: number
): string {
  const challenge = rules.challenge;

  if (challenge?.type === "lava") {
    return `Lava level • intensity ${challenge.intensity}`;
  }

  if (challenge?.type === "bomb_collect") {
    return `Bomb challenge • target ${challenge.count}`;
  }

  if (challenge?.type === "rainbow_focus") {
    return `Rainbow challenge • target ${challenge.count}`;
  }

  if (challenge?.type === "dragon") {
    return `Defeat the dragon • HP ${Math.max(0, dragonHp ?? challenge.hp)}`;
  }

  if (rules.goal.type === "score") {
    return `Reach ${rules.goal.target} score • now ${progress.score}`;
  }

  if (rules.goal.type === "clear") {
    const done = progress.cleared?.[rules.goal.gem] ?? 0;
    return `Collect ${rules.goal.count} ${rules.goal.gem} • ${done}/${rules.goal.count}`;
  }

  if (rules.goal.type === "chest") {
    return `Open ${rules.goal.count} chest • ${progress.chests}/${rules.goal.count}`;
  }

  return "";
}

const MainGame = ({ onLogout }: { onLogout: () => void }) => {
  const {
    progress,
    completeLevel,
    isLoading,
    lives,
    maxLives,
    spendLife,
    addRubynts,
    addInventoryItem,
    consumeInventoryItem,
    refreshRubyntBalance,
  } = useGame();

  const [lang] = useState<"hu" | "en">("en");

  type AppScreen = "menu" | "map" | "game";
  const [screen, setScreen] = useState<AppScreen>("menu");

  useEffect(() => {
    refreshRubyntBalance();
  }, [refreshRubyntBalance]);

  const [showWallet, setShowWallet] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [boosterHint, setBoosterHint] = useState<string>("");

  const [endOpen, setEndOpen] = useState(false);
  const [endStars, setEndStars] = useState(0);
  const [endWon, setEndWon] = useState(false);

  const [showShards, setShowShards] = useState(false);
  const [shardsFoundLevels, setShardsFoundLevels] = useState<number[]>(() =>
    readShardsFoundFromStorage()
  );
  const shardCount = shardsFoundLevels.length;

  const [currentLevel, setCurrentLevel] = useState(() => {
    const rawCurrent = localStorage.getItem(LS_CURRENT);
    return safeStoredLevel(rawCurrent, 1);
  });

  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const rawUnlocked = localStorage.getItem(LS_UNLOCKED);
    const safeUnlocked = safeStoredLevel(rawUnlocked, 1);
    const rawCurrent = localStorage.getItem(LS_CURRENT);
    const safeCurrent = safeStoredLevel(rawCurrent, 1);

    return Math.max(safeUnlocked, safeCurrent);
  });

  const [infLifeLeftMs, setInfLifeLeftMs] = useState(() => getInfiniteLifeLeftMs());

  useEffect(() => localStorage.setItem(LS_CURRENT, String(currentLevel)), [currentLevel]);
  useEffect(() => localStorage.setItem(LS_UNLOCKED, String(unlockedLevel)), [unlockedLevel]);

  useEffect(() => {
    writeShardsFoundToStorage(shardsFoundLevels);
  }, [shardsFoundLevels]);

  const [showDaily, setShowDaily] = useState(false);

  const allowed = false;
  const [devOpen, setDevOpen] = useState(true);

  useEffect(() => {
    if (!allowed) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "L" || e.key === "l")) {
        e.preventDefault();
        setDevOpen((v) => !v);
        console.log("DEV PANEL TOGGLE");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowed]);

  useEffect(() => {
    setInfLifeLeftMs(getInfiniteLifeLeftMs());

    const id = window.setInterval(() => {
      setInfLifeLeftMs(getInfiniteLifeLeftMs());
    }, 1000);

    const onFocus = () => setInfLifeLeftMs(getInfiniteLifeLeftMs());
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    if (!boosterHint) return;
    const id = window.setTimeout(() => setBoosterHint(""), 1800);
    return () => window.clearTimeout(id);
  }, [boosterHint]);

  const openDaily = () => {
    try {
      refreshRubyntBalance();
    } catch {}
    setShowDaily(true);
  };

  const addShardFound = useCallback((level: number) => {
    const L = clampLevel(level);
    if (!SHARD_LEVELS.includes(L)) return;

    setShardsFoundLevels((prev) => {
      if (prev.includes(L)) return prev;

      const next = [...prev, L];
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

    if (lvl >= 81 && lvl <= 90) return MUSIC_BOSS_01;
    if (lvl >= 91 && lvl <= 100) return MUSIC_BOSS_02;
    if (lvl >= 101 && lvl <= 110) return MUSIC_BOSS_03;
    if (lvl >= 111 && lvl <= 120) return MUSIC_BOSS_04;
    if (lvl >= 121 && lvl <= 130) return MUSIC_BOSS_05;
    if (lvl >= 131 && lvl <= 140) return MUSIC_GAME_01;
    if (lvl >= 141 && lvl <= 150) return MUSIC_GAME_02;
    if (lvl >= 151 && lvl <= 160) return MUSIC_MENU_01;

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
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const m3 = useMatch3(screen === "game");

  const levelRules = useMemo(() => {
    const lvl = screen === "game" ? m3.level : currentLevel;
    return getLevelRules(lvl);
  }, [screen, m3.level, currentLevel]);

  const objectiveData = useMemo(() => {
    if (screen !== "game") {
      return {
        title: "",
        text: "",
        icon: "",
      };
    }

    return {
      title: getObjectiveTitle(levelRules),
      text: getObjectiveText(
        levelRules,
        {
          score: m3.score,
          chests: m3.progress?.chests ?? 0,
          cleared: m3.progress?.cleared ?? {},
        },
        m3.dragonHp
      ),
      icon: getObjectiveIcon(levelRules),
    };
  }, [screen, levelRules, m3.score, m3.progress, m3.dragonHp]);

  useEffect(() => {
    try {
      refreshRubyntBalance();
    } catch {}
  }, [screen, refreshRubyntBalance]);

  useEffect(() => {
    if (screen !== "game") {
      m3.cancelArmedBooster?.();
      setBoosterHint("");
    }
  }, [screen, m3]);

  const handleArmBooster = useCallback(
    (type: "bomb" | "striped" | "rainbow") => {
      if (screen !== "game") return;
      if (m3.isProcessing || m3.isShuffling) return;

      if (m3.armedBooster === type) {
        m3.cancelArmedBooster?.();
        setBoosterHint("Booster selection cancelled.");
        playSound("click");
        return;
      }

      if (m3.armedBooster && m3.armedBooster !== type) {
        setBoosterHint("Use or cancel the selected booster first.");
        playSound("click");
        return;
      }

      const key =
        type === "bomb"
          ? "bombs"
          : type === "striped"
            ? "stripedBombs"
            : "rainbowBombs";

      const ok = consumeInventoryItem(key, 1);
      if (!ok) {
        setBoosterHint("Not enough boosters.");
        playSound("click");
        return;
      }

      m3.armBooster?.(type);
      setBoosterHint(
        type === "bomb"
          ? "Bomb selected. Tap a gem."
          : type === "striped"
            ? "Striped booster selected. Tap a gem."
            : "Rainbow booster selected. Tap a gem."
      );
      playSound("click");
    },
    [screen, m3, consumeInventoryItem]
  );

  const handleUseExtraMoves = useCallback(() => {
    if (screen !== "game") return;
    if (m3.isProcessing || m3.isShuffling) return;

    const ok = consumeInventoryItem("extraMoves", 1);
    if (!ok) {
      setBoosterHint("No +5 moves booster available.");
      playSound("click");
      return;
    }

    m3.addBonusMoves?.(5);
    setBoosterHint("+5 moves used.");
    playSound("click");
  }, [screen, m3, consumeInventoryItem]);

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

    const horizontalSpace = vw - 32;
    const topHudReserve = screen === "game" ? 340 : 160;
    const bottomReserve = screen === "game" ? 185 : 100;
    const verticalSpace = Math.max(260, vh - topHudReserve - bottomReserve);

    const usable = Math.min(horizontalSpace, verticalSpace);

    return Math.max(34, Math.min(60, Math.floor(usable / bs)));
  }, [vw, vh, m3.boardSize, screen]);

  const desiredBg = useMemo(() => {
    const fallback = GAME_ASSETS.menuBackground;

    if (screen === "menu") return GAME_ASSETS.menuBackground;
    if (screen === "map") {
      return pickBgByBlock(GAME_ASSETS.mapBackgrounds, currentLevel, 20, fallback);
    }
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

  useEffect(() => {
    let track: string | null;
    if (screen === "menu" || screen === "map") track = MUSIC_MENU;
    else track = pickGameMusicByLevel(m3.level);

    try {
      if (track) playMusic(track);
    } catch {}
  }, [screen, m3.level]);

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

      for (let i = 0; i < delta; i++) {
        const chestIndex = prev + i + 1;
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

  const reportedPassRef = useRef<number>(0);
  useEffect(() => {
    if (screen !== "game") return;
    if (!m3.passed) return;
    if (reportedPassRef.current === m3.level) return;

    reportedPassRef.current = m3.level;

    const next = clampLevel(m3.level + 1);
    setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));

    const userKey = getUserKeyFromStorage();

    const base = Math.max(1, Math.min(3, starsNow));
    rewardLevelOnce(userKey, m3.level, base, "level_clear");

    if (isShardLevel(m3.level)) {
      const idx = shardIndexForLevel(m3.level);
      const shardBonus = idx >= 0 ? shardValueByIndex(idx) : 10;

      rewardLevelOnce(userKey, m3.level + 1000000, shardBonus, "shard_bonus");
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
  }, [screen, m3.passed, starsNow, m3.level, m3.score, completeLevel, refreshRubyntBalance, addShardFound]);

  const endShownForRef = useRef<string>("");
  useEffect(() => {
    if (screen !== "game") return;

    const dragonWon = levelRules.challenge?.type === "dragon" && m3.passed;
    const timedOut = m3.mode === "timed" && m3.timeLeftSec <= 0;
    const noMoves = m3.mode === "moves" && m3.moves <= 0;

    if (!dragonWon && !timedOut && !noMoves) return;

    const key = `${m3.level}:${dragonWon ? "w" : timedOut ? "t" : "m"}`;
    if (endShownForRef.current === key) return;
    endShownForRef.current = key;

    const passed = dragonWon ? true : m3.passed;
    setEndWon(passed);
    setEndStars(starsNow);
    setEndOpen(true);
  }, [screen, levelRules.challenge, m3.level, m3.mode, m3.timeLeftSec, m3.moves, m3.passed, starsNow]);

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

  const endActionLockRef = useRef(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-gothic animate-pulse">
        Summoning the Vault...
      </div>
    );
  }

  const story = getStoryForLevel(m3.level);

  const inventory = progress?.inventory ?? {
    bombs: 0,
    wizards: 0,
    stripedBombs: 0,
    rainbowBombs: 0,
    extraMoves: 0,
  };

  return (
    <div className="min-h-screen w-full bg-[#1a0505] text-white overflow-hidden font-sans relative">
      {screen !== "map" && (
        <>
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
        </>
      )}

      <div
        className={`relative z-10 min-h-[100svh] w-full flex flex-col items-center ${
          screen === "map"
            ? "justify-start pt-0 md:pt-0"
            : "justify-center pt-32 md:pt-36"
        }`}
      >
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
            {story && (
              <StorySidePanels
                leftText={story.left}
                rightText={story.right}
                showKnights={true}
              />
            )}

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
              className={`relative rounded-3xl bg-black/20 backdrop-blur-sm border border-white/10 mt-4 sm:mt-0 overflow-hidden ${
                m3.scorePops?.some((pop) => pop.value >= 140) ? "br-board-shake" : ""
              }`}
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

              {m3.scorePops?.map((pop) => {
                const bigHit = pop.value >= 90;
                const hugeHit = pop.value >= 140;

                return (
                  <div
                    key={pop.id}
                    className="pointer-events-none absolute left-0 top-0 z-30"
                    style={{
                      transform: `translate(${pop.x * tileSize + tileSize / 2}px, ${pop.y * tileSize + tileSize / 2}px)`,
                    }}
                  >
                    {(bigHit || hugeHit) && (
                      <>
                        <div
                          className="br-blast-ring"
                          style={{
                            left: 0,
                            top: 0,
                            width: hugeHit ? 118 : 92,
                            height: hugeHit ? 118 : 92,
                          }}
                        />
                        <div
                          className="br-blast-core"
                          style={{
                            left: 0,
                            top: 0,
                            width: hugeHit ? 56 : 46,
                            height: hugeHit ? 56 : 46,
                          }}
                        />
                      </>
                    )}

                    <div
                      className={`animate-[scorePop_850ms_ease-out_forwards] -translate-x-1/2 -translate-y-1/2 select-none ${
                        hugeHit ? "scale-125" : bigHit ? "scale-110" : ""
                      }`}
                      style={{
                        textShadow:
                          hugeHit
                            ? "0 0 12px rgba(255,255,255,0.45), 0 0 26px rgba(255,80,80,0.38)"
                            : "0 0 10px rgba(255,255,255,0.35), 0 0 18px rgba(255,80,80,0.28)",
                      }}
                    >
                      <div
                        className={`px-2 py-0.5 rounded-full border backdrop-blur-[2px] ${
                          hugeHit
                            ? "bg-red-950/50 border-red-200/35"
                            : bigHit
                              ? "bg-red-950/40 border-red-300/25"
                              : "bg-black/35 border-red-300/20"
                        }`}
                      >
                        <span
                          className={`font-black tracking-wide ${
                            hugeHit
                              ? "text-sm sm:text-base text-white"
                              : "text-[12px] sm:text-sm text-red-100"
                          }`}
                        >
                          +{pop.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {m3.scorePops?.some((pop) => pop.value >= 140) && (
                <div className="br-board-pulse z-20" />
              )}
            </div>

            <div className="mt-3 w-full max-w-[min(92vw,560px)] px-2">
              <div className="rounded-2xl bg-black/45 border border-white/10 backdrop-blur-sm px-3 py-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleArmBooster("bomb")}
                      disabled={(inventory.bombs ?? 0) <= 0}
                      className={`px-3 py-1 rounded-xl border text-xs transition ${
                        m3.armedBooster === "bomb"
                          ? "bg-red-800/70 border-red-400/40 text-white"
                          : "bg-white/5 border-white/10 text-white"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      💣 <span className="text-white/65">Bomb</span>{" "}
                      <span className="font-semibold tabular-nums">{inventory.bombs ?? 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArmBooster("striped")}
                      disabled={(inventory.stripedBombs ?? 0) <= 0}
                      className={`px-3 py-1 rounded-xl border text-xs transition ${
                        m3.armedBooster === "striped"
                          ? "bg-red-800/70 border-red-400/40 text-white"
                          : "bg-white/5 border-white/10 text-white"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      ⚡ <span className="text-white/65">Striped</span>{" "}
                      <span className="font-semibold tabular-nums">
                        {inventory.stripedBombs ?? 0}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArmBooster("rainbow")}
                      disabled={(inventory.rainbowBombs ?? 0) <= 0}
                      className={`px-3 py-1 rounded-xl border text-xs transition ${
                        m3.armedBooster === "rainbow"
                          ? "bg-red-800/70 border-red-400/40 text-white"
                          : "bg-white/5 border-white/10 text-white"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      🌈 <span className="text-white/65">Rainbow</span>{" "}
                      <span className="font-semibold tabular-nums">
                        {inventory.rainbowBombs ?? 0}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseExtraMoves}
                      disabled={(inventory.extraMoves ?? 0) <= 0}
                      className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +5 <span className="text-white/65">Moves</span>{" "}
                      <span className="font-semibold tabular-nums">
                        {inventory.extraMoves ?? 0}
                      </span>
                    </button>
                  </div>

                  {infLifeLeftMs > 0 && (
                    <div className="px-3 py-1 rounded-xl bg-red-900/35 border border-red-400/20 text-xs">
                      ❤️ <span className="text-red-100/85">Infinite Life</span>{" "}
                      <span className="font-semibold tabular-nums">
                        {formatDurationShort(infLifeLeftMs)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-white/40 min-h-[14px]">
                  {boosterHint
                    ? boosterHint
                    : m3.armedBooster
                      ? "Tap a gem on the board to use the selected booster."
                      : "Boosters are ready. Bomb / Striped / Rainbow select a target, +5 moves applies instantly."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound("click");
                setScreen("map");
              }}
              className="px-6 py-2 bg-red-900/50 hover:bg-red-800 rounded-full text-sm font-gothic mt-4 mb-8"
            >
              {lang === "hu" ? "Vissza a térképre" : "Back to map"}
            </button>
          </>
        )}
      </div>

      <TopBar
        key={`topbar-${screen}-${screen === "game" ? m3.level : currentLevel}`}
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
        onOpenDaily={() => {
          playSound("click");
          openDaily();
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
        objectiveTitle={screen === "game" ? objectiveData.title : ""}
        objectiveText={screen === "game" ? objectiveData.text : ""}
        objectiveIcon={screen === "game" ? objectiveData.icon : ""}
        dragonHp={screen === "game" ? m3.dragonHp ?? 0 : 0}
        dragonMaxHp={
          screen === "game" && levelRules.challenge?.type === "dragon"
            ? levelRules.challenge.hp
            : 0
        }
        dragonJustHit={screen === "game" ? Boolean((m3 as any).dragonJustHit) : false}
        dragonDefeated={
          screen === "game" &&
          levelRules.challenge?.type === "dragon" &&
          (m3.dragonHp ?? 0) <= 0
        }
      />

      {allowed && (
        <div className="fixed bottom-2 right-2 z-[999999] bg-red-600 text-white px-2 py-1 rounded text-xs pointer-events-none">
          DEVTOOLS
        </div>
      )}

      {endOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#140404] border border-red-900/40 p-5 text-center br-win-modal">
            <h2 className="text-2xl font-gothic mb-2">
              {endWon
                ? levelRules.challenge?.type === "dragon"
                  ? lang === "hu"
                    ? "A sárkány legyőzve!"
                    : "Dragon Defeated!"
                  : lang === "hu"
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
                  {levelRules.challenge?.type === "dragon" ? (
                    <>
                      Boss reward:{" "}
                      <span className="text-red-200 font-bold">
                        Dragon cleared
                      </span>
                    </>
                  ) : (
                    <>
                      Reward: <span className="text-red-200 font-bold">+{endStars}</span> Vault Stars
                    </>
                  )}
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
      {showShards && <ShardModal onClose={() => setShowShards(false)} />}

      {showDaily && (
        <DailyChestModal
          userKey={getUserKeyFromStorage() || ""}
          onClose={() => setShowDaily(false)}
          onClaim={(reward) => {
            try {
              if (reward.type === "br") {
                addRubynts(reward.amount);
                try {
                  refreshRubyntBalance();
                } catch {}
              } else if (reward.type === "bomb") {
                addInventoryItem("bombs", reward.amount);
              } else if (reward.type === "moves") {
                addInventoryItem("extraMoves", reward.amount);
              }
            } catch (e) {
              console.warn("Daily reward apply failed", e);
            }
            setShowDaily(false);
          }}
        />
      )}

      {allowed && devOpen && (
        <div className="fixed bottom-14 right-2 z-[999999] pointer-events-auto">
          <div className="bg-black/80 border border-red-500/40 rounded-xl p-2 pointer-events-auto">
            <DevPanel
              currentLevel={currentLevel}
              unlockedLevel={unlockedLevel}
              setCurrentLevel={(n) => setCurrentLevel(n)}
              setUnlockedLevel={(n) => setUnlockedLevel(n)}
              onStartLevel={(n) => {
                try {
                  const lvl = clampLevel(n);

                  setCurrentLevel(lvl);
                  setUnlockedLevel((u: number) => Math.max(clampLevel(u), lvl));

                  reportedPassRef.current = 0;
                  endShownForRef.current = "";
                  endActionLockRef.current = false;

                  lastStartedRef.current = 0;
                  setScreen("game");
                } catch {}
              }}
            />
          </div>
        </div>
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