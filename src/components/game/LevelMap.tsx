/**
 * BR-JV-MAP: season level map (concept BR-JV-MAP-2026-11-21 v1.1, approved 2026-11-21).
 * - Winding road with gem-shaped level nodes, stars for completed levels, knight on the current level.
 * - Every 20 levels a new region/season: spring, summer, autumn, winter (repeating).
 * - Only the part near the screen is drawn, so 1000 levels stay fast.
 */
import React from "react";
import { GAME_ASSETS } from "../../utils/gameAssets";
import {
  Ambient,
  Castle,
  MapDefs,
  NodeDecor,
  SEASON_STYLE,
  SideDecor,
  hexa,
  pts,
  rng,
  seasonOfLevel,
  smoothPath,
} from "./mapArt";

const MAP_W = 420;
const STEP = 92;
const PAD_TOP = 160;
const PAD_BOTTOM = 200;
const SIDE = 1400; // scenery drawn outside the map column for wide screens
const REGION = 20;
const GAP = 110; // extra space between regions for the region banner

function nodeX(level: number) {
  return MAP_W / 2 + 110 * Math.sin((level - 1) * 0.82);
}

function Star({ cx, cy, r, filled }: { cx: number; cy: number; r: number; filled: boolean }) {
  const p: [number, number][] = Array.from({ length: 10 }, (_, k) => {
    const rr = k % 2 === 0 ? r : r * 0.45;
    const a = ((-90 + 36 * k) * Math.PI) / 180;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
  return <polygon points={pts(p)} fill={filled ? "url(#brmap-gold)" : "#3a2a40"} stroke="#5a3a00" strokeWidth={1} />;
}

export function LevelMap(props: {
  totalLevels: number;
  currentLevel: number;
  unlockedLevel: number;
  onSelectLevel: (lvl: number) => void;
  levelStars?: Record<number, number>;
}) {
  const { totalLevels, currentLevel, unlockedLevel, onSelectLevel, levelStars } = props;
  const knightImg = GAME_ASSETS.map.knight;

  const lastRegionIdx = Math.floor((totalLevels - 1) / REGION);
  const yOf = React.useCallback(
    (level: number) => PAD_TOP + (totalLevels - level) * STEP + (lastRegionIdx - Math.floor((level - 1) / REGION)) * GAP,
    [totalLevels, lastRegionIdx]
  );
  const svgH = yOf(1) + PAD_BOTTOM;
  const HALF = (STEP + GAP) / 2;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [view, setView] = React.useState({ top: 0, height: 900, width: MAP_W });

  // scale the 420-wide map down on narrow phones, never up
  const scale = Math.min(1, view.width / MAP_W);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setView({ top: el.scrollTop, height: el.clientHeight, width: el.clientWidth });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const isMobile = view.width <= 1024;

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const s = Math.min(1, el.clientWidth / MAP_W);
    const targetY = yOf(currentLevel) * s;
    const offset = el.clientHeight * (isMobile ? 0.55 : 0.5);
    el.scrollTo({ top: Math.max(0, targetY - offset), behavior: "smooth" });
  }, [currentLevel, yOf, isMobile]);

  // visible level range (+ buffer)
  const topUnits = view.top / scale - 400;
  const bottomUnits = (view.top + view.height) / scale + 400;
  const levels: number[] = [];
  for (let L = 1; L <= totalLevels; L++) {
    const y = yOf(L);
    if (y >= topUnits && y <= bottomUnits) levels.push(L);
  }
  if (levels.length === 0) levels.push(Math.max(1, Math.min(totalLevels, currentLevel)));
  const lo = levels[0];
  const hi = levels[levels.length - 1];

  // regions touching the visible range
  const firstRegion = Math.floor((lo - 1) / REGION);
  const lastRegion = Math.floor((hi - 1) / REGION);
  const regions: number[] = [];
  for (let r = firstRegion; r <= lastRegion; r++) regions.push(r);

  const roadPts: [number, number][] = [];
  for (let L = Math.max(1, lo - 1); L <= Math.min(totalLevels, hi + 1); L++) roadPts.push([nodeX(L), yOf(L)]);
  const roadD = smoothPath(roadPts);
  const litPts = roadPts.filter((_, i) => Math.max(1, lo - 1) + i <= currentLevel);
  const litD = litPts.length > 1 ? smoothPath(litPts) : "";

  return (
    <div className="relative w-full h-[100svh] overflow-hidden bg-[#0b0710] text-white">
      <div ref={scrollRef} className="relative z-10 w-full h-[100svh] overflow-y-auto overflow-x-hidden">
        <svg
          width="100%"
          viewBox={`0 0 ${MAP_W} ${svgH}`}
          preserveAspectRatio="xMidYMin meet"
          style={{ height: svgH * scale, display: "block", overflow: "visible" }}
        >
          <MapDefs />

          {/* ---------- region backgrounds ---------- */}
          {regions.map((r) => {
            const first = r * REGION + 1;
            const last = Math.min(totalLevels, first + REGION - 1);
            const season = seasonOfLevel(first);
            const st = SEASON_STYLE[season];
            const yTop = r === lastRegionIdx ? 0 : yOf(last) - HALF;
            const yBot = r === 0 ? svgH : yOf(first) + HALF;
            const h = yBot - yTop;
            const rr = rng(r * 31337 + 7);
            const hills = [0.25, 0.55, 0.85].map((f, k) => {
              const base = yTop + h * f;
              const p: [number, number][] = [[-SIDE, yTop + h]];
              for (let x = -SIDE; x <= MAP_W + SIDE; x += 30) {
                p.push([x, base - 60 * (0.5 + 0.5 * Math.sin(x / 70 + k * 1.9 + r)) * (0.6 + 0.4 * Math.sin(x / 31 + k))]);
              }
              p.push([MAP_W + SIDE, yTop + h]);
              return <polygon key={k} points={pts(p)} fill={st.hill[k]} opacity={season === "winter" ? 0.55 : 0.9} />;
            });
            return (
              <g key={`bg${r}`}>
                <rect x={-SIDE} y={yTop} width={MAP_W + SIDE * 2} height={h} fill={`url(#brmap-sky-${season})`} />
                <circle cx={330} cy={yTop + 120} r={60} fill={st.moon} opacity={0.18} />
                <circle cx={330} cy={yTop + 120} r={26} fill={st.moon} opacity={0.85} />
                <Castle x={40} y={yTop + 170} fill={st.hill[2]} />
                {hills}
                {season === "winter" && <rect x={-SIDE} y={yTop} width={MAP_W + SIDE * 2} height={h} fill="#0e1430" opacity={0.3} />}
                {Array.from({ length: 70 }, (_, i) => (
                  <Ambient key={i} season={season} x={-500 + rr() * (MAP_W + 1000)} y={yTop + rr() * h} r={rr} />
                ))}
              </g>
            );
          })}

          {/* ---------- decorations ---------- */}
          {levels.map((L) => (
            <g key={`dec${L}`}>
              <NodeDecor level={L} x={nodeX(L)} y={yOf(L)} mapW={MAP_W} />
              <SideDecor level={L} y={yOf(L) + 30} mapW={MAP_W} />
            </g>
          ))}

          {/* ---------- road ---------- */}
          <path d={roadD} fill="none" stroke="#0e0912" strokeWidth={40} strokeLinecap="round" opacity={0.5} transform="translate(0 6)" />
          <path d={roadD} fill="none" stroke="#1e1622" strokeWidth={34} strokeLinecap="round" />
          <path d={roadD} fill="none" stroke={SEASON_STYLE[seasonOfLevel(currentLevel)].road} strokeWidth={26} strokeLinecap="round" />
          <path d={roadD} fill="none" stroke="#ffffff" strokeWidth={20} strokeLinecap="round" strokeDasharray="12 8" opacity={0.08} />
          {litD && <path d={litD} fill="none" stroke="#ffcf5a" strokeWidth={5} strokeLinecap="round" strokeDasharray="2 11" filter="url(#brmap-glow)" />}

          {/* ---------- region banners and chests ---------- */}
          {regions.map((r) => {
            const first = r * REGION + 1;
            const last = first + REGION - 1;
            const st = SEASON_STYLE[seasonOfLevel(first)];
            const by = r === 0 ? yOf(first) + 80 : yOf(first) + HALF;
            const chestLevel = last <= totalLevels ? last : 0;
            const cx = chestLevel ? (nodeX(chestLevel) < MAP_W / 2 ? nodeX(chestLevel) + 70 : nodeX(chestLevel) - 70) : 0;
            const cy = chestLevel ? yOf(chestLevel) + 8 : 0;
            return (
              <g key={`ban${r}`}>
                <g transform={`translate(${MAP_W / 2} ${by})`}>
                  <path d="M-110,-18 L110,-18 L98,0 L110,18 L-110,18 L-98,0 Z" fill="#5a0f1e" stroke="url(#brmap-gold)" strokeWidth={3} />
                  <text x={0} y={5} textAnchor="middle" fontFamily="Georgia,serif" fontSize={15} fontWeight={700} fill="#ffe8b0" letterSpacing={1.5}>
                    {st.name}
                  </text>
                  <text x={0} y={34} textAnchor="middle" fontSize={10} fill="#fff" letterSpacing={2} opacity={0.85}>
                    {`${st.label} · LEVELS ${first}–${Math.min(last, totalLevels)}`}
                  </text>
                </g>
                {chestLevel > 0 && (
                  <g transform={`translate(${cx} ${cy})`}>
                    <circle cx={0} cy={-12} r={24} fill="url(#brmap-glowG)" />
                    <rect x={-22} y={-8} width={44} height={26} rx={4} fill="#7a1d2e" stroke="#3a0a14" strokeWidth={2} />
                    <path d="M-22,-4 Q-22,-20 0,-20 Q22,-20 22,-4 Z" fill="#a8243b" stroke="#3a0a14" strokeWidth={2} />
                    <rect x={-5} y={-6} width={10} height={12} rx={2} fill="#ffd34d" stroke="#8a5a00" />
                  </g>
                )}
              </g>
            );
          })}

          {/* ---------- level nodes ---------- */}
          {levels.map((L) => {
            const x = nodeX(L);
            const y = yOf(L);
            const isCurrent = L === currentLevel;
            const isDone = L < currentLevel;
            const isLocked = L > unlockedLevel;
            const stars = levelStars?.[L] ?? 0;
            const click = () => {
              if (!isLocked) onSelectLevel(L);
            };
            if (isCurrent) {
              return (
                <g key={L} onClick={click} style={{ cursor: "pointer" }} role="button" aria-label={`Level ${L}`}>
                  <circle cx={x} cy={y} r={50} fill="url(#brmap-glowG)" />
                  <polygon points={pts(hexa(x, y, 32))} fill="url(#brmap-gold)" stroke="#fff3c4" strokeWidth={3} filter="url(#brmap-glow)" />
                  <polygon points={pts(hexa(x, y, 24))} fill="url(#brmap-ruby)" stroke="#5a0e1a" strokeWidth={2} />
                  <text x={x} y={y + 7} textAnchor="middle" fontWeight={900} fontSize={19} fill="#fff" stroke="#4a0812" strokeWidth={3} paintOrder="stroke">
                    {L}
                  </text>
                  <g className="animate-knight-hover">
                    <image href={knightImg} x={x - (x > MAP_W / 2 ? 90 : -34)} y={y - 40} width={56} height={56} />
                  </g>
                  <g transform={`translate(${x - 27} ${y + 38})`}>
                    <rect x={0} y={-12} width={54} height={22} rx={11} fill="#e8213b" stroke="#ffe08a" strokeWidth={2} />
                    <text x={27} y={4} textAnchor="middle" fontWeight={800} fontSize={11} fill="#fff">
                      PLAY ▶
                    </text>
                  </g>
                </g>
              );
            }
            if (isDone && !isLocked) {
              return (
                <g key={L} onClick={click} style={{ cursor: "pointer" }} role="button" aria-label={`Level ${L}`}>
                  <polygon points={pts(hexa(x + 1, y + 4, 27))} fill="#000" opacity={0.4} />
                  <polygon points={pts(hexa(x, y, 27))} fill="url(#brmap-ruby)" stroke="url(#brmap-gold)" strokeWidth={4} strokeLinejoin="round" />
                  <text x={x} y={y + 6} textAnchor="middle" fontWeight={800} fontSize={16} fill="#fff" stroke="#4a0812" strokeWidth={3} paintOrder="stroke">
                    {L}
                  </text>
                  {stars > 0 &&
                    [0, 1, 2].map((k) => <Star key={k} cx={x + (k - 1) * 15} cy={y - 34 + (k === 1 ? 0 : 4)} r={k === 1 ? 7 : 6} filled={k < stars} />)}
                </g>
              );
            }
            if (!isLocked) {
              // unlocked but not yet played / ahead of the current level
              return (
                <g key={L} onClick={click} style={{ cursor: "pointer" }} role="button" aria-label={`Level ${L}`}>
                  <polygon points={pts(hexa(x, y, 26))} fill="url(#brmap-ruby)" opacity={0.75} stroke="url(#brmap-gold)" strokeWidth={3} />
                  <text x={x} y={y + 5} textAnchor="middle" fontWeight={800} fontSize={15} fill="#fff">
                    {L}
                  </text>
                </g>
              );
            }
            return (
              <g key={L} aria-label={`Level ${L} locked`}>
                <polygon points={pts(hexa(x + 1, y + 4, 24))} fill="#000" opacity={0.4} />
                <polygon points={pts(hexa(x, y, 24))} fill="url(#brmap-stone)" stroke="#6a6278" strokeWidth={3} strokeLinejoin="round" />
                <text x={x} y={y + 5} textAnchor="middle" fontWeight={700} fontSize={14} fill="#a89cb8">
                  {L}
                </text>
                <g transform={`translate(${x + 16} ${y + 14})`}>
                  <rect x={-6} y={-3} width={12} height={9} rx={2} fill="#8a7a9a" />
                  <path d="M-3.5,-3 v-3 a3.5,3.5 0 0 1 7,0 v3" fill="none" stroke="#8a7a9a" strokeWidth={2} />
                </g>
              </g>
            );
          })}
        </svg>
        <div className="h-32" />
      </div>
    </div>
  );
}
