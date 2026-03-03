type IntroScreenProps = {
  onContinue: () => void;
};

export function IntroScreen({ onContinue }: IntroScreenProps) {
  // PNG background path
  const bg = `${import.meta.env.BASE_URL}assets/backgrounds/intro_castle.png`;

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.70) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* Subtle mist/light layer */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(180,255,220,0.22), transparent 45%), radial-gradient(circle at 70% 60%, rgba(255,220,180,0.16), transparent 50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full px-5 sm:px-6 max-w-[860px] text-center">
        <div className="mx-auto rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md shadow-2xl p-6 sm:p-8 md:p-10">
          {/* Title */}
          <div className="select-none">
            <h1
              className="
                font-[ui-serif,Georgia,serif]
                uppercase tracking-[0.22em]
                text-white leading-tight
                text-[clamp(26px,4.2vw,46px)]
              "
            >
              BLOODY RUBYNT
            </h1>

            <div className="mt-3 text-[clamp(14px,2.1vw,18px)] uppercase tracking-[0.18em] text-amber-200/90">
              The Shattered Core
            </div>
          </div>

          {/* Scrollable info area (mobile safe) */}
          <div className="mt-6 mx-auto max-w-[70ch] text-left">
            <div
              className="
                rounded-2xl border border-white/10 bg-black/25
                p-5 sm:p-6
                max-h-[52svh] sm:max-h-[56svh]
                overflow-auto
              "
            >
              {/* Lore */}
              <p className="text-white/60 leading-relaxed text-[clamp(14px,2.2vw,18px)]">
                When the Ancient Rubynt shattered, the balance of the realm collapsed.
                Shards scattered across the dragonlands. Now it’s up to you to gather
                them—and awaken the power within.
              </p>

              {/* Divider */}
              <div className="my-5 h-px bg-white/10" />

              {/* What you can get */}
              <h2 className="text-white font-semibold tracking-wide text-[15px] sm:text-[16px]">
                What you can unlock
              </h2>

              <ul className="mt-3 space-y-2 text-white/85 text-[13px] sm:text-[14px] leading-relaxed">
                <li>
                  • <b>Match-3 adventure</b> across the Bloody Rubynt world: dragons, castles, cursed lands, and hidden vaults.
                </li>
                <li>
                  • <b>Shard Hunt:</b> find broken Rubynt fragments hidden across special levels.
                </li>
                <li>
                  • <b>Treasure Chests:</b> random rewards may include small BR coin drops and bonus items.
                </li>
                <li>
                  • <b>Weekly / Daily streak rewards</b> for consistent play (seasonal campaigns).
                </li>
                <li>
                  • <b>Two purchase paths:</b> items can be bought with normal currency or with <b>BR coin</b> (often cheaper in BR).
                </li>
                <li>
                  • <b>Boosters:</b> extra moves, shuffle, bombs, and more—earned or purchased.
                </li>
              </ul>

              {/* Divider */}
              <div className="my-5 h-px bg-white/10" />

              {/* Terms summary */}
              <h3 className="text-white font-semibold tracking-wide text-[14px] sm:text-[15px]">
                Reward terms (summary)
              </h3>

              <p className="mt-3 text-white/70 text-[12px] sm:text-[13px] leading-relaxed">
                Rewards are <b>seasonal</b> and may change over time. BR coin amounts are not fixed and
                can depend on campaign rules and market price. We may limit rewards to protect fairness,
                prevent abuse, and keep the economy stable. By continuing you confirm you understand this.
              </p>

              <p className="mt-3 text-white/60 text-[12px] sm:text-[13px] leading-relaxed">
                Tip: for the best experience, enable sound and play with a stable connection.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6">
            <button
              onClick={onContinue}
              className="
                w-full sm:w-auto inline-flex items-center justify-center
                rounded-2xl px-8 py-4
                text-[15px] sm:text-[16px]
                font-semibold tracking-wide text-white
                bg-[#7a0f19]
                shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_12px_40px_rgba(0,0,0,0.45)]
                hover:bg-[#8b141f]
                active:scale-[0.99]
                transition
              "
            >
              ✅ I AGREE & CONTINUE
            </button>

            <div className="mt-3 text-xs sm:text-sm text-white/60">
              By continuing, you agree to the rules and reward terms.
            </div>
          </div>
        </div>

        <div className="mt-4 text-[11px] sm:text-xs text-white/45">
          First comes the experience — the rewards follow.
        </div>
      </div>
    </div>
  );
}