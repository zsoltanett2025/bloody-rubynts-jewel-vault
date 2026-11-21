/**
 * BR-JV-PTRANS: simple, short transition between levels (owner request 2026-11-21). English only.
 * Replaces the long orange "portal" effect. The old LevelPortalTransition component
 * is kept in the repository for a future special transition (e.g. every 1000 levels).
 */
type SimpleLevelTransitionProps = {
  open: boolean;
  level: number;
};

export function SimpleLevelTransition({ open, level }: SimpleLevelTransitionProps) {
  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center bg-black/70"
      style={{
        opacity: open ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    >
      <div
        className="px-8 py-4 rounded-2xl border-2 border-amber-400/80 bg-[#1d1036]/90 text-amber-200 text-3xl font-bold shadow-[0_0_30px_rgba(251,191,36,0.35)]"
        style={{
          transform: open ? "scale(1)" : "scale(0.92)",
          transition: "transform 300ms ease",
        }}
      >
        Level {level}
      </div>
    </div>
  );
}
