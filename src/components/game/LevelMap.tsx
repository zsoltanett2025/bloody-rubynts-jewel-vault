import React from "react";
import { loadFoundShards } from "../../utils/shards";
import { GAME_ASSETS } from "../../utils/gameAssets";

type Node = { level: number; x: number; y: number };

function buildNodes(count: number): Node[] {
  const nodes: Node[] = [];
  const startX = 60;
  const width = 300;
  const startY = 520;
  const stepY = 70;

  for (let i = 1; i <= count; i++) {
    const t = (i - 1) / 2;
    const wave = Math.sin(t) * 0.5 + 0.5;
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

  const MAX_VISIBLE_LEVELS = totalLevels;

  const backgrounds = GAME_ASSETS.mapBackgrounds;
  const bgIndex = Math.floor((currentLevel - 1) / 20) % backgrounds.length;

  const knightImg = GAME_ASSETS.map.knight;

  const nodes = React.useMemo(() => buildNodes(MAX_VISIBLE_LEVELS), [MAX_VISIBLE_LEVELS]);

  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const svgH = maxY - minY + 260;
  const translateY = -minY + 130;

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
    const topOffset = isMobile ? 140 : 60;
    const top = Math.max(0, targetY - topOffset);

    el.scrollTo({ top, behavior: "smooth" });
  }, [currentLevel, nodes, translateY, isMobile]);

  const [, setFoundShards] = React.useState<Record<number, boolean>>(() =>
    loadFoundShards()
  );

  React.useEffect(() => {
    const id = window.setInterval(() => setFoundShards(loadFoundShards()), 600);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const currentNode = nodes.find((n) => n.level === currentLevel);

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-[#050505]">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(180deg, rgba(0,0,0,0.40), rgba(0,0,0,0.72)),
            radial-gradient(1200px 600px at 50% 0%, rgba(220,38,38,0.20), transparent 60%),
            url('${backgrounds[bgIndex]}')
          `,
          backgroundSize: "cover",
          backgroundPosition: isMobile ? "center top" : "center center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: isMobile ? "scroll" : "fixed",
          backgroundColor: "#050505",
        }}
      />

      <div
        ref={scrollRef}
        className="relative z-10 w-full h-[100svh] overflow-y-hidden scroll-pt-20"
      >
        <div className="w-full">
          <svg
            width="100%"
            viewBox={`0 0 420 ${svgH}`}
            style={{ height: svgH, display: "block" }}
          >
            <g transform={`translate(0 ${translateY})`}>
              {currentNode && (
                <image
                  href={knightImg}
                  x={currentNode.x - 22}
                  y={currentNode.y - 70}
                  width={70}
                  height={70}
                  opacity={0.98}
                />
              )}

              {nodes.map((n) => {
                const isCurrent = n.level === currentLevel;
                const isDone = n.level < currentLevel;
                const isBuilt = n.level <= totalLevels;

                const isComingSoon = false;
                const isProgressLocked = n.level > unlockedLevel;

                return (
                  <g key={n.level} transform={`translate(${n.x} ${n.y})`}>
                    {isCurrent && (
                      <circle r={34} fill="rgba(220,38,38,0.22)">
                        <animate
                          attributeName="r"
                          values="28;36;28"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.22;0.55;0.22"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    <foreignObject x={-30} y={-30} width={60} height={60}>
                      <button
                        disabled={isProgressLocked}
                        onClick={() => {
                          if (isComingSoon) return;
                          if (isProgressLocked) return;
                          onSelectLevel(n.level);
                        }}
                        className={[
                          "w-[60px] h-[60px] rounded-full flex items-center justify-center",
                          "border shadow-lg",
                          isProgressLocked
                            ? "bg-white/5 border-white/10 text-white/30"
                            : isCurrent
                              ? "bg-red-600/85 border-red-200/40 text-white"
                              : isDone
                                ? "bg-white/10 border-white/20 text-white/85"
                                : isBuilt
                                  ? "bg-white/10 border-white/20 text-white/80 hover:bg-white/15"
                                  : "bg-white/5 border-white/10 text-white/55",
                        ].join(" ")}
                        title={isProgressLocked ? "Locked" : `Level ${n.level}`}
                      >
                        <span className="font-bold">{n.level}</span>
                      </button>
                    </foreignObject>

                    {isDone && (
                      <text
                        x={0}
                        y={44}
                        textAnchor="middle"
                        fontSize="12"
                        fill="rgba(255,255,255,0.55)"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}