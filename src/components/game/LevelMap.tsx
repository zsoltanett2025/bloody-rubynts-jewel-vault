import React from "react";
import { loadFoundShards, SHARD_LEVELS } from "../../utils/shards";
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

  const backgrounds = GAME_ASSETS.mapBackgrounds;
  const bgIndex =
    Math.floor((currentLevel - 1) / 20) % backgrounds.length;

  const knightImg = GAME_ASSETS.map.knight;
  const crackedRuby = GAME_ASSETS.map.crackedRuby;
  const shardImgs = GAME_ASSETS.map.rubyShards;

  const nodes = React.useMemo(
    () => buildNodes(totalLevels),
    [totalLevels]
  );

  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const svgH = maxY - minY + 260;
  const translateY = -minY + 130;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // ✅ Mobil detektálás
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

    // ✅ stabilabb scroll számítás
    const top = Math.max(0, targetY - el.clientHeight * 0.55);

    el.scrollTo({ top, behavior: "smooth" });
  }, [currentLevel, nodes, translateY]);

  const [foundShards, setFoundShards] =
    React.useState<Record<number, boolean>>(() =>
      loadFoundShards()
    );

  React.useEffect(() => {
    const id = window.setInterval(
      () => setFoundShards(loadFoundShards()),
      600
    );
    return () => window.clearInterval(id);
  }, []);

  const shardStates = React.useMemo(() => {
    return SHARD_LEVELS.map((lvl, idx) => ({
      level: lvl,
      found: !!foundShards[lvl],
      img: shardImgs[idx % shardImgs.length],
    }));
  }, [foundShards, shardImgs]);

  const have = shardStates.filter((s) => s.found).length;
  const total = shardStates.length;

  const currentNode = nodes.find(
    (n) => n.level === currentLevel
  );

  return (
    <div
      ref={scrollRef}
      className="w-full h-[100svh] overflow-y-auto relative scroll-pt-20"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.88)),
          radial-gradient(1200px 600px at 50% 0%, rgba(220,38,38,0.28), transparent 60%),
          url("${backgrounds[bgIndex]}")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        // ✅ Mobil fix
        backgroundAttachment: isMobile ? "scroll" : "fixed",
      }}
    >
      <div className="sticky top-0 z-10 px-4 py-3 backdrop-blur-md bg-black/35 border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">
              Bloody Rubynts
            </div>
            <div className="text-white/60 text-xs">
              World Map
            </div>
          </div>
          <div className="text-white/70 text-sm">
            Level{" "}
            <span className="text-white font-bold">
              {currentLevel}
            </span>
          </div>
        </div>
      </div>

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
              const locked = n.level > unlockedLevel;
              const isCurrent = n.level === currentLevel;
              const isDone = n.level < currentLevel;

              return (
                <g
                  key={n.level}
                  transform={`translate(${n.x} ${n.y})`}
                >
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

                  <foreignObject
                    x={-30}
                    y={-30}
                    width={60}
                    height={60}
                  >
                    <button
                      disabled={locked}
                      onClick={() =>
                        !locked && onSelectLevel(n.level)
                      }
                      className={[
                        "w-[60px] h-[60px] rounded-full flex items-center justify-center",
                        "border shadow-lg",
                        locked
                          ? "bg-white/5 border-white/10 text-white/30"
                          : isCurrent
                          ? "bg-red-600/85 border-red-200/40 text-white"
                          : isDone
                          ? "bg-white/10 border-white/20 text-white/85"
                          : "bg-white/10 border-white/20 text-white/80 hover:bg-white/15",
                      ].join(" ")}
                    >
                      <span className="font-bold">
                        {n.level}
                      </span>
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
  );
}