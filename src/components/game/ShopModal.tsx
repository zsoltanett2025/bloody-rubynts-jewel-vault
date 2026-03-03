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

export function ShopModal({ onClose }: { onClose: () => void }) {
  const { progress, addLives, setLivesToMax, addInventoryItem, refreshRubyntBalance } = useGame();
  const br = progress?.rubyntBalance ?? 0;

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

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

    apply();

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
      onBuy: () => buy(20, () => addInventoryItem("bombs", 1), "Purchased: +1 Bomb"),
    },
  ];

  return (
    <div className="fixed inset-0 z-[20000] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold">Shop</h3>
            <div className="text-[11px] text-white/50">Spend BR on boosts (trial economy)</div>
          </div>
          <button onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition">
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

                <div className="text-right">
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
          Tip: This is a manual economy for testing. Later we can add boosters, chests, and special offers.
        </div>
      </div>
    </div>
  );
}