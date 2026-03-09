import { useEffect, useMemo, useState } from "react";
import { t } from "../../i8n/i18n";

export type DailyReward =
  | { type: "br"; amount: number }
  | { type: "bomb"; amount: number }
  | { type: "moves"; amount: number }
  | { type: "infinite_life"; minutes: number }
  | { type: "striped"; amount: number }
  | { type: "rainbow"; amount: number }
  | { type: "br_chest"; amount: number };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function todayKeyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, val: string) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (!Number.isFinite(dt.getTime())) return null;
  return dt;
}

function diffDaysLocal(aKey: string, bKey: string): number | null {
  const a = parseDateKey(aKey);
  const b = parseDateKey(bKey);
  if (!a || !b) return null;

  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

  return Math.round((bb - aa) / 86400000);
}

function cycleDay(streak: number): number {
  const s = Math.max(1, Math.floor(streak || 1));
  return ((s - 1) % 7) + 1;
}

function getRewardForDay(day: number): DailyReward {
  switch (day) {
    case 1:
      return { type: "br", amount: 1 };
    case 2:
      return { type: "bomb", amount: 1 };
    case 3:
      return { type: "moves", amount: 1 };
    case 4:
      return { type: "br", amount: 2 };
    case 5:
      return { type: "striped", amount: 1 };
    case 6:
      return { type: "rainbow", amount: 1 };
    case 7:
    default:
      return { type: "br_chest", amount: 5 + Math.floor(Math.random() * 11) }; // 5..15 BR
  }
}

function rewardLabel(day: number): string {
  switch (day) {
    case 1:
      return "+1 BR";
    case 2:
      return "+1 Bomb";
    case 3:
      return "+5 Moves";
    case 4:
      return "+2 BR";
    case 5:
      return "+1 Striped";
    case 6:
      return "+1 Rainbow";
    case 7:
    default:
      return "BR Chest";
  }
}

function rewardText(r: DailyReward): string {
  switch (r.type) {
    case "br":
      return `+${r.amount} BR`;
    case "bomb":
      return `+${r.amount} Bomb`;
    case "moves":
      return `+${r.amount} +5 Moves`;
    case "infinite_life":
      return `∞ Life ${r.minutes} min`;
    case "striped":
      return `+${r.amount} Striped`;
    case "rainbow":
      return `+${r.amount} Rainbow`;
    case "br_chest":
      return `BR Chest +${r.amount} BR`;
    default:
      return "+ Reward";
  }
}

function rewardEmoji(day: number): string {
  switch (day) {
    case 1:
      return "🩸";
    case 2:
      return "💣";
    case 3:
      return "➕";
    case 4:
      return "🩸";
    case 5:
      return "⚡";
    case 6:
      return "🌈";
    case 7:
    default:
      return "🧰";
  }
}

export function DailyChestModal(props: {
  userKey: string;
  onClose: () => void;
  onClaim?: (reward: DailyReward) => void;
  chestClosedSrc?: string;
  chestOpenSrc?: string;
  force?: boolean;
}) {
  const userKey = (props.userKey || "").trim();

  const lastClaimKey = useMemo(
    () => `br_daily_last_claim_v2:${userKey || "guest"}`,
    [userKey]
  );
  const streakKey = useMemo(
    () => `br_daily_streak_v2:${userKey || "guest"}`,
    [userKey]
  );

  const chestClosed =
    props.chestClosedSrc ||
    `${import.meta.env.BASE_URL}assets/ui/ruby_chest_closed.png`;
  const chestOpen =
    props.chestOpenSrc ||
    `${import.meta.env.BASE_URL}assets/ui/ruby_chest_open.png`;

  const [phase, setPhase] = useState<
    "idle" | "shuffling" | "choose" | "reveal" | "claimed"
  >("idle");

  const [shuffleRound, setShuffleRound] = useState(0);
  const [order, setOrder] = useState<number[]>([0, 1, 2]);

  const [picked, setPicked] = useState<number | null>(null);
  const [reward, setReward] = useState<DailyReward | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  const [displayDay, setDisplayDay] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);

  function readState() {
    const last = safeGet(lastClaimKey) || "";
    const streakRaw = Number(safeGet(streakKey) || 0);
    const streak = Number.isFinite(streakRaw) ? Math.max(0, Math.floor(streakRaw)) : 0;
    const today = todayKeyLocal();

    const diff = last ? diffDaysLocal(last, today) : null;
    const claimedToday = last === today;

    let nextStreak = 1;
    if (claimedToday) {
      nextStreak = Math.max(1, streak || 1);
    } else if (diff === 1) {
      nextStreak = Math.max(1, streak + 1);
    } else {
      nextStreak = 1;
    }

    return {
      last,
      streak,
      claimedToday,
      previewDay: cycleDay(nextStreak),
    };
  }

  useEffect(() => {
    const s = readState();

    setAlreadyClaimed(s.claimedToday);
    setCurrentStreak(s.streak);
    setDisplayDay(s.previewDay);

    if (s.claimedToday && !props.force) {
      setPhase("claimed");
    } else {
      setPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClaimKey, streakKey]);

  async function startShuffle() {
    setError(null);
    setPicked(null);
    setReward(null);

    const s = readState();
    setDisplayDay(s.previewDay);

    setPhase("shuffling");

    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 190));
      setOrder((prev) => {
        const a = [...prev];
        const i1 = Math.floor(Math.random() * 3);
        let i2 = Math.floor(Math.random() * 3);
        if (i2 === i1) i2 = (i2 + 1) % 3;
        const tmp = a[i1];
        a[i1] = a[i2];
        a[i2] = tmp;
        return a;
      });
      setShuffleRound((x) => x + 1);
    }

    await new Promise((r) => setTimeout(r, 180));
    setPhase("choose");
  }

  function canClaimToday(): boolean {
    if (props.force) return true;
    const s = readState();
    return !s.claimedToday;
  }

  function handlePick(slotIndex: number) {
    setError(null);

    if (phase !== "choose") return;

    if (!userKey || userKey === "guest") {
      setError(t("Please login to claim the daily reward.") || "Please login first.");
      return;
    }

    if (!canClaimToday()) {
      setPhase("claimed");
      setAlreadyClaimed(true);
      return;
    }

    setPicked(slotIndex);

    const s = readState();
    const r = getRewardForDay(s.previewDay);
    setReward(r);
    setDisplayDay(s.previewDay);
    setPhase("reveal");
  }

  function claimNow() {
    setError(null);
    if (!reward) return;

    if (!userKey || userKey === "guest") {
      setError(t("Please login to claim the daily reward.") || "Please login first.");
      return;
    }

    const today = todayKeyLocal();
    const last = safeGet(lastClaimKey) || "";
    const streakRaw = Number(safeGet(streakKey) || 0);
    const streak = Number.isFinite(streakRaw) ? Math.max(0, Math.floor(streakRaw)) : 0;

    if (!props.force && last === today) {
      setPhase("claimed");
      setAlreadyClaimed(true);
      return;
    }

    const diff = last ? diffDaysLocal(last, today) : null;
    const nextStreak = diff === 1 ? streak + 1 : 1;

    safeSet(lastClaimKey, today);
    safeSet(streakKey, String(nextStreak));

    setCurrentStreak(nextStreak);
    setDisplayDay(cycleDay(nextStreak));
    setAlreadyClaimed(true);

    try {
      props.onClaim?.(reward);
    } catch {}

    setPhase("claimed");
  }

  const title = t("Daily Reward") || "Daily Reward";

  const subtitle =
    phase === "claimed" && alreadyClaimed && !props.force
      ? (t("Already claimed today. Come back tomorrow!") ||
          "Already claimed today. Come back tomorrow!")
      : (t("Pick 1 chest!") || "Pick 1 chest!");

  return (
    <div className="fixed inset-0 z-[20000] bg-black/70 flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            <div className="text-xs text-white/60 mt-0.5">{subtitle}</div>
            <div className="text-xs text-red-200/80 mt-1">
              Streak: {currentStreak} • Today: Day {displayDay}/7
            </div>
          </div>

          <button
            type="button"
            onClick={props.onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 transition"
          >
            {t("Close") || "Close"}
          </button>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-200 bg-red-950/30 border border-red-900/40 rounded-xl p-2">
            {error}
          </div>
        )}

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs uppercase tracking-[0.18em] text-white/55 mb-3">
            7 Day Reward Track
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
              const active = day === displayDay;
              const isChestDay = day === 7;
              return (
                <div
                  key={day}
                  className={[
                    "rounded-xl border px-2 py-2 text-center transition-all",
                    active && isChestDay
                      ? "border-yellow-400/60 bg-yellow-500/10 scale-[1.03] shadow-[0_0_18px_rgba(250,204,21,0.18)]"
                      : active
                        ? "border-red-500/50 bg-red-900/25 scale-[1.02]"
                        : isChestDay
                          ? "border-yellow-500/20 bg-yellow-500/5"
                          : "border-white/10 bg-black/20",
                  ].join(" ")}
                >
                  <div className="text-[10px] text-white/50">Day {day}</div>
                  <div className="mt-1 text-lg leading-none">{rewardEmoji(day)}</div>
                  <div
                    className={[
                      "mt-1 text-[11px] font-semibold leading-tight",
                      isChestDay ? "text-yellow-200" : "text-white/85",
                    ].join(" ")}
                  >
                    {rewardLabel(day)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-2">
          {phase === "idle" && (
            <div className="flex flex-col gap-3">
              <div className="text-sm text-white/80">
                {t("You have 3 chests. We shuffle, you pick one.") ||
                  "You have 3 chests. We shuffle, you pick one."}
              </div>
              <button
                type="button"
                onClick={startShuffle}
                className="w-full py-3 rounded-xl bg-red-700/80 hover:bg-red-700 transition font-semibold"
              >
                {t("Shuffle") || "Shuffle"}
              </button>
            </div>
          )}

          {phase === "shuffling" && (
            <div className="text-sm text-white/80">
              {t("Shuffling...") || "Shuffling..."} ({shuffleRound})
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-3">
            {order.map((slot, pos) => {
              const isPicked = picked === slot;
              const isOpen = phase === "reveal" || phase === "claimed";
              const img = isOpen && isPicked ? chestOpen : chestClosed;
              const canClick = phase === "choose";
              const chestGlow = displayDay === 7 && isPicked;

              return (
                <button
                  key={`${slot}-${pos}`}
                  type="button"
                  disabled={!canClick}
                  onClick={() => handlePick(slot)}
                  className={[
                    "rounded-2xl border border-white/10 bg-white/5 p-2 transition",
                    canClick ? "hover:bg-white/10" : "opacity-90",
                    phase === "shuffling" ? "animate-pulse" : "",
                    isPicked ? "ring-2 ring-red-600/70" : "",
                    chestGlow ? "shadow-[0_0_20px_rgba(250,204,21,0.22)]" : "",
                  ].join(" ")}
                  style={{
                    transform:
                      phase === "shuffling"
                        ? `translateX(${(pos - 1) * 2}px)`
                        : "none",
                  }}
                >
                  <div className="w-full aspect-square flex items-center justify-center">
                    <img
                      src={img}
                      alt="chest"
                      className={[
                        "max-h-[92px] w-auto select-none pointer-events-none drop-shadow transition-transform",
                        displayDay === 7 ? "scale-105" : "",
                      ].join(" ")}
                      draggable={false}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  <div
                    className={[
                      "text-[11px] mt-1",
                      displayDay === 7 ? "text-yellow-200/90" : "text-white/60",
                    ].join(" ")}
                  >
                    {phase === "choose"
                      ? (t("Pick") || "Pick")
                      : isPicked && reward
                        ? rewardText(reward)
                        : "\u00A0"}
                  </div>
                </button>
              );
            })}
          </div>

          {phase === "choose" && (
            <div className="mt-3 text-xs text-white/50">
              {displayDay === 7
                ? "Chest day! Today's reward is the weekly BR chest."
                : t("All 3 chests give the same reward. It's about the vibe 😄") ||
                  "All 3 chests give the same reward. It's about the vibe 😄"}
            </div>
          )}

          {phase === "reveal" && reward && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="text-sm text-white/85">
                {t("Your reward:") || "Your reward:"}{" "}
                <span className={displayDay === 7 ? "font-bold text-yellow-200" : "font-bold"}>
                  {rewardText(reward)}
                </span>
              </div>

              <button
                type="button"
                onClick={claimNow}
                className={[
                  "w-full py-3 rounded-xl transition font-semibold",
                  displayDay === 7
                    ? "bg-yellow-600/80 hover:bg-yellow-500 text-black"
                    : "bg-red-700/80 hover:bg-red-700 text-white",
                ].join(" ")}
              >
                {displayDay === 7 ? "Claim Weekly Chest" : t("Claim") || "Claim"}
              </button>
            </div>
          )}

          {phase === "claimed" && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="text-sm text-white/85">
                {alreadyClaimed && !props.force
                  ? (t("Done for today! Come back tomorrow.") ||
                      "Done for today! Come back tomorrow.")
                  : (t("Done!") || "Done!")}
              </div>

              <button
                type="button"
                onClick={props.onClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 transition font-semibold"
              >
                {t("OK") || "OK"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}