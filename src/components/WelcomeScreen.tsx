type WelcomeScreenProps = {
  onContinue: () => void;
};

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const bg = `${import.meta.env.BASE_URL}assets/backgrounds/welcome_realm.gif`;

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10 w-full px-5 sm:px-6 max-w-[820px] text-center">
        <div className="mx-auto rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md shadow-2xl p-6 sm:p-8 md:p-10 intro-fade">
          <div className="text-white/90 text-[clamp(16px,2.4vw,20px)] tracking-wide">
            Welcome, <span className="text-emerald-300/90 font-semibold">Shardkeeper</span>.
          </div>

          <h2 className="mt-4 text-white leading-tight text-[clamp(22px,3.6vw,34px)] font-[ui-serif,Georgia,serif]">
            Your journey begins beyond the Vault gates.
          </h2>

          <p className="mt-4 mx-auto max-w-[60ch] text-white/80 leading-relaxed text-[clamp(14px,2.2vw,18px)]">
            Create your profile to enter the realm. Your progress, shards, and rewards will be bound to your account.
          </p>

          <div className="mt-8">
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
              CONTINUE TO REGISTRATION
            </button>

            <div className="mt-3 text-xs sm:text-sm text-white/55">
              Tip: You can enable sound later for the full experience.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}