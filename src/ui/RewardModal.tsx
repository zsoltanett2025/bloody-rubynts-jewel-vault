type RewardModalProps = {
  shards: number;
  bonus: number;
  onClose: () => void;
};

export function RewardModal({ shards, bonus, onClose }: RewardModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* modal */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-black/55 backdrop-blur-xl shadow-2xl p-6 sm:p-7">
        <div className="text-[11px] tracking-[0.26em] uppercase text-amber-200/80">
          Welcome reward (trial)
        </div>

        <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
          Shardkeeper’s Blessing
        </div>

        <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed">
          You’ve unlocked a starter reward for this trial build.
          Rewards become claimable after wallet connection in a future update.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-white/85">
            <span className="text-sm">Starter Shards</span>
            <span className="font-semibold">+{shards}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-white/85">
            <span className="text-sm">BR Bonus (preview)</span>
            <span className="font-semibold">+{bonus} BR</span>
          </div>

          <div className="mt-3 text-[11px] text-white/55">
            Tip: This does not transfer BR on-chain in the trial version.
          </div>
        </div>

        <button
          onClick={onClose}
          className="
            mt-6 w-full rounded-2xl px-5 py-3
            bg-[#7a0f19] text-white font-semibold tracking-wide
            hover:bg-[#8b141f] active:scale-[0.99] transition
            shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_18px_50px_rgba(0,0,0,0.55)]
          "
        >
          CLAIM & CONTINUE
        </button>

        <div className="mt-3 text-center text-xs text-white/50">
          First comes the journey — the rewards follow.
        </div>
      </div>
    </div>
  );
}