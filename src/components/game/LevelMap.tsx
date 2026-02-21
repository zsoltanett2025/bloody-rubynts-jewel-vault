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
    const wave = Math.sin(t) * 0.5 + 0.5; // 0..1
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

  // ✅ MAP háttér: 20 pályánként vált (levels_sheet_001..011)
  const backgrounds = GAME_ASSETS.mapBackgrounds;
  const bgIndex = Math.floor((currentLevel - 1) / 20) % backgrounds.length;

  // nagy lovag a map-en
  const knightImg = GAME_ASSETS.map.knight;

  // bal oldali törött rubin panel
  const crackedRuby = GAME_ASSETS.map.crackedRuby;
  const shardImgs = GAME_ASSETS.map.rubyShards;

  const nodes = React.useMemo(() => buildNodes(totalLevels), [totalLevels]);

  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const svgH = maxY - minY + 260;
  const translateY = -minY + 130;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const node = nodes.find((n) => n.level === currentLevel);
    if (!node) return;

    const targetY = node.y + translateY;
    const top = Math.max(0, targetY - window.innerHeight * 0.55);

    el.scrollTo({ top, behavior: "smooth" });
  }, [currentLevel, nodes, translateY]);

  // shard találatok frissítése (localStorage-ból)
  const [foundShards, setFoundShards] = React.useState<Record<number, boolean>>(() =>
    loadFoundShards()
  );
  React.useEffect(() => {
    const id = window.setInterval(() => setFoundShards(loadFoundShards()), 600);
    return () => window.clearInterval(id);
  }, []);

  // shard progress: SHARD_LEVELS-hez kötjük a darabokat (1 darab = 1 shard level)
  const shardStates = React.useMemo(() => {
    return SHARD_LEVELS.map((lvl, idx) => ({
      level: lvl,
      found: !!foundShards[lvl],
      img: shardImgs[idx % shardImgs.length],
    }));
  }, [foundShards, shardImgs]);

  const have = shardStates.filter((s) => s.found).length;
  const total = shardStates.length;

  const currentNode = nodes.find((n) => n.level === currentLevel);

  return (
    <div
      ref={scrollRef}
      className="w-full h-[100svh] overflow-y-auto relative"
      style={{
        backgroundImage: `
          linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.88)),
          radial-gradient(1200px 600px at 50% 0%, rgba(220,38,38,0.28), transparent 60%),
          url("${backgrounds[bgIndex]}")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* BAL FIX PANEL – törött rubin + darabok */}
      <div className="hidden lg:block absolute left-4 top-40 z-20 w-[420px] xl:w-[520px] pointer-events-none">
        <div className="rounded-2xl border border-red-900/30 bg-black/35 backdrop-blur-sm p-5 min-h-[460px] max-h-[70vh] overflow-hidden">
          <div className="text-red-200/70 tracking-[0.28em] uppercase text-xs">Küldetés</div>
          <div className="mt-2 text-3xl xl:text-4xl text-red-100 font-lore">
            Összetört Rubin
          </div>

          <div className="mt-4 flex items-center gap-4">
            <img
              src={crackedRuby}
              alt="Cracked ruby"
              className="w-20 h-20 object-contain opacity-95"
              style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.6))" }}
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />

            <div className="text-red-100/90">
              <div className="font-lore text-xl">
                Szilánkok: <span className="font-bold">{have}</span> / {total}
              </div>
              <div className="text-red-200/70 text-sm mt-1 font-sans">
                Keresd a szilánkokat a kihívás szinteken.
              </div>
            </div>
          </div>

          {/* darabok rácsban */}
          <div className="mt-4 grid grid-cols-5 gap-3 overflow-auto pr-1 max-h-[42vh]">
            {shardStates.map((s, i) => (
              <div key={`${s.level}-${i}`} className="flex flex-col items-center">
                <img
                  src={s.img}
                  alt={`Shard ${i + 1}`}
                  className="w-20 h-20 object-contain"  // ✅ kicsit kisebb, jobban átlátható
                  style={{
                    opacity: s.found ? 1 : 0.22,
                    filter: s.found
                      ? "drop-shadow(0 0 12px rgba(220,38,38,0.75))"
                      : "grayscale(1) drop-shadow(0 0 8px rgba(0,0,0,0.7))",
                  }}
                />
                <div className="text-[10px] text-white/40 font-sans mt-1">L{s.level}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 text-white/45 text-xs font-sans">
            Szilánkszintek: {SHARD_LEVELS.join(", ")}
          </div>
        </div>
      </div>

      {/* ✅ Jobb felső GNÓM badge */}
      <div className="hidden lg:block absolute right-4 top-44 z-20 pointer-events-none">
        <div className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-sm p-4 w-[150px] h-[150px] flex items-center justify-center">
          <img
            src={GAME_ASSETS.map.gnomes.g1}
            alt="Gnomes"
            className="w-32 h-32 object-contain opacity-95"
            style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.65))" }}
          />
        </div>
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-10 px-4 py-3 backdrop-blur-md bg-black/35 border-b border-white/10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="text-white font-semibold">Bloody Rubynts</div>
            <div className="text-white/60 text-xs">World Map</div>
          </div>
          <div className="text-white/70 text-sm">
            Level <span className="text-white font-bold">{currentLevel}</span>
          </div>
        </div>
      </div>

      {/* MAP SVG */}
      <div className="w-full">
        <svg width="100%" viewBox={`0 0 420 ${svgH}`} style={{ height: svgH, display: "block" }}>
          <g transform={`translate(0 ${translateY})`}>
            {/* LOVAG – aktuális node-nál */}
            {currentNode && (
              <image
                href={knightImg}
                x={currentNode.x - 22}
                y={currentNode.y - 70}
                width={70}
                height={70}
                opacity={0.98}
                style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.65))" }}
              />
            )}

            {/* NODE-OK */}
            {nodes.map((n) => {
              const locked = n.level > unlockedLevel;
              const isCurrent = n.level === currentLevel;
              const isDone = n.level < currentLevel;

              return (
                <g key={n.level} transform={`translate(${n.x} ${n.y})`}>
                  {isCurrent && (
                    <circle r={34} fill="rgba(220,38,38,0.22)">
                      <animate attributeName="r" values="28;36;28" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.22;0.55;0.22" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}

                  <foreignObject x={-30} y={-30} width={60} height={60}>
                    <button
                      disabled={locked}
                      onClick={() => !locked && onSelectLevel(n.level)}
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
                      style={{ backdropFilter: "blur(6px)" }}
                      title={locked ? "Locked" : `Level ${n.level}`}
                    >
                      <span className="font-bold">{n.level}</span>
                    </button>
                  </foreignObject>

                  {isDone && (
                    <text x={0} y={44} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.55)">
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="h-16" />
    </div>
  );
}