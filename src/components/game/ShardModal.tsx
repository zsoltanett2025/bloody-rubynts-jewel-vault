// src/components/game/ShardModal.tsx
import { useMemo } from "react";
import { assetUrl } from "../../utils/assetUrl";
import { getUserKeyFromStorage } from "../../app/rewards/brRewards";
import { getUnlockedShards, SHARD_LEVELS } from "../../app/rewards/shards";

function rewardFor(i: number) {
  return 10 + i * 5;
}

export function ShardModal({ onClose }: { onClose: () => void }) {
  const unlocked = useMemo(() => {
    const userKey = getUserKeyFromStorage();
    return getUnlockedShards(userKey);
  }, []);

  return (
    <div className="fixed inset-0 z-[21000] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold">Ruby Shards</h3>
            <div className="text-[11px] text-white/45">
              Collect shards on special levels: {SHARD_LEVELS.join(", ")}
            </div>
          </div>
          <button onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg">
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Array.from({ length: 15 }, (_, i) => {
           const img = assetUrl(
          `assets/backgrounds/map/ruby/ruby_shard_${String(i + 1).padStart(2, "0")}.png`
      );
            const got = !!unlocked[i];
            return (
              <div
                key={i}
                className={`rounded-xl border p-2 bg-black/30 ${
                  got ? "border-red-400/50 shadow-[0_0_25px_rgba(255,50,50,0.25)]" : "border-white/10 opacity-75"
                }`}
              >
                <div className="flex items-center justify-center">
                  <img src={img} className={`h-14 w-auto ${got ? "" : "grayscale opacity-60"}`} />
                </div>
                <div className="mt-2 text-center text-xs text-white/70">
                  Shard {i + 1}
                </div>
                <div className={`text-center text-sm font-semibold ${got ? "text-red-200" : "text-white/60"}`}>
                  {rewardFor(i)} BR
                </div>
                <div className="text-center text-[11px] text-white/40 mt-1">
                  {got ? "CLAIMED" : "LOCKED"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}