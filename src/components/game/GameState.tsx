// src/components/game/GameState.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { getUserKeyFromStorage, getBrBalance, addBr } from "../../app/rewards/brRewards";

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

  addLives: (n: number) => void;
  setLivesToMax: () => void;
  addInventoryItem: (key: "bombs" | "wizards", n: number) => void;

  refreshRubyntBalance: () => void;
  addRubynts: (amount: number) => void;

  walletAddress: string | null;
  walletChainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  isWalletOpen: boolean;
  openWallet: () => void;
  closeWallet: () => void;

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

// ✅ Lives regen (per-user) keys
const LS_LIVES_PREFIX = "br_lives_v1:";
const LS_LIVES_TS_PREFIX = "br_lives_ts_v1:";
const LIFE_REGEN_MS = 30 * 60 * 1000; // ✅ 30 minutes

function livesKey(userKey: string) {
  return `${LS_LIVES_PREFIX}${userKey}`;
}
function livesTsKey(userKey: string) {
  return `${LS_LIVES_TS_PREFIX}${userKey}`;
}

function clampLives(n: number, maxLives: number) {
  return Math.max(0, Math.min(maxLives, Math.floor(n)));
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const maxLives = 3;

  // ✅ active userKey (per account)
  const [userKey, setUserKey] = useState(() => getUserKeyFromStorage());

  // ✅ lives init: if missing for this user => seed to full immediately
  const [lives, setLives] = useState(() => {
    const u = getUserKeyFromStorage();

    // guest always full (no persistence)
    if (!u || u === "guest") return maxLives;

    try {
      const raw = localStorage.getItem(livesKey(u));
      const n = Number(raw);

      if (!Number.isFinite(n)) {
        // seed full for brand new user
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
        return maxLives;
      }

      const loaded = clampLives(n, maxLives);

      // ensure TS exists
      const tsRaw = localStorage.getItem(livesTsKey(u));
      const ts = Number(tsRaw);
      if (!Number.isFinite(ts) || ts <= 0) localStorage.setItem(livesTsKey(u), String(Date.now()));

      return loaded;
    } catch {
      return maxLives;
    }
  });

  const [progress, setProgress] = useState<Progress>({
    rubyntBalance: 0,
    inventory: { bombs: 3, wizards: 3 },
  });

  // ✅ wallet state
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);

  // ✅ wallet modal UI
  const [isWalletOpen, setWalletOpen] = useState(false);
  const openWallet = useCallback(() => setWalletOpen(true), []);
  const closeWallet = useCallback(() => setWalletOpen(false), []);

  // ✅ keep userKey in sync with storage (login/register/logout)
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = getUserKeyFromStorage();
      setUserKey((prev) => (prev === next ? prev : next));
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  // ✅ whenever userKey changes: load OR seed lives
  useEffect(() => {
    const u = userKey;

    if (!u || u === "guest") {
      // guest: always full, and optionally cleanup guest keys
      try {
        localStorage.removeItem(livesKey("guest"));
        localStorage.removeItem(livesTsKey("guest"));
      } catch {}
      setLives(maxLives);
      return;
    }

    try {
      const raw = localStorage.getItem(livesKey(u));
      const n = Number(raw);

      if (!Number.isFinite(n)) {
        // NEW USER => START FULL (this fixes "empty lives on register")
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
        setLives(maxLives);
        return;
      }

      const loaded = clampLives(n, maxLives);
      setLives(loaded);

      // ensure TS exists
      const tsRaw = localStorage.getItem(livesTsKey(u));
      const ts = Number(tsRaw);
      if (!Number.isFinite(ts) || ts <= 0) localStorage.setItem(livesTsKey(u), String(Date.now()));
    } catch {
      setLives(maxLives);
    }
  }, [userKey, maxLives]);

  // ✅ regen tick (source of truth: localStorage)
  const tickLives = useCallback(() => {
    const u = userKey;
    if (!u || u === "guest") return;

    try {
      const now = Date.now();

      // read stored lives
      const lRaw = localStorage.getItem(livesKey(u));
      let current = Number(lRaw);

      // if missing => seed full (safety)
      if (!Number.isFinite(current)) {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(now));
        if (lives !== maxLives) setLives(maxLives);
        return;
      }

      current = clampLives(current, maxLives);

      // read timestamp
      const tsRaw = localStorage.getItem(livesTsKey(u));
      let lastTs = Number(tsRaw);
      if (!Number.isFinite(lastTs) || lastTs <= 0) {
        lastTs = now;
        localStorage.setItem(livesTsKey(u), String(lastTs));
      }

      if (current >= maxLives) {
        // keep TS fresh
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
  }, [userKey, lives, maxLives]);

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

    setLives((v) => {
      const next = Math.max(0, v - 1);

      try {
        if (u && u !== "guest") {
          localStorage.setItem(livesKey(u), String(next));

          // IMPORTANT: when spending life, restart timer NOW (so regen starts immediately)
          if (next < maxLives) localStorage.setItem(livesTsKey(u), String(Date.now()));
        }
      } catch {}

      return next;
    });
  }, [userKey, maxLives]);

  const resetLives = useCallback(() => {
    const u = userKey;
    setLives(maxLives);
    try {
      if (u && u !== "guest") {
        localStorage.setItem(livesKey(u), String(maxLives));
        localStorage.setItem(livesTsKey(u), String(Date.now()));
      }
    } catch {}
  }, [userKey, maxLives]);

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
    [userKey, maxLives]
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
  }, [userKey, maxLives]);

  const addInventoryItem = useCallback((key: "bombs" | "wizards", n: number) => {
    const a = Math.max(0, Math.floor(Number(n) || 0));
    if (a <= 0) return;
    setProgress((p) => ({
      ...p,
      inventory: {
        ...p.inventory,
        [key]: (p.inventory[key] ?? 0) + a,
      },
    }));
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

      refreshRubyntBalance,
      addRubynts,

      walletAddress,
      walletChainId,
      connectWallet,
      disconnectWallet,

      isWalletOpen,
      openWallet,
      closeWallet,

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
      refreshRubyntBalance,
      addRubynts,
      walletAddress,
      walletChainId,
      connectWallet,
      disconnectWallet,
      isWalletOpen,
      openWallet,
      closeWallet,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}