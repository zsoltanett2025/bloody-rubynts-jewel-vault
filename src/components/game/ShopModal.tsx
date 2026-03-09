// src/components/game/ShopModal.tsx
import { useState } from "react";
import { useGame } from "./GameState";
import { getUserKeyFromStorage, spendBr } from "../../app/rewards/brRewards";

type Item = {
  id: string;
  title: string;
  desc: string;
  price: number; // BR
  onBuy: () => void;
};

const LS_INF_LIFE_UNTIL = "br_infinite_life_until_v1";

export function ShopModal({ onClose }: { onClose: () => void }) {
  const { progress, addLives, setLivesToMax, addInventoryItem, refreshRubyntBalance } = useGame();
  const br = progress?.rubyntBalance ?? 0;

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const addItemSafe = (key: string, amount: number) => {
    try {
      (addInventoryItem as any)?.(key, amount);
    } catch {
      // későbbi GameState bővítésig ne törjön el a shop
    }
  };

  const grantInfiniteLife = (minutes: number) => {
    try {
      const now = Date.now();
      const currentUntil = Number(localStorage.getItem(LS_INF_LIFE_UNTIL) || 0);
      const base = currentUntil > now ? currentUntil : now;
      const nextUntil = base + minutes * 60 * 1000;
      localStorage.setItem(LS_INF_LIFE_UNTIL, String(nextUntil));
    } catch {
      // ne törjön el a vásárlás, ha a localStorage épp hibázik
    }

    try {
      setLivesToMax();
    } catch {}
  };

  const buy = (price: number, apply: () => void, successText: string) => {
    setErr(null);
    setOk(null);

    const userKey = getUserKeyFromStorage();
    if (!userKey || userKey === "guest") {
      setErr("Please login first.");
      return;
    }

    const paid = spendBr(userKey, price);
    if (!paid) {
      setErr("Not enough BR.");
      return;
    }

    try {
      apply();
    } catch {
      // ha valami mégis hibázik, ne égjen el a UI
    }

    try {
      refreshRubyntBalance();
    } catch {}

    setOk(successText);
  };

  const items: Item[] = [
    {
      id: "life_1",
      title: "+1 Life",
      desc: "Adds one life (up to max).",
      price: 15,
      onBuy: () => buy(15, () => addLives(1), "Purchased: +1 Life"),
    },
    {
      id: "life_refill",
      title: "Refill Lives",
      desc: "Refills lives to maximum.",
      price: 35,
      onBuy: () => buy(35, () => setLivesToMax(), "Purchased: Lives refilled"),
    },
    {
      id: "bomb_1",
      title: "+1 Bomb",
      desc: "Adds one bomb to your inventory.",
      price: 20,
      onBuy: () => buy(20, () => addItemSafe("bombs", 1), "Purchased: +1 Bomb"),
    },
    {
      id: "striped_1",
      title: "+1 Striped Bomb",
      desc: "Adds one striped bomb to your inventory.",
      price: 25,
      onBuy: () =>
        buy(25, () => addItemSafe("stripedBombs", 1), "Purchased: +1 Striped Bomb"),
    },
    {
      id: "rainbow_1",
      title: "+1 Rainbow Bomb",
      desc: "Adds one rainbow bomb to your inventory.",
      price: 40,
      onBuy: () =>
        buy(40, () => addItemSafe("rainbowBombs", 1), "Purchased: +1 Rainbow Bomb"),
    },
    {
      id: "moves_5",
      title: "+5 Moves",
      desc: "Adds one +5 moves booster to your inventory.",
      price: 30,
      onBuy: () => buy(30, () => addItemSafe("extraMoves", 1), "Purchased: +5 Moves"),
    },
    {
      id: "inf_life_30",
      title: "Infinite Life (30 min)",
      desc: "Gives unlimited lives for 30 minutes.",
      price: 100,
      onBuy: () =>
        buy(100, () => grantInfiniteLife(30), "Purchased: Infinite Life for 30 minutes"),
    },
    {
      id: "inf_life_60",
      title: "Infinite Life (1 hour)",
      desc: "Gives unlimited lives for 60 minutes.",
      price: 120,
      onBuy: () =>
        buy(120, () => grantInfiniteLife(60), "Purchased: Infinite Life for 1 hour"),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[20000] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold">Shop</h3>
            <div className="text-[11px] text-white/50">Spend BR on boosts and timed bonuses</div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition"
          >
            Close
          </button>
        </div>

        <div className="rounded-xl bg-black/30 border border-white/10 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">BR Balance</div>
            <div className="text-sm font-semibold tabular-nums">{br}</div>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500/30 p-2 text-sm">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-sm">
            {ok}
          </div>
        )}

        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl bg-black/25 border border-white/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-xs text-white/60 mt-1">{it.desc}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-white/50">Price</div>
                  <div className="text-sm font-semibold tabular-nums">{it.price} BR</div>
                </div>
              </div>

              <button
                type="button"
                onClick={it.onBuy}
                className="mt-3 w-full rounded-xl bg-red-800/80 py-2 font-semibold hover:bg-red-700 transition"
              >
                Buy
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Tip: Bought boosters are stored for later use. Infinite life is saved as a timed bonus for
          future integration into the main HUD and game screen.
        </div>
      </div>
    </div>
  );
}