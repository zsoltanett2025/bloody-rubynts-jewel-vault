// src/app/rewards/withdrawals.ts
import { addBr } from "./brRewards";

const LS_WITHDRAW_REQS = "br_withdraw_requests_v1";
export const WITHDRAW_MIN_BR = 100;
export const WITHDRAWALS_ENABLED = false;

export type WithdrawStatus = "pending" | "paid" | "cancelled";

export type WithdrawRequest = {
  id: string;
  userKey: string;
  walletAddress: string;
  amount: number;
  note: string;
  createdAt: number;
  status: WithdrawStatus;
  paidAt?: number;
  txHash?: string;
  email?: string;
};

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function loadAll(): WithdrawRequest[] {
  return safeParse<WithdrawRequest[]>(localStorage.getItem(LS_WITHDRAW_REQS), []);
}

function saveAll(list: WithdrawRequest[]) {
  localStorage.setItem(LS_WITHDRAW_REQS, JSON.stringify(list));
}

export function listWithdrawRequests(): WithdrawRequest[] {
  return loadAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function listWithdrawRequestsForUser(userKey: string): WithdrawRequest[] {
  return listWithdrawRequests().filter((request) => request.userKey === userKey);
}

export function createWithdrawRequest(_params: {
  userKey: string;
  walletAddress: string;
  amount: number;
  note?: string;
  email?: string;
}): { ok: true; request: WithdrawRequest } | { ok: false; error: string } {
  return {
    ok: false,
    error: "Wallet withdrawals are coming soon and are not currently active.",
  };
}

// Historical administration helpers are retained for existing local records only.
// They are not exposed as active actions in the user or admin interface.
export function markWithdrawPaid(id: string, txHash?: string): boolean {
  if (!WITHDRAWALS_ENABLED) return false;
  const all = loadAll();
  const index = all.findIndex((request) => request.id === id);
  if (index < 0) return false;
  const current = all[index];
  if (!current || current.status !== "pending") return false;
  all[index] = {
    ...current,
    status: "paid",
    paidAt: Date.now(),
    txHash: txHash?.trim() || current.txHash,
  };
  saveAll(all);
  return true;
}

export function cancelWithdrawRequest(id: string, _email?: string, refund = true): boolean {
  if (!WITHDRAWALS_ENABLED) return false;
  const all = loadAll();
  const index = all.findIndex((request) => request.id === id);
  if (index < 0) return false;
  const current = all[index];
  if (!current || current.status !== "pending") return false;
  all[index] = { ...current, status: "cancelled" };
  saveAll(all);
  if (refund) {
    try {
      addBr(current.userKey, current.amount);
    } catch {}
  }
  return true;
}

export function formatWithdrawMessage(request: WithdrawRequest): string {
  const created = new Date(request.createdAt).toISOString();
  return [
    `Withdraw Request: ${request.id}`,
    `User: ${request.userKey}`,
    `Email: ${request.email || "-"}`,
    `Amount: ${request.amount} BR`,
    `Wallet: ${request.walletAddress}`,
    `Status: ${request.status}`,
    `Created (UTC): ${created}`,
    `Note: ${request.note}`,
  ].join("\n");
}
