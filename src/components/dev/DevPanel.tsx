// src/components/dev/DevPanel.tsx
import { useEffect, useMemo, useState } from "react";

function isAdminEnabled() {
  try {
    const keys = ["admin", "br_admin", "bradmin_1", "br_admin_1", "bradmin"];
    for (const k of keys) {
      const v = localStorage.getItem(k);
      if (v === "1") return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function DevPanel(props: {
  currentLevel: number;
  unlockedLevel: number;

  setCurrentLevel: (n: number) => void;
  setUnlockedLevel: (n: number) => void;

  onStartLevel?: (n: number) => void;
}) {
  const isDev = Boolean((import.meta as any)?.env?.DEV);
  const [admin, setAdmin] = useState(false);

  // DEV-ben mindig látszódhat, PROD-ban csak admin kulccsal
  useEffect(() => {
    const refresh = () => setAdmin(isAdminEnabled());
    refresh();
    const id = window.setInterval(refresh, 800);
    return () => window.clearInterval(id);
  }, []);

  const show = isDev || admin;

  // debug (ha kell)
  // console.log("DevPanel render", props.currentLevel, props.unlockedLevel, "isDev=", isDev, "admin=", admin, "show=", show);

  const [val, setVal] = useState<string>("");
  const target = useMemo(() => {
    const n = Math.floor(Number(val) || 0);
    return Number.isFinite(n) ? n : 0;
  }, [val]);

  if (!show) return null;

  const clamp = (n: number) => Math.max(1, Math.min(1000, Math.floor(n || 1)));

  const jump = (n: number, start: boolean) => {
    const L = clamp(n);
    props.setUnlockedLevel(Math.max(clamp(props.unlockedLevel), L));
    props.setCurrentLevel(L);
    if (start) props.onStartLevel?.(L);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-3 text-white w-[240px] shadow-lg">
      <div className="text-xs font-semibold text-white/80 mb-2">FEJLESZTŐI PANEL</div>

      <div className="text-[11px] text-white/60">
        Jelenlegi: <span className="text-white/90 font-semibold">{props.currentLevel}</span>{" "}
        | Feloldva: <span className="text-white/90 font-semibold">{props.unlockedLevel}</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Szint (1-1000)"
          className="w-full px-2 py-2 rounded-xl bg-white/10 border border-white/10 text-sm outline-none"
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => jump(target || props.currentLevel, false)}
          className="py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
        >
          Ugrás
        </button>

        <button
          type="button"
          onClick={() => jump(target || props.currentLevel, true)}
          className="py-2 rounded-xl bg-red-700/70 hover:bg-red-700 border border-red-900/30 text-xs"
        >
          Ugrálj és játssz
        </button>

        <button
          type="button"
          onClick={() => jump(props.currentLevel - 1, true)}
          className="py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
        >
          ◀ Előző
        </button>

        <button
          type="button"
          onClick={() => jump(props.currentLevel + 1, true)}
          className="py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs"
        >
          Következő ▶
        </button>
      </div>

      <button
        type="button"
        className="mt-2 w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 py-2 text-sm"
        onClick={() => jump(target || props.currentLevel, false)}
      >
        Ugrás (térkép)
      </button>

      <button
        type="button"
        className="mt-2 w-full rounded-lg bg-red-700/70 hover:bg-red-700 border border-red-900/40 py-2 text-sm font-semibold"
        onClick={() => jump(target || props.currentLevel, true)}
      >
        Kezdő szint
      </button>

      <button
        type="button"
        className="mt-2 w-full rounded-lg bg-black/40 hover:bg-black/55 border border-white/10 py-2 text-sm"
        onClick={() => props.setUnlockedLevel(1000)}
      >
        Feloldás 1000 szintig (fejlesztői szint)
      </button>

      <div className="mt-2 text-[10px] text-white/45">
        Tipp: Konzol → localStorage.setItem("admin","1"); location.reload()
      </div>
    </div>
  );
}