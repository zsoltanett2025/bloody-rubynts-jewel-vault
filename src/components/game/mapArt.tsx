/**
 * BR-JV-MAP: vector art for the season level map (concept BR-JV-MAP-2026-11-21 v1.1, approved 2026-11-21).
 * Seasons change every 20 levels: spring → summer → autumn → winter → spring …
 */
import React from "react";

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: SeasonKey[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_STYLE: Record<
  SeasonKey,
  { name: string; label: string; sky: [string, string, string]; hill: [string, string, string]; tree: string; rim: string; road: string; moon: string }
> = {
  spring: { name: "BLOSSOM VALE", label: "SPRING", sky: ["#2b1d52", "#5a2a6e", "#3a1a4a"], hill: ["#3e2a66", "#4a2f6e", "#3a2560"], tree: "#1f1838", rim: "#ff9fd0", road: "#463a52", moon: "#ffe9f4" },
  summer: { name: "EMBER MEADOWS", label: "SUMMER", sky: ["#2a1440", "#7a2a4a", "#c2553a"], hill: ["#4a1d3a", "#5a2238", "#3e1830"], tree: "#1e0e1e", rim: "#ffb347", road: "#4a3440", moon: "#ffd27a" },
  autumn: { name: "HOLLOW WOODS", label: "AUTUMN", sky: ["#1e1022", "#4a1a1a", "#7a2e14"], hill: ["#3a1a14", "#4a2216", "#30140e"], tree: "#1a0c08", rim: "#ff7a2a", road: "#43302a", moon: "#ffc070" },
  winter: { name: "FROSTFANG PEAKS", label: "WINTER", sky: ["#0e1430", "#22305a", "#3a4a78"], hill: ["#8e9cc0", "#7a89b0", "#a2b0d2"], tree: "#122038", rim: "#e8f4ff", road: "#5a6680", moon: "#eef6ff" },
};

export function seasonOfLevel(level: number): SeasonKey {
  return SEASONS[Math.floor((Math.max(1, level) - 1) / 20) % 4];
}

/** Small deterministic random generator (same picture every time). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

export function hexa(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 6 }, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export function smoothPath(ps: [number, number][]) {
  if (ps.length === 0) return "";
  let d = `M${ps[0][0].toFixed(1)},${ps[0][1].toFixed(1)}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = i > 0 ? ps[i - 1] : ps[i];
    const p1 = ps[i];
    const p2 = ps[i + 1];
    const p3 = i + 2 < ps.length ? ps[i + 2] : p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function MapDefs() {
  return (
    <defs>
      {SEASONS.map((k) => (
        <linearGradient key={k} id={`brmap-sky-${k}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SEASON_STYLE[k].sky[0]} />
          <stop offset="0.6" stopColor={SEASON_STYLE[k].sky[1]} />
          <stop offset="1" stopColor={SEASON_STYLE[k].sky[2]} />
        </linearGradient>
      ))}
      <radialGradient id="brmap-glowR">
        <stop offset="0" stopColor="#ff3355" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ff3355" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="brmap-glowG">
        <stop offset="0" stopColor="#ffcf5a" stopOpacity="0.6" />
        <stop offset="1" stopColor="#ffcf5a" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="brmap-glowI">
        <stop offset="0" stopColor="#9fe8ff" stopOpacity="0.65" />
        <stop offset="1" stopColor="#9fe8ff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="brmap-ruby" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ff8a9b" />
        <stop offset="0.5" stopColor="#e8213b" />
        <stop offset="1" stopColor="#7a0d1d" />
      </linearGradient>
      <linearGradient id="brmap-ice" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.5" stopColor="#9fe0ff" />
        <stop offset="1" stopColor="#3a7ab8" />
      </linearGradient>
      <linearGradient id="brmap-stone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a4258" />
        <stop offset="1" stopColor="#1c1724" />
      </linearGradient>
      <linearGradient id="brmap-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe08a" />
        <stop offset="0.5" stopColor="#d9a63a" />
        <stop offset="1" stopColor="#8a5a00" />
      </linearGradient>
      <filter id="brmap-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/* ---------- decoration sprites ---------- */

export function Pine({ x, y, h, col, rim, snow }: { x: number; y: number; h: number; col: string; rim: string; snow?: boolean }) {
  const w = h * 0.45;
  return (
    <g>
      <rect x={x - 2.5} y={y - 6} width={5} height={9} fill="#2a1810" />
      {[0, 1, 2].map((k) => {
        const yy = y - 6 - k * h * 0.28;
        const ww = w * (1 - k * 0.25);
        return (
          <g key={k}>
            <polygon points={pts([[x - ww, yy], [x, yy - h * 0.45], [x + ww, yy]])} fill={col} stroke={rim} strokeWidth={1.3} strokeLinejoin="round" />
            {snow && (
              <polygon
                points={pts([[x - ww * 0.45, yy - h * 0.24], [x, yy - h * 0.45], [x + ww * 0.45, yy - h * 0.24], [x + ww * 0.2, yy - h * 0.2], [x, yy - h * 0.26], [x - ww * 0.2, yy - h * 0.2]])}
                fill="#f4f9ff"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export function RoundTree({ x, y, h, leaf, dots, seed }: { x: number; y: number; h: number; leaf: string; dots?: string; seed: number }) {
  const r = rng(seed);
  return (
    <g>
      <path d={`M${x - 3},${y} L${x - 2},${y - h * 0.45} L${x + 2},${y - h * 0.45} L${x + 3},${y} Z`} fill="#3a2418" />
      {[[-h * 0.2, -h * 0.55, h * 0.24], [h * 0.2, -h * 0.55, h * 0.24], [0, -h * 0.75, h * 0.28]].map(([dx, dy, rr], i) => (
        <circle key={i} cx={x + dx} cy={y + dy} r={rr} fill={leaf} stroke="rgba(0,0,0,0.33)" strokeWidth={1} />
      ))}
      {dots &&
        Array.from({ length: 9 }, (_, i) => (
          <circle key={`d${i}`} cx={x + (r() * 0.7 - 0.35) * h} cy={y - h * (0.45 + r() * 0.5)} r={1.5 + r() * 1.5} fill={dots} />
        ))}
    </g>
  );
}

export function Crystals({ x, y, s = 1, ice }: { x: number; y: number; s?: number; ice?: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y - 12 * s} r={26 * s} fill={ice ? "url(#brmap-glowI)" : "url(#brmap-glowR)"} />
      {[[-8, 26, 7], [0, 36, 9], [9, 22, 7]].map(([dx, h, w], i) => {
        const X = x + dx * s;
        const H = h * s;
        const Wd = w * s;
        return (
          <g key={i}>
            <polygon
              points={pts([[X - Wd, y], [X - Wd * 0.8, y - H * 0.75], [X, y - H], [X + Wd * 0.8, y - H * 0.75], [X + Wd, y]])}
              fill={ice ? "url(#brmap-ice)" : "url(#brmap-ruby)"}
              stroke="#2a0810"
              strokeWidth={1.2}
            />
            <polygon points={pts([[X - Wd * 0.3, y - H * 0.7], [X, y - H * 0.95], [X + Wd * 0.2, y - H * 0.7]])} fill="#fff" opacity={0.55} />
          </g>
        );
      })}
    </g>
  );
}

export function Lantern({ x, y, col = "#ffcf5a" }: { x: number; y: number; col?: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 30} r={24} fill="url(#brmap-glowG)" />
      <rect x={x - 1.5} y={y - 22} width={3} height={22} fill="#2a1a10" />
      <rect x={x - 7} y={y - 38} width={14} height={16} rx={3} fill={col} stroke="#3a2210" strokeWidth={2} filter="url(#brmap-glow)" />
      <path d={`M${x - 8},${y - 38} h16 l-3,-5 h-10 z`} fill="#3a2210" />
    </g>
  );
}

export function Flower({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <g>
      <path d={`M${x},${y} v-9`} stroke="#2f6a3a" strokeWidth={1.5} />
      {[0, 1.26, 2.5, 3.77, 5.03].map((a, i) => (
        <circle key={i} cx={x + 3 * Math.cos(a)} cy={y - 10 + 3 * Math.sin(a)} r={2.2} fill={c} />
      ))}
      <circle cx={x} cy={y - 10} r={1.6} fill="#ffe08a" />
    </g>
  );
}

export function Grass({ x, y, c }: { x: number; y: number; c: string }) {
  return <path d={`M${x - 6},${y} q2,-8 3,-12 q1,6 2,12 q2,-10 4,-14 q1,8 1,14 q2,-6 4,-9 q0,5 -1,9 z`} fill={c} />;
}

export function Rock({ x, y, c, snow }: { x: number; y: number; c: string; snow?: boolean }) {
  return (
    <g>
      <path d={`M${x - 12},${y} q2,-12 10,-13 q9,0 13,13 z`} fill={c} stroke="#14101a" strokeWidth={1.5} />
      {snow && <path d={`M${x - 8},${y - 9} q8,-7 16,-1 q-8,-2 -16,1 z`} fill="#f4f9ff" />}
    </g>
  );
}

export function Pumpkin({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y - 10} r={16} fill="url(#brmap-glowG)" />
      <ellipse cx={x} cy={y - 7} rx={10} ry={7.5} fill="#e8721e" stroke="#7a3008" strokeWidth={1.5} />
      <path d={`M${x},${y - 14} v14 M${x - 5},${y - 13} q-2,6 0,12 M${x + 5},${y - 13} q2,6 0,12`} stroke="#a84a10" fill="none" />
      <rect x={x - 1.5} y={y - 18} width={3} height={5} fill="#3a5a20" />
    </g>
  );
}

export function Butterfly({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={-4} cy={0} rx={4} ry={3} fill={c} transform="rotate(-25)" />
      <ellipse cx={4} cy={0} rx={4} ry={3} fill={c} transform="rotate(25)" />
      <rect x={-0.6} y={-3} width={1.2} height={6} fill="#2a1a10" />
    </g>
  );
}

export function Bird({ x, y }: { x: number; y: number }) {
  return <path d={`M${x - 8},${y} q4,-5 8,0 q4,-5 8,0`} fill="none" stroke="#1a0f20" strokeWidth={1.8} />;
}

export function Castle({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g>
      <g fill={fill} opacity={0.85}>
        <rect x={x} y={y + 32} width={60} height={50} />
        <rect x={x - 10} y={y + 7} width={16} height={75} />
        <rect x={x + 52} y={y} width={16} height={82} />
        <polygon points={pts([[x - 10, y + 7], [x - 2, y - 10], [x + 6, y + 7]])} />
        <polygon points={pts([[x + 52, y], [x + 60, y - 20], [x + 68, y]])} />
      </g>
      <rect x={x + 57} y={y + 17} width={4} height={7} fill="#ffb347" opacity={0.9} />
    </g>
  );
}

export function Ambient({ season, x, y, r }: { season: SeasonKey; x: number; y: number; r: () => number }) {
  if (season === "spring") return <ellipse cx={x} cy={y} rx={3} ry={1.8} fill="#ffc2e0" opacity={0.85} transform={`rotate(${Math.floor(r() * 180)} ${x} ${y})`} />;
  if (season === "summer") return <circle cx={x} cy={y} r={2} fill="#ffe08a" filter="url(#brmap-glow)" />;
  if (season === "autumn") {
    const cols = ["#ff7a2a", "#e8452a", "#ffb347"];
    return <path d={`M${x},${y} q4,-4 8,0 q-4,4 -8,0 z`} fill={cols[Math.floor(r() * 3)]} opacity={0.9} transform={`rotate(${Math.floor(r() * 360)} ${x + 4} ${y})`} />;
  }
  return <circle cx={x} cy={y} r={1.2 + r() * 1.4} fill="#ffffff" opacity={0.9} />;
}

/** One main decoration plus one or two small ones next to a level node. */
export function NodeDecor({ level, x, y, mapW }: { level: number; x: number; y: number; mapW: number }) {
  const season = seasonOfLevel(level);
  const st = SEASON_STYLE[season];
  const r = rng(level * 7919 + 17);
  const side = x > mapW / 2 ? -1 : 1;
  const dx = Math.max(30, Math.min(mapW - 30, x + side * (80 + r() * 40)));
  const i = level % 4;
  const items: React.ReactNode[] = [];
  if (season === "spring") {
    items.push(
      [<RoundTree key="m" x={dx} y={y + 34} h={70} leaf="#d85a9a" dots="#ffd0ea" seed={level} />, <Flower key="m" x={dx} y={y + 30} c="#ff9fd0" />, <Crystals key="m" x={dx} y={y + 30} s={0.8} />, <Lantern key="m" x={dx} y={y + 30} />][i]
    );
    items.push(<Flower key="a" x={x - side * 48} y={y + 38} c="#ffd0ea" />, <Grass key="b" x={dx + side * 26} y={y + 40} c="#3d7a4a" />);
    if (level % 2 === 0) items.push(<Butterfly key="c" x={dx - side * 20} y={y - 30} c="#ffb3e0" />);
  } else if (season === "summer") {
    items.push(
      [<RoundTree key="m" x={dx} y={y + 34} h={72} leaf="#2f6a3a" dots="#ffe08a" seed={level} />, <Lantern key="m" x={dx} y={y + 30} />, <Crystals key="m" x={dx} y={y + 30} s={0.9} />, <Pine key="m" x={dx} y={y + 34} h={70} col={st.tree} rim={st.rim} />][i]
    );
    items.push(<Grass key="a" x={x - side * 50} y={y + 38} c="#3d6a2a" />, <Grass key="b" x={dx + side * 24} y={y + 40} c="#4a7a2a" />);
    if (level % 3 === 0) items.push(<Bird key="c" x={dx} y={y - 50} />);
  } else if (season === "autumn") {
    items.push(
      [<RoundTree key="m" x={dx} y={y + 34} h={72} leaf="#c2451e" dots="#ffb347" seed={level} />, <Pumpkin key="m" x={dx} y={y + 30} />, <RoundTree key="m" x={dx} y={y + 34} h={64} leaf="#e88a1e" seed={level} />, <Crystals key="m" x={dx} y={y + 30} s={0.85} />][i]
    );
    items.push(<Rock key="a" x={x - side * 52} y={y + 40} c="#3a2a24" />);
    items.push(level % 3 === 1 ? <Pumpkin key="b" x={dx + side * 28} y={y + 36} /> : <Grass key="b" x={dx + side * 26} y={y + 40} c="#7a5a20" />);
  } else {
    items.push(
      [<Pine key="m" x={dx} y={y + 34} h={74} col={st.tree} rim={st.rim} snow />, <Crystals key="m" x={dx} y={y + 30} s={0.9} ice />, <Pine key="m" x={dx} y={y + 34} h={60} col={st.tree} rim={st.rim} snow />, <Lantern key="m" x={dx} y={y + 30} col="#9fe8ff" />][i]
    );
    items.push(<Rock key="a" x={x - side * 52} y={y + 40} c="#4a5068" snow />);
  }
  return <g>{items}</g>;
}

/** Wide-screen side scenery (outside the 420-wide map column). */
export function SideDecor({ level, y, mapW }: { level: number; y: number; mapW: number }) {
  if (level % 2 !== 0) return null;
  const season = seasonOfLevel(level);
  const st = SEASON_STYLE[season];
  const r = rng(level * 104729 + 3);
  const left = level % 4 === 0;
  const x = left ? -60 - r() * 260 : mapW + 60 + r() * 260;
  if (season === "winter") return <Pine x={x} y={y} h={70 + r() * 40} col={st.tree} rim={st.rim} snow />;
  if (season === "spring") return level % 6 === 0 ? <Crystals x={x} y={y} s={1.1} /> : <RoundTree x={x} y={y} h={80 + r() * 30} leaf="#d85a9a" dots="#ffd0ea" seed={level} />;
  if (season === "summer") return level % 6 === 0 ? <Lantern x={x} y={y} /> : <RoundTree x={x} y={y} h={80 + r() * 30} leaf="#2f6a3a" dots="#ffe08a" seed={level} />;
  return level % 6 === 0 ? <Pumpkin x={x} y={y} /> : <RoundTree x={x} y={y} h={80 + r() * 30} leaf="#c2451e" dots="#ffb347" seed={level} />;
}
