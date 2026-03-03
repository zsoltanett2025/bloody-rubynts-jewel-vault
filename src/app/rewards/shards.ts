// src/app/rewards/shards.ts
import { addBr, getUserKeyFromStorage } from "./brRewards";

export const SHARD_LEVELS = [
  67, 134, 201, 268, 335, 402, 469, 536, 603, 670, 737, 804, 871, 938, 1000,
] as const;

const LS_UNLOCKED = "br_shards_unlocked_v1";

function rewardForShardIndex(i: number) {
  // 1st=10, 2nd=15, 3rd=20, ... 15th=80
  return 10 + i * 5;
}

function onceKey(userKey: string, shardIndex: number) {
  return `br_shard_reward_once_v1:${userKey}:${shardIndex}`;
}

export function shardIndexForLevel(level: number): number {
  return SHARD_LEVELS.indexOf(level as any);
}

export function isShardLevel(level: number): boolean {
  return shardIndexForLevel(level) !== -1;
}

export function getUnlockedShards(userKey?: string): boolean[] {
  const u = userKey || getUserKeyFromStorage();
  try {
    const raw = localStorage.getItem(`${LS_UNLOCKED}:${u}`);
    const arr = raw ? (JSON.parse(raw) as boolean[]) : [];
    // always normalize to 15
    return Array.from({ length: SHARD_LEVELS.length }, (_, i) => !!arr[i]);
  } catch {
    return Array.from({ length: SHARD_LEVELS.length }, () => false);
  }
}

export function getShardCount(userKey?: string): number {
  return getUnlockedShards(userKey).filter(Boolean).length;
}

export function unlockShard(userKey: string, shardIndex: number) {
  const arr = getUnlockedShards(userKey);
  arr[shardIndex] = true;
  try {
    localStorage.setItem(`${LS_UNLOCKED}:${userKey}`, JSON.stringify(arr));
  } catch {}
}

/**
 * Grant shard + BR ONCE when a shard level is completed.
 * Returns: { granted, shardIndex, amount }
 */
export function grantShardRewardOnceForLevel(level: number) {
  const userKey = getUserKeyFromStorage();
  const idx = shardIndexForLevel(level);
  if (idx < 0) return { granted: false, shardIndex: -1, amount: 0 };

  const k = onceKey(userKey, idx);

  try {
    if (localStorage.getItem(k) === "1") {
      // already granted
      unlockShard(userKey, idx); // ensure unlocked still true
      return { granted: false, shardIndex: idx, amount: 0 };
    }
  } catch {}

  // mark + unlock
  try {
    localStorage.setItem(k, "1");
  } catch {}

  unlockShard(userKey, idx);

  const amount = rewardForShardIndex(idx);
  try {
    addBr(userKey, amount);
  } catch {}

  return { granted: true, shardIndex: idx, amount };
}