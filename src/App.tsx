// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { t } from "./i8n/i18n";

import { playSound, unlockAudio, playMusic } from "./utils/audioManager";
import { useMatch3 } from "./components/game/useMatch3";
import { GemComponent } from "./components/game/GemComponent";
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

import { isTrial } from "./app/mode";
import { TopLeftLinks } from "./ui/TopLeftLinks";
import { InfoModal } from "./ui/InfoModal";
import { InfoButton } from "./ui/InfoButton";

const LS_CURRENT = "br_currentLevel";
const LS_UNLOCKED = "br_unlockedLevel";

const TOTAL_LEVELS = 200; // ✅ teszthez

const MUSIC_MENU = assetUrl("assets/audio/music/music_menu.mp3");
const MUSIC_BOSS_01 = assetUrl("assets/audio/music/music_boss_01.mp3");
const MUSIC_BOSS_02 = assetUrl("assets/audio/music/music_boss_02.mp3");
const MUSIC_BOSS_03 = assetUrl("assets/audio/music/music_boss_03.mp3");
const MUSIC_BOSS_04 = assetUrl("assets/audio/music/music_boss_04.mp3");
const MUSIC_BOSS_05 = assetUrl("assets/audio/music/music_boss.mp3");

const MUSIC_GAME_01 = assetUrl("assets/audio/music/music_game_01.mp3");
const MUSIC_GAME_02 = assetUrl("assets/audio/music/music_game.mp3");
const MUSIC_MENU_71 = assetUrl("assets/audio/music/music_menu_01.mp3");

function clampLevel(n: number) {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function pickBgByBlock(list: readonly string[], levelLike: number, blockSize: number, fallback: string) {
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

const MainGame = () => {
  const [trialMsg, setTrialMsg] = useState<string | null>(null);

  const {
    gems,
    score,
    targetScore,
    moves,
    level,
    selectedGem,
    selectGem,
    startNewGame,
    shuffleBoard,
    shuffleUses,
    mode,
    timeLeftSec,
    timeLimitSec,
    activeGemCount,
    boardSize,
    scorePops,
    flashIds,
  } = useMatch3() as any;

  const { progress, completeLevel, isLoading, lives, maxLives, spendLife } = useGame() as any;

  type AppScreen = "menu" | "map" | "game";
  const [screen, setScreen] = useState<AppScreen>("menu");

  const [showWallet, setShowWallet] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const [endOpen, setEndOpen] = useState(false);
  const [endStars, setEndStars] = useState(0);
  const [endWon, setEndWon] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(() => {
    const raw = localStorage.getItem(LS_CURRENT);
    return clampLevel(Number(raw ?? 1));
  });

  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const raw = localStorage.getItem(LS_UNLOCKED);
    return clampLevel(Number(raw ?? 1));
  });

  // ✅ csak egyszer reportoljuk a PASS-t egy adott szinten
  const [reportedPassLevel, setReportedPassLevel] = useState<number>(0);

  useEffect(() => localStorage.setItem(LS_CURRENT, String(currentLevel)), [currentLevel]);
  useEffect(() => localStorage.setItem(LS_UNLOCKED, String(unlockedLevel)), [unlockedLevel]);

  function pickGameMusicByLevel(lvlLike: number): string | null {
    const lvl = clampLevel(lvlLike);

    if (lvl >= 1 && lvl <= 10) return MUSIC_BOSS_01;
    if (lvl >= 11 && lvl <= 20) return MUSIC_BOSS_02;
    if (lvl >= 21 && lvl <= 30) return MUSIC_BOSS_03;
    if (lvl >= 31 && lvl <= 40) return MUSIC_BOSS_04;
    if (lvl >= 41 && lvl <= 50) return MUSIC_BOSS_05;
    if (lvl >= 51 && lvl <= 60) return MUSIC_GAME_01;
    if (lvl >= 61 && lvl <= 70) return MUSIC_GAME_02;
    if (lvl >= 71 && lvl <= 80) return MUSIC_MENU_71;
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
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", "jewel_vault_loaded");
    }
  }, []);

  useEffect(() => {
    if (!trialMsg) return;
    const id = window.setTimeout(() => setTrialMsg(null), 2500);
    return () => window.clearTimeout(id);
  }, [trialMsg]);

  // ✅ Story popup 20-as blokkonként
  useEffect(() => {
    if (screen !== "game") return;
    if ((level - 1) % 20 === 0) {
      const s = getStoryForLevel(level);
      if (s) setStoryOpen(true);
    }
  }, [screen, level]);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (screen !== "game" && endOpen) setEndOpen(false);
  }, [screen, endOpen]);

  useEffect(() => {
    let track: string | null;
    if (screen === "menu" || screen === "map") track = MUSIC_MENU;
    else track = pickGameMusicByLevel(level);

    try {
      if (track) playMusic(track);
    } catch {}
  }, [screen, level]);

  // ✅ csillag állapot (élőben)
  const starsNow = useMemo(() => {
    if (screen !== "game") return 0;
    return calcStars(score, targetScore);
  }, [screen, score, targetScore]);

  const passedNow = screen === "game" && starsNow >= 1;
  const canGoNextNow = screen === "game" && starsNow >= 3;

  // ✅ 1★-nál azonnali PASS (unlock + completeLevel), de a játék mehet tovább
  useEffect(() => {
    if (screen !== "game") return;
    if (!passedNow) return;
    if (reportedPassLevel === level) return;

    setReportedPassLevel(level);

    // unlock next level
    const next = clampLevel(level + 1);
    setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));

    // game state / shard log
    try {
      completeLevel?.(level, score, starsNow);
      if (isShardLevel(level)) markShardFound(level);
    } catch {}
  }, [screen, passedNow, reportedPassLevel, level, completeLevel, score, starsNow]);

  // ✅ END MODAL (csak akkor, ha elfogy a lépés / lejár az idő)
  useEffect(() => {
    if (screen !== "game") return;
    if (endOpen) return;

    const timedOut = mode === "timed" && timeLeftSec <= 0;
    const noMoves = moves === 0;

    if (!timedOut && !noMoves) return;

    // itt is a live stars szerint döntünk
    const passed = starsNow >= 1;

    setEndWon(passed);
    setEndStars(starsNow);
    setEndOpen(true);

    playSound("click");

    // completeLevel PASS-ot már 1★-nál elintéztük, itt nem kell még egyszer
  }, [screen, endOpen, mode, timeLeftSec, moves, starsNow]);

  const tileSize = useMemo(() => {
    const bs = boardSize || 8;
    return Math.max(40, Math.min(64, Math.floor(Math.min(vw - 32, vh * 0.62) / bs)));
  }, [vw, vh, boardSize]);

  const boardPx = tileSize * (boardSize || 8);

  // ✅ háttér: map 20-as blokkonként, game 20-as blokkonként
  const desiredBg = useMemo(() => {
    const fallback = GAME_ASSETS.menuBackground;

    if (screen === "menu") return GAME_ASSETS.menuBackground;
    if (screen === "map") return pickBgByBlock(GAME_ASSETS.mapBackgrounds, currentLevel, 20, fallback);
    return pickBgByBlock(GAME_ASSETS.storyBackgrounds, level, 20, fallback);
  }, [screen, currentLevel, level]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-gothic animate-pulse">
        Summoning the Vault...
      </div>
    );
  }

  const story = getStoryForLevel(level);

  // ✅ TopBar-hoz UI értékek: menu/map alatt ne a game state menjen
  const uiLevel = screen === "game" ? level : currentLevel;
  const uiScore = screen === "game" ? score : 0;
  const uiTarget = screen === "game" ? targetScore : 0;
  const uiMoves = screen === "game" ? moves : 0;
  const uiMode = screen === "game" ? mode : "moves";
  const uiTimeLeft = screen === "game" ? timeLeftSec : 0;
  const uiTimeLimit = screen === "game" ? timeLimitSec : 0;
  const uiActiveGemCount = screen === "game" ? activeGemCount : undefined;

  return (
    <div className="min-h-screen w-full bg-[#1a0505] text-white overflow-hidden font-sans relative">
      {isTrial && (
        <div className="hidden md:block">
          <TopLeftLinks />
        </div>
      )}

      {trialMsg && (
        <div className="fixed left-1/2 top-40 z-[9999] -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          {trialMsg}
        </div>
      )}

      {isTrial && (
        <div className="fixed left-4 bottom-16 z-[9997] text-white/30 text-xs font-mono tracking-widest pointer-events-none">
          TRIAL BUILD
        </div>
      )}

      {/* ✅ FULLSCREEN háttér */}
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

      {/* ✅ TARTALOM */}
      <div className="relative z-10 min-h-[100svh] w-full flex flex-col items-center justify-center pt-16 md:pt-24">
        {screen === "game" && story && (
          <StorySidePanels leftText={story.left} rightText={story.right} showKnights showDragons={level >= 50} />
        )}

        {screen === "menu" && (
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500 pt-16 md:pt-24">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-300 to-red-600 font-gothic tracking-wider uppercase">
                {t("menu.title")}
              </h1>
              <p className="text-red-200/60 text-sm mt-2 tracking-[0.3em] uppercase font-gothic">Bloody Rubynts Saga</p>
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

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  playSound("click");
                  if (isTrial) {
                    setTrialMsg("Trial: Shop coming soon.");
                    return;
                  }
                  setShowShop(true);
                }}
                className="p-4 bg-black/40 backdrop-blur rounded-full border border-red-900/30 hover:bg-red-900/20 transition-colors"
                aria-label="Shop"
              >
                {t("menu.shop")}
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound("click");
                  if (isTrial) {
                    setTrialMsg("Trial: Wallet coming soon.");
                    return;
                  }
                  setShowWallet(true);
                }}
                className="p-4 bg-black/40 backdrop-blur rounded-full border border-red-900/30 hover:bg-red-900/20 transition-colors"
                aria-label="Wallet"
              >
                {t("menu.wallet")}
              </button>
            </div>
          </div>
        )}

        {screen === "map" && (
          <LevelMap
            totalLevels={TOTAL_LEVELS}
            currentLevel={currentLevel}
            unlockedLevel={unlockedLevel}
            onSelectLevel={(l: number) => {
              const L = typeof lives === "number" ? lives : 3;

              if (L <= 0) {
                playSound("click");
                if (isTrial) setTrialMsg("Trial: Shop coming soon.");
                else setShowShop(true);
                return;
              }

              playSound("click");
              setEndOpen(false);
              setEndWon(false);
              setEndStars(0);

              const picked = clampLevel(l);
              setCurrentLevel(picked);
              startNewGame(picked);
              setScreen("game");
            }}
          />
        )}

        {screen === "game" && (
          <div className="flex flex-col items-center gap-4 w-full pt-20 md:pt-24">
            <div className="relative mt-2" style={{ width: boardPx, height: boardPx }}>
              {gems.map((gem: any) => (
                <GemComponent
                  key={gem.id}
                  gem={gem}
                  isSelected={selectedGem?.id === gem.id}
                  isFlashing={Array.isArray(flashIds) ? flashIds.includes(gem.id) : false}
                  size={tileSize}
                  onClick={() => selectGem(gem)}
                  level={level}
                />
              ))}

              {Array.isArray(scorePops) &&
                scorePops.map((p: any) => (
                  <div
                    key={p.id}
                    className="br-score-pop"
                    style={{
                      left: (p.x + 0.5) * tileSize,
                      top: (p.y + 0.55) * tileSize,
                    }}
                  >
                    +{p.value}
                  </div>
                ))}
            </div>

            {/* ✅ 3★ esetén azonnali továbblépés (nem kell 0 move-ig várni) */}
            {canGoNextNow && (
              <button
                type="button"
                onClick={() => {
                  playSound("click");
                  setEndOpen(false);

                  const next = clampLevel(level + 1);
                  setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));
                  setCurrentLevel(next);
                  startNewGame(next);
                  setScreen("game");
                }}
                className="px-8 py-3 bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 text-base font-gothic border border-red-500/30"
              >
                Következő pálya (3★)
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                playSound("click");
                setScreen("map");
              }}
              className="px-6 py-2 bg-red-900/50 hover:bg-red-800 rounded-full text-sm font-gothic mb-8"
            >
              Vissza a térképhez
            </button>
          </div>
        )}
      </div>

      {isTrial && <InfoButton onClick={() => setInfoOpen(true)} />}
      {isTrial && <InfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />}

      {/* ✅ TOPBAR: mindig fent, de értelmes értékekkel */}
      <TopBar
        onBack={
          screen === "game"
            ? () => {
                playSound("click");
                setScreen("map");
              }
            : screen === "map"
              ? () => {
                  playSound("click");
                  setScreen("menu");
                }
              : undefined
        }
        onHome={() => {
          playSound("click");
          setScreen("menu");
        }}
        rubyntBalance={progress?.rubyntBalance ?? 0}
        onOpenWallet={() => {
          playSound("click");
          if (isTrial) {
            setTrialMsg("Trial: Wallet coming soon.");
            return;
          }
          setShowWallet(true);
        }}
        score={uiScore}
        targetScore={uiTarget}
        moves={uiMoves}
        level={uiLevel}
        lives={typeof lives === "number" ? lives : 3}
        maxLives={typeof maxLives === "number" ? maxLives : 3}
        onShuffle={
          screen === "game"
            ? () => {
                playSound("click");
                shuffleBoard();
              }
            : undefined
        }
        shuffleUses={screen === "game" ? shuffleUses : 0}
        mode={uiMode as any}
        timeLeftSec={uiTimeLeft}
        timeLimitSec={uiTimeLimit}
        activeGemCount={uiActiveGemCount}
      />

      {endOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#140404] border border-red-900/40 p-5 text-center">
            <h2 className="text-2xl font-gothic mb-2">
              {endWon ? "Gratulálunk!" : mode === "timed" ? "Lejárt az idő!" : "Elfogytak a lépések!"}
            </h2>

            {endWon && (
              <div className="text-xl mb-3">
                {"★".repeat(endStars)}
                {"☆".repeat(3 - endStars)}
              </div>
            )}

            <p className="text-white/70 mb-4">
              Pontszám: <span className="font-mono font-bold">{score}</span>
            </p>

            <div className="flex gap-3 justify-center">
              <button
                className="px-4 py-2 rounded-full bg-black/40 border border-red-900/40"
                onClick={() => {
                  playSound("click");
                  setEndOpen(false);
                  setScreen("map");
                }}
                type="button"
              >
                Térkép
              </button>

              <button
                className="px-4 py-2 rounded-full bg-red-900/60 hover:bg-red-800"
                onClick={() => {
                  playSound("click");
                  setEndOpen(false);

                  if (endWon) {
                    const next = clampLevel(level + 1);
                    setUnlockedLevel((u: number) => Math.max(clampLevel(u), next));
                    setCurrentLevel(next);
                    startNewGame(next);
                    setScreen("game");
                  } else {
                    const L = typeof lives === "number" ? lives : 3;
                    if (L <= 0) {
                      setScreen("map");
                      return;
                    }
                    try {
                      spendLife?.();
                    } catch {}
                    startNewGame(level);
                    setScreen("game");
                  }
                }}
                type="button"
              >
                {endWon ? "Következő pálya" : "Újra"}
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
          showDragons={level >= 50}
        />
      )}

      {showWallet && !isTrial && <WalletModal onClose={() => setShowWallet(false)} />}
      {showShop && !isTrial && <ShopModal onClose={() => setShowShop(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainGame />
    </GameProvider>
  );
}