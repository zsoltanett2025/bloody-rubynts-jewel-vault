// src/app/rewards/brRewards.ts
const LS_BAL_PREFIX = "br_balance_v1:";
const LS_REG_BONUS_PREFIX = "br_bonus_reg_v1:";
const LS_LOGIN_DAY_PREFIX = "br_bonus_login_day_v1:";
const LS_LEVEL_REWARD_PREFIX = "br_reward_level_once_v1:";

// ✅ Reward ledger (anti-duplication)
const LS_LEDGER_PREFIX = "br_reward_ledger_v1:";

export function getUserKeyFromStorage(): string {
  try {
    // 1) "full" auth
    const a = localStorage.getItem("br_auth_user");
    if (a) return a;

    const b = localStorage.getItem("br_user");
    if (b) return b;

    // 2) trial auth (JSON: { username, password })
    const t = localStorage.getItem("br_trial_user");
    if (t) {
      const obj = JSON.parse(t);
      const u = String(obj?.username || "").trim();
      if (u) return u;
    }
  } catch {}

  return "guest";
}


export function getBrBalance(userKey: string): number {
  try {
    const raw = localStorage.getItem(LS_BAL_PREFIX + userKey);
    const n = Number(raw ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setBrBalance(userKey: string, amount: number): number {
  const next = Math.max(0, Math.floor(Number(amount) || 0));
  localStorage.setItem(LS_BAL_PREFIX + userKey, String(next));
  return next;
}

export function addBr(userKey: string, amount: number): number {
  const a = Math.floor(Number(amount) || 0);
  if (!userKey || userKey === "guest" || a === 0) return getBrBalance(userKey);
  const cur = getBrBalance(userKey);
  return setBrBalance(userKey, cur + a);
}

// --- Ledger helpers ---
function ledgerKey(userKey: string, eventId: string): string {
  return `${LS_LEDGER_PREFIX}${userKey}:${eventId}`;
}

export function hasRewardEvent(userKey: string, eventId: string): boolean {
  if (!userKey || userKey === "guest") return true;
  try {
    return localStorage.getItem(ledgerKey(userKey, eventId)) === "1";
  } catch {
    return false;
  }
}

export function recordRewardEvent(userKey: string, eventId: string): boolean {
  if (!userKey || userKey === "guest") return false;
  try {
    const k = ledgerKey(userKey, eventId);
    if (localStorage.getItem(k) === "1") return false;
    localStorage.setItem(k, "1");
    return true;
  } catch {
    return false;
  }
}

// --- Bonuses ---
export function grantRegisterBonusOnce(userKey: string, amount = 25): boolean {
  if (!userKey || userKey === "guest") return false;
  const key = LS_REG_BONUS_PREFIX + userKey;
  if (localStorage.getItem(key) === "1") return false;
  localStorage.setItem(key, "1");
  addBr(userKey, amount);

  // ledger marker (extra safety)
  recordRewardEvent(userKey, `register:${userKey}`);

  return true;
}

function todayKey(): string {
  // UTC nap kulcs (stabil)
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function grantDailyLoginBonus(userKey: string, amount = 1): boolean {
  if (!userKey || userKey === "guest") return false;
  const key = LS_LOGIN_DAY_PREFIX + userKey;
  const today = todayKey();
  const last = localStorage.getItem(key);
  if (last === today) return false;

  // ledger safety (same day)
  const eventId = `daily:${today}:${userKey}`;
  if (!recordRewardEvent(userKey, eventId)) return false;

  localStorage.setItem(key, today);
  addBr(userKey, amount);
  return true;
}

// --- Level rewards (once) ---
export function rewardLevelOnce(
  userKey: string,
  rewardId: number | string,
  amount: number,
  reason?: string
): boolean {
  if (!userKey || userKey === "guest") return false;

  // legacy once-key (kept for backward compatibility)
  const key = `${LS_LEVEL_REWARD_PREFIX}${userKey}:${String(rewardId)}`;
  if (localStorage.getItem(key) === "1") return false;

  // ledger safety (new)
  const eventId = `level:${String(rewardId)}:${userKey}`;
  if (!recordRewardEvent(userKey, eventId)) return false;

  localStorage.setItem(key, "1");
  addBr(userKey, amount);
  // reason-t most nem tároljuk, később lehet log
  void reason;
  return true;
}

// --- Chest rewards (seeded + once per chest) ---
function hash32(str: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seededChestAmount(userKey: string, level: number, chestIndex: number): number {
  const seed = `${userKey}|${level}|${chestIndex}|br_chest_v1`;
  const h = hash32(seed);
  // 5..25
  return 5 + (h % 21);
}

/**
 * Grant a chest reward ONCE for a specific chest.
 * - amount is deterministic (seeded) for stability
 * - uses ledger to prevent duplicates
 */
export function grantChestReward(
  userKey: string,
  level: number,
  chestIndex: number
): { granted: boolean; amount: number } {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const safeIndex = Math.max(1, Math.floor(Number(chestIndex) || 1));

  const amount = seededChestAmount(userKey, safeLevel, safeIndex);

  if (!userKey || userKey === "guest") {
    return { granted: false, amount };
  }

  const eventId = `chest:${safeLevel}:${safeIndex}:${userKey}`;
  if (!recordRewardEvent(userKey, eventId)) {
    return { granted: false, amount };
  }

  addBr(userKey, amount);
  return { granted: true, amount };
}

// --- Hard level rule ---
export function isHardLevel67(level: number): boolean {
  // “minden 67 pálya” = 67, 134, 201...
  return level > 0 && level % 67 === 0;
}

export function spendBr(userKey: string, amount: number): boolean {
  const a = Math.floor(Number(amount) || 0);
  if (!userKey || userKey === "guest") return false;
  if (a <= 0) return true;

  const cur = getBrBalance(userKey);
  if (cur < a) return false;

  setBrBalance(userKey, cur - a);
  return true;
}