import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getUserKeyFromStorage, getBrBalance, addBr } from "../../app/rewards/brRewards";
import { DailyChestModal, type DailyReward } from "../daily/DailyChestModal";

type InventoryKey =
  | "bombs"
  | "wizards"
  | "stripedBombs"
  | "rainbowBombs"
  | "extraMoves";

type Progress = {
  rubyntBalance: number;
  inventory: {
    bombs: number;
    wizards: number;
    stripedBombs: number;
    rainbowBombs: number;
    extraMoves: number;
  };
};

type GameCtx = {
  progress: Progress;
  isLoading: boolean;

  lives: number;
  maxLives: number;
  spendLife: () => void;
  resetLives: () => void;

  addLives: (n: number) => void;
  setLivesToMax: () => void;
  addInventoryItem: (key: InventoryKey, n: number) => void;
  consumeInventoryItem: (key: InventoryKey, n?: number) => boolean;

  refreshRubyntBalance: () => void;
  addRubynts: (amount: number) => void;

  walletAddress: string | null;
  walletChainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  isWalletOpen: boolean;
  openWallet: () => void;
  closeWallet: () => void;

  isDailyOpen: boolean;
  openDaily: () => void;
  closeDaily: () => void;

  completeLevel: (level: number, score: number, stars: number) => void;
};

const Ctx = createContext<GameCtx | null>(null);

function getInjectedProvider(): any | null {
  try {
    return (window as any).ethereum || null;
  } catch {
    return null;
  }
}

async function connectInjectedWallet(): Promise<{ address: string; chainId: number | null }> {
  const eth = getInjectedProvider();
  if (!eth) throw new Error("No wallet found. Please install MetaMask.");

  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  const address = accounts?.[0];
  if (!address) throw new Error("No account returned by wallet.");

  let chainIdNum: number | null = null;
  try {
    const cidHex: string = await eth.request({ method: "eth_chainId" });
    if (typeof cidHex === "string") chainIdNum = parseInt(cidHex, 16);
  } catch {}

  return { address, chainId: chainIdNum };
}

function storageKeysForUser(userKey: string) {
  return {
    addr: `br_wallet_address_${userKey}`,
    chain: `br_wallet_chain_${userKey}`,
  };
}

const LS_LIVES_PREFIX = "br_lives_v1:";
const LS_LIVES_TS_PREFIX = "br_lives_ts_v1:";
const LIFE_REGEN_MS = 30 * 60 * 1000;

function livesKey(userKey: string) {
  return `${LS_LIVES_PREFIX}${userKey}`;
}
function livesTsKey(userKey: string) {
  return `${LS_LIVES_TS_PREFIX}${userKey}`;
}

function clampLives(n: number, maxLives: number) {
  return Math.max(0, Math.min(maxLives, Math.floor(n)));
}

const LS_INF_LIFE_UNTIL = "br_infinite_life_until_v1";
function getInfiniteLifeUntil(): number {
  try {
    const raw = localStorage.getItem(LS_INF_LIFE_UNTIL);
    const n = Number(raw || 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function hasInfiniteLifeActive(): boolean {
  return getInfiniteLifeUntil() > Date.now();
}

const LS_DAILY_LAST_PREFIX = "br_daily_last_claim_v2:";
function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function todayKeyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function hasClaimedDaily(userKey: string): boolean {
  try {
    const last = localStorage.getItem(`${LS_DAILY_LAST_PREFIX}${userKey || "guest"}`);
    return last === todayKeyLocal();
  } catch {
    return false;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const maxLives = 3;

  const [userKey, setUserKey] = useState(() => getUserKeyFromStorage());

  const [lives, setLives] = useState(() => {
    try {
      const u = getUserKeyFromStorage();

      if (!u || u === "guest") return maxLives;

      const raw = localStorage.getItem(livesKey(u));

      if (raw === null) {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
        return maxLives;
      }

      const n = Number(raw);
      if (!Number.isFinite(n)) return maxLives;

      const loaded = clampLives(n, maxLives);

      const tsRaw = localStorage.getItem(livesTsKey(u));
      const ts = Number(tsRaw);
      if (!Number.isFinite(ts) || ts <= 0) {
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      }

      return loaded;
    } catch {
      return maxLives;
    }
  });

  const [progress, setProgress] = useState<Progress>({
    rubyntBalance: 0,
    inventory: {
      bombs: 3,
      wizards: 3,
      stripedBombs: 0,
      rainbowBombs: 0,
      extraMoves: 0,
    },
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  const [isWalletOpen, setWalletOpen] = useState(false);
  const openWallet = useCallback(() => setWalletOpen(true), []);
  const closeWallet = useCallback(() => setWalletOpen(false), []);

  const [isDailyOpen, setDailyOpen] = useState(false);
  const openDaily = useCallback(() => setDailyOpen(true), []);
  const closeDaily = useCallback(() => setDailyOpen(false), []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = getUserKeyFromStorage();
      setUserKey((prev) => (prev === next ? prev : next));
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const u = userKey;

    if (!u || u === "guest") {
      try {
        localStorage.removeItem(livesKey("guest"));
        localStorage.removeItem(livesTsKey("guest"));
      } catch {}
      setLives(maxLives);
      return;
    }

    try {
      const raw = localStorage.getItem(livesKey(u));

      if (raw === null) {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
        setLives(maxLives);
        return;
      }

      const n = Number(raw);
      const loaded = Number.isFinite(n) ? clampLives(n, maxLives) : maxLives;
      setLives(loaded);

      const tsRaw = localStorage.getItem(livesTsKey(u));
      const ts = Number(tsRaw);
      if (!Number.isFinite(ts) || ts <= 0) {
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      }
    } catch {
      setLives(maxLives);
    }
  }, [userKey]);

  const tickLives = useCallback(() => {
    const u = userKey;
    if (!u || u === "guest") return;

    if (hasInfiniteLifeActive()) {
      if (lives !== maxLives) setLives(maxLives);
      try {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      } catch {}
      return;
    }

    try {
      const now = Date.now();

      const raw = localStorage.getItem(livesKey(u));

      if (raw === null) {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(now));
        setLives(maxLives);
        return;
      }

      let current = Number(raw);
      if (!Number.isFinite(current)) current = maxLives;
      current = clampLives(current, maxLives);

      const tsRaw = localStorage.getItem(livesTsKey(u));
      let lastTs = Number(tsRaw);
      if (!Number.isFinite(lastTs) || lastTs <= 0) {
        lastTs = now;
        localStorage.setItem(livesTsKey(u), String(lastTs));
      }

      if (current >= maxLives) {
        localStorage.setItem(livesTsKey(u), String(now));
        if (lives !== maxLives) setLives(maxLives);
        return;
      }

      const elapsed = now - lastTs;
      if (elapsed < LIFE_REGEN_MS) return;

      const add = Math.floor(elapsed / LIFE_REGEN_MS);
      if (add <= 0) return;

      const next = Math.min(maxLives, current + add);
      const newTs = lastTs + add * LIFE_REGEN_MS;

      localStorage.setItem(livesKey(u), String(next));
      localStorage.setItem(livesTsKey(u), String(newTs));
      setLives(next);
    } catch {}
  }, [userKey, lives]);

  useEffect(() => {
    tickLives();
    const id = window.setInterval(() => tickLives(), 10_000);

    const onFocus = () => tickLives();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [tickLives]);

  const spendLife = useCallback(() => {
    const u = userKey;

    if (hasInfiniteLifeActive()) {
      try {
        if (u && u !== "guest") {
          localStorage.setItem(livesKey(u), String(maxLives));
          localStorage.setItem(livesTsKey(u), String(Date.now()));
        }
      } catch {}
      setLives(maxLives);
      return;
    }

    setLives((v) => {
      const next = Math.max(0, v - 1);

      try {
        if (u && u !== "guest") {
          localStorage.setItem(livesKey(u), String(next));

          if (next < maxLives) {
            localStorage.setItem(livesTsKey(u), String(Date.now()));
          }
        }
      } catch {}

      return next;
    });
  }, [userKey]);

  const resetLives = useCallback(() => {
    const u = userKey;
    setLives(maxLives);
    try {
      if (u && u !== "guest") {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      }
    } catch {}
  }, [userKey]);

  const addLives = useCallback(
    (n: number) => {
      const a = Math.max(0, Math.floor(Number(n) || 0));
      if (a <= 0) return;

      const u = userKey;

      setLives((v) => {
        const next = Math.min(maxLives, v + a);
        try {
          if (u && u !== "guest") {
            localStorage.setItem(livesKey(u), String(next));
            if (next >= maxLives) localStorage.setItem(livesTsKey(u), String(Date.now()));
          }
        } catch {}
        return next;
      });
    },
    [userKey]
  );

  const setLivesToMax = useCallback(() => {
    const u = userKey;
    setLives(maxLives);
    try {
      if (u && u !== "guest") {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      }
    } catch {}
  }, [userKey]);

  const addInventoryItem = useCallback((key: InventoryKey, n: number) => {
    const a = Math.max(0, Math.floor(Number(n) || 0));
    if (a <= 0) return;

    setProgress((p) => ({
      ...p,
      inventory: {
        ...p.inventory,
        [key]: ((p.inventory as any)[key] ?? 0) + a,
      },
    }));
  }, []);

  const consumeInventoryItem = useCallback((key: InventoryKey, n: number = 1) => {
    const need = Math.max(1, Math.floor(Number(n) || 1));
    let ok = false;

    setProgress((p) => {
      const current = Math.max(0, Math.floor(Number((p.inventory as any)[key] ?? 0)));
      if (current < need) {
        ok = false;
        return p;
      }

      ok = true;
      return {
        ...p,
        inventory: {
          ...p.inventory,
          [key]: current - need,
        },
      };
    });

    return ok;
  }, []);

  const refreshRubyntBalance = useCallback(() => {
    const u = getUserKeyFromStorage();
    const bal = getBrBalance(u);
    setProgress((p) => (p.rubyntBalance === bal ? p : { ...p, rubyntBalance: bal }));
  }, []);

  const addRubynts = useCallback((amount: number) => {
    const u = getUserKeyFromStorage();
    const next = addBr(u, amount);
    setProgress((p) => ({ ...p, rubyntBalance: next }));
  }, []);

  const loadWalletFromStorage = useCallback(() => {
    const u = getUserKeyFromStorage();
    const { addr, chain } = storageKeysForUser(u);

    try {
      const savedAddr = localStorage.getItem(addr);
      const savedChain = localStorage.getItem(chain);

      setWalletAddress(savedAddr || null);

      if (savedChain) {
        const n = parseInt(savedChain, 10);
        setWalletChainId(Number.isFinite(n) ? n : null);
      } else {
        setWalletChainId(null);
      }
    } catch {
      setWalletAddress(null);
      setWalletChainId(null);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const { address, chainId } = await connectInjectedWallet();

    const u = getUserKeyFromStorage();
    const { addr, chain } = storageKeysForUser(u);

    try {
      localStorage.setItem(addr, address);
      if (typeof chainId === "number") localStorage.setItem(chain, String(chainId));
      else localStorage.removeItem(chain);
    } catch {}

    setWalletAddress(address);
    setWalletChainId(chainId);
  }, []);

  const disconnectWallet = useCallback(() => {
    const u = getUserKeyFromStorage();
    const { addr, chain } = storageKeysForUser(u);

    try {
      localStorage.removeItem(addr);
      localStorage.removeItem(chain);
    } catch {}

    setWalletAddress(null);
    setWalletChainId(null);
  }, []);

  useEffect(() => {
    refreshRubyntBalance();
    loadWalletFromStorage();
  }, [refreshRubyntBalance, loadWalletFromStorage]);

  useEffect(() => {
    const eth = getInjectedProvider();
    if (!eth?.on) return;

    const onAccountsChanged = (accounts: string[]) => {
      const next = accounts?.[0] || null;

      const u = getUserKeyFromStorage();
      const { addr, chain } = storageKeysForUser(u);

      let hasLinked = false;
      try {
        hasLinked = !!localStorage.getItem(addr);
      } catch {
        hasLinked = false;
      }
      if (!hasLinked) return;

      if (!next) {
        try {
          localStorage.removeItem(addr);
          localStorage.removeItem(chain);
        } catch {}
        setWalletAddress(null);
        return;
      }

      try {
        localStorage.setItem(addr, next);
      } catch {}
      setWalletAddress(next);
    };

    const onChainChanged = (cidHex: string) => {
      let nextId: number | null = null;
      try {
        nextId = parseInt(cidHex, 16);
        if (!Number.isFinite(nextId)) nextId = null;
      } catch {
        nextId = null;
      }

      setWalletChainId(nextId);

      const u = getUserKeyFromStorage();
      const { addr, chain } = storageKeysForUser(u);

      let hasLinked = false;
      try {
        hasLinked = !!localStorage.getItem(addr);
      } catch {
        hasLinked = false;
      }

      if (hasLinked) {
        try {
          if (typeof nextId === "number") localStorage.setItem(chain, String(nextId));
          else localStorage.removeItem(chain);
        } catch {}
      }
    };

    try {
      eth.on("accountsChanged", onAccountsChanged);
      eth.on("chainChanged", onChainChanged);
    } catch {}

    (async () => {
      try {
        const cidHex: string = await eth.request({ method: "eth_chainId" });
        if (typeof cidHex === "string") {
          const n = parseInt(cidHex, 16);
          setWalletChainId(Number.isFinite(n) ? n : null);
        }
      } catch {}
    })();

    return () => {
      try {
        eth.removeListener?.("accountsChanged", onAccountsChanged);
        eth.removeListener?.("chainChanged", onChainChanged);
      } catch {}
    };
  }, []);

  const handleDailyClaim = useCallback(
    (r: DailyReward) => {
      if (!r) return;

      if (r.type === "br") {
        addRubynts(r.amount);
        return;
      }

      if (r.type === "bomb") {
        addInventoryItem("bombs", r.amount);
        return;
      }

      if (r.type === "moves") {
        addInventoryItem("extraMoves", r.amount);
        return;
      }

      if (r.type === "striped") {
        addInventoryItem("stripedBombs", r.amount);
        return;
      }

      if (r.type === "rainbow") {
        addInventoryItem("rainbowBombs", r.amount);
        return;
      }

      if (r.type === "br_chest") {
        addRubynts(r.amount);
        return;
      }

      if (r.type === "infinite_life") {
        try {
          const now = Date.now();
          const currentUntil = getInfiniteLifeUntil();
          const base = currentUntil > now ? currentUntil : now;
          const nextUntil = base + r.minutes * 60 * 1000;
          localStorage.setItem(LS_INF_LIFE_UNTIL, String(nextUntil));
        } catch {}

        setLivesToMax();
      }
    },
    [addRubynts, addInventoryItem, setLivesToMax]
  );

  const value = useMemo<GameCtx>(
    () => ({
      progress,
      isLoading: false,

      lives,
      maxLives,
      spendLife,
      resetLives,

      addLives,
      setLivesToMax,
      addInventoryItem,
      consumeInventoryItem,

      refreshRubyntBalance,
      addRubynts,

      walletAddress,
      walletChainId,
      connectWallet,
      disconnectWallet,

      isWalletOpen,
      openWallet,
      closeWallet,

      isDailyOpen,
      openDaily,
      closeDaily,

      completeLevel: () => {},
    }),
    [
      progress,
      lives,
      maxLives,
      spendLife,
      resetLives,
      addLives,
      setLivesToMax,
      addInventoryItem,
      consumeInventoryItem,
      refreshRubyntBalance,
      addRubynts,
      walletAddress,
      walletChainId,
      connectWallet,
      disconnectWallet,
      isWalletOpen,
      openWallet,
      closeWallet,
      isDailyOpen,
      openDaily,
      closeDaily,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}

      {isDailyOpen && (
        <DailyChestModal
          userKey={userKey}
          onClose={closeDaily}
          onClaim={(r) => {
            handleDailyClaim(r);
            closeDaily();
          }}
        />
      )}
    </Ctx.Provider>
  );
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}