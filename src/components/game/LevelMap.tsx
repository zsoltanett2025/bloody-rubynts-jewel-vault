import React from "react";
import { GAME_ASSETS } from "../../utils/gameAssets";

type Node = { level: number; x: number; y: number };

function buildNodes(count: number): Node[] {
  const nodes: Node[] = [];
  const startX = 60;
  const width = 300;
  const startY = 520;
  const stepY = 80; // Kicsit több Abstand a szintek között

  for (let i = 1; i <= count; i++) {
    const t = (i - 1) / 2;
    const wave = Math.sin(t) * 0.6 + 0.5;
    const x = startX + wave * width;
    const y = startY - (i - 1) * stepY;
    nodes.push({ level: i, x, y });
  }
  return nodes;
}

export function LevelMap(props: {
  totalLevels: number;
  currentLevel: number;
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
}) {
  const { totalLevels, currentLevel, unlockedLevel, onSelectLevel } = props;
  const backgrounds = GAME_ASSETS.mapBackgrounds ?? [];
  const bgIndex = backgrounds.length > 0
  ? Math.floor((currentLevel - 1) / 30) % backgrounds.length
  : 0;
  const bgImage = backgrounds[bgIndex] ?? "";
  const knightImg = GAME_ASSETS.map.knight;
  const nodes = React.useMemo(() => buildNodes(totalLevels), [totalLevels]);

  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const svgH = maxY - minY + 300;
  const translateY = -minY + 150;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const isMobile = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 1024px)").matches;
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const node = nodes.find((n) => n.level === currentLevel);
    if (!node) return;
    const targetY = node.y + translateY;
    const topOffset = isMobile ? 220 : 100;
    el.scrollTo({ top: Math.max(0, targetY - topOffset), behavior: "smooth" });
  }, [currentLevel, nodes, translateY, isMobile]);

  const currentNode = nodes.find((n) => n.level === currentLevel);

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-[#050505] text-white">
      {/* PARALLAX BACKGROUND: Lassabb mozgás a mélység érzéséért */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-500"
        style={{
          backgroundImage: bgImage ? `url('${bgImage}')` : "none",
          backgroundSize: isMobile ? "cover" : "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#1a0000",
          transform: "none",
          filter: "brightness(0.55) contrast(1.15)"
        }}
      />

      {/* ATMOSZFÉRA: köd, rubintok, csillagpor */}
<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/70" />
  <div className="br-map-mist" />
  <div className="br-map-particles" />

  {Array.from({ length: isMobile ? 8 : 16 }, (_, i) => (
    <span
      key={i}
      className="br-falling-ruby"
      style={{
        left: `${8 + ((i * 13) % 86)}%`,
        animationDelay: `${i * 1.35}s`,
        animationDuration: `${9 + (i % 5) * 1.6}s`,
        width: `${10 + (i % 4) * 4}px`,
        height: `${10 + (i % 4) * 4}px`,
        opacity: 0.18 + (i % 3) * 0.06,
      }}
    />
  ))}
</div>

      <div
        ref={scrollRef}
        className="relative z-10 w-full h-[100svh] overflow-y-auto scroll-pt-20"
      >
        <div className="w-full bg-transparent">
          <svg
            width="100%"
            viewBox={`0 0 420 ${svgH}`}
            style={{ height: svgH, display: "block", background: "transparent" }}
          >
            <g transform={`translate(0 ${translateY})`}>
              {/* Knight with a slight hover animation */}
              {currentNode && (
                <g className="animate-knight-hover">
                  <image
                    href={knightImg}
                    x={currentNode.x - 35}
                    y={currentNode.y - 70}
                    width={70}
                    height={70}
                    filter="drop-shadow(0 0 10px rgba(220,38,38,0.8))"
                  />
                </g>
              )}

              {nodes.map((n) => {
                const isCurrent = n.level === currentLevel;
                const isDone = n.level < currentLevel;
                const isProgressLocked = n.level > unlockedLevel;

                return (
                  <g key={n.level} transform={`translate(${n.x} ${n.y})`}>
                    {/* Glowing aura for current level */}
                    {isCurrent && (
                      <circle r={30} fill="rgba(220,38,38,0.3)" className="animate-pulse" />
                    )}

                    <foreignObject x={-30} y={-30} width={60} height={60}>
                      <button
                        disabled={isProgressLocked}
                        onClick={() => !isProgressLocked && onSelectLevel(n.level)}
                        className={`w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all duration-300 border-2 
                          ${isProgressLocked 
                            ? "bg-black/40 border-white/10 text-white/20 scale-90" 
                            : isCurrent 
                              ? "bg-red-600 border-red-200 text-white scale-110 shadow-[0_0_20px_rgba(220,38,38,0.8)]" 
                              : isDone 
                                ? "bg-white/20 border-white/30 text-white/70" 
                                : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"}`}
                      >
                        <span className="font-bold">{n.level}</span>
                      </button>
                    </foreignObject>

                    {isDone && (
                      <text x={0} y={45} textAnchor="middle" fontSize="14" fill="#4ade80" className="font-bold">✓</text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="h-32" />
      </div>
    </div>
  );
}
