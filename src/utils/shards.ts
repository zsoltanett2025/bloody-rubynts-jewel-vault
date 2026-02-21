const LS_SHARDS = "br_shards_found_v1";

// ✅ shard (nehéz) pályák – később bővítjük/generáljuk
export const SHARD_LEVELS: number[] = [10, 25, 40, 60, 80, 100];

export function isShardLevel(level: number) {
  return SHARD_LEVELS.includes(level);
}

export type ShardConfig = {
  mode: "timed";
  timeLimitSec: number; // 60..180
  moveLimit: number; // 25..45
};

export function getShardConfig(level: number): ShardConfig | null {
  if (!isShardLevel(level)) return null;

  // ✅ fokozatos nehezítés shard pályáknál
  // korai shard: több idő + több lépés, későbbi shard: kevesebb
  if (level <= 25) return { mode: "timed", timeLimitSec: 180, moveLimit: 45 };
  if (level <= 60) return { mode: "timed", timeLimitSec: 75, moveLimit: 28 };
  return { mode: "timed", timeLimitSec: 60, moveLimit: 25 };
}

export function loadFoundShards(): Record<number, boolean> {
  try {
    const raw = localStorage.getItem(LS_SHARDS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFoundShards(map: Record<number, boolean>) {
  localStorage.setItem(LS_SHARDS, JSON.stringify(map));
}

export function markShardFound(level: number) {
  const found = loadFoundShards();
  found[level] = true;
  saveFoundShards(found);
}

export function getShardProgress() {
  const found = loadFoundShards();
  const total = SHARD_LEVELS.length;
  const have = SHARD_LEVELS.reduce((acc, lv) => acc + (found[lv] ? 1 : 0), 0);
  return { have, total };
}
