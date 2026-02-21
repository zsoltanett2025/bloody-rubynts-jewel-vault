// src/ui/InfoButton.tsx
export function InfoButton(props: { onClick: () => void }) {
  const { onClick } = props;

  return (
    <>
      {/* helyi CSS anim a "rubin aurához" */}
      <style>{`
        @keyframes brRubyGlow {
          0%   { transform: scale(1);   opacity: .55; filter: blur(10px); }
          50%  { transform: scale(1.18); opacity: .85; filter: blur(14px); }
          100% { transform: scale(1);   opacity: .55; filter: blur(10px); }
        }
        @keyframes brRubySpin {
          0%   { transform: rotate(0deg);   opacity: .40; }
          50%  { opacity: .70; }
          100% { transform: rotate(360deg); opacity: .40; }
        }
      `}</style>

      <button
        type="button"
        onClick={onClick}
        aria-label="Info"
        title="Info"
        className={[
          // pozíció: bal alsó
          "fixed left-4 bottom-16 z-[9999]",

          // méret + layout
          "w-16 h-16 rounded-full",

          // fontos: a belső aurákhoz
          "relative",

          // UX
          "bg-transparent",
          "active:scale-95 hover:scale-105",
          "transition-transform duration-200",
        ].join(" ")}
      >
        {/* aura 1 (külső, lassú glow) */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(220,38,38,.55) 0%, rgba(220,38,38,.10) 55%, rgba(0,0,0,0) 75%)",
            animation: "brRubyGlow 2.4s ease-in-out infinite",
          }}
        />

        {/* aura 2 (forgó “gyűrű”, finom) */}
        <span
          className="absolute -inset-2 rounded-full pointer-events-none"
          style={{
            border: "2px solid rgba(220,38,38,.20)",
            boxShadow: "0 0 24px rgba(220,38,38,.35)",
            animation: "brRubySpin 4.8s linear infinite",
          }}
        />

        {/* IKON (PNG) */}
        <img
          src={`${import.meta.env.BASE_URL}assets/ui/info_ruby.png`}
          alt="Info"
          draggable={false}
          className={[
            "relative z-10",
            "w-full h-full object-contain",
            "drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]",
          ].join(" ")}
        />
      </button>
    </>
  );
}