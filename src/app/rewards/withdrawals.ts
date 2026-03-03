// src/app/rewards/withdrawals.ts
import { addBr, getBrBalance } from "./brRewards";
import emailjs from "@emailjs/browser";

const LS_WITHDRAW_REQS = "br_withdraw_requests_v1";
export const WITHDRAW_MIN_BR = 100;

// ✅ EmailJS (auto notification)
// IMPORTANT: these are PUBLIC identifiers (safe to ship in frontend)
const EMAILJS_SERVICE_ID = "service_gzu0suh";
const EMAILJS_TEMPLATE_ID = "template_at8xgoj";
const EMAILJS_PUBLIC_KEY = "orMfLOSV2Vmcv9eED";

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

function makeId(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WR-${y}${m}${dd}-${rand}`;
}

function sendWithdrawEmail(req: WithdrawRequest) {
  // ✅ Never block gameplay / request creation if email fails
  try {
    void emailjs
      .send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          user: req.userKey,
          wallet: req.walletAddress,
          amount: req.amount,
          note: req.note || "",
          request_id: req.id,
          date: new Date(req.createdAt).toISOString(),
        },
        EMAILJS_PUBLIC_KEY
      )
      .catch(() => {
        // silent fail (optional: console.log)
      });
  } catch {
    // silent fail
  }
}

export function listWithdrawRequests(): WithdrawRequest[] {
  return loadAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function listWithdrawRequestsForUser(userKey: string): WithdrawRequest[] {
  return listWithdrawRequests().filter((r) => r.userKey === userKey);
}

export function createWithdrawRequest(params: {
  userKey: string;
  walletAddress: string;
  amount: number;
  note?: string;
}): { ok: true; request: WithdrawRequest } | { ok: false; error: string } {
  const userKey = (params.userKey || "").trim();
  const walletAddress = (params.walletAddress || "").trim();
  const amount = Math.floor(Number(params.amount) || 0);
  const note = (params.note || "").trim();

  if (!userKey || userKey === "guest") return { ok: false, error: "Please login first." };
  if (!walletAddress) return { ok: false, error: "Wallet address is required." };
  if (amount < WITHDRAW_MIN_BR) return { ok: false, error: `Minimum withdraw is ${WITHDRAW_MIN_BR} BR.` };

  const bal = getBrBalance(userKey);
  if (amount > bal) return { ok: false, error: "Not enough BR balance." };

  const req: WithdrawRequest = {
    id: makeId(),
    userKey,
    walletAddress,
    amount,
    note: note || "Payout within 24–48 hours.",
    createdAt: Date.now(),
    status: "pending",
  };

  // ✅ Balance decreases immediately (pre-release manual payout flow)
  try {
    addBr(userKey, -amount);
  } catch {
    return { ok: false, error: "Failed to update balance." };
  }

  const all = loadAll();
  all.push(req);
  saveAll(all);

  // ✅ Auto email notification (EmailJS)
  sendWithdrawEmail(req);

  return { ok: true, request: req };
}

export function markWithdrawPaid(id: string, txHash?: string): boolean {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return false;

  const cur = all[idx];
  if (!cur || cur.status !== "pending") return false;

  all[idx] = {
    ...cur,
    status: "paid",
    paidAt: Date.now(),
    txHash: txHash?.trim() || cur.txHash,
  };

  saveAll(all);
  return true;
}

export function cancelWithdrawRequest(id: string, refund = true): boolean {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return false;

  const cur = all[idx];
  if (!cur || cur.status !== "pending") return false;

  all[idx] = { ...cur, status: "cancelled" };
  saveAll(all);

  // Optional refund (only if you decide to cancel)
  if (refund) {
    try {
      addBr(cur.userKey, cur.amount);
    } catch {}
  }

  return true;
}

export function formatWithdrawMessage(req: WithdrawRequest): string {
  const dt = new Date(req.createdAt).toISOString();
  return [
    `Withdraw Request: ${req.id}`,
    `User: ${req.userKey}`,
    `Amount: ${req.amount} BR`,
    `Wallet: ${req.walletAddress}`,
    `Status: ${req.status}`,
    `Created (UTC): ${dt}`,
    `Note: ${req.note}`,
  ].join("\n");
}

export function buildWithdrawMailto(params: {
  to: string;
  req: WithdrawRequest;
  subjectPrefix?: string;
}): string {
  const to = (params.to || "").trim();
  const subjectPrefix = params.subjectPrefix || "RubyntsVault Withdrawal";
  const subject = `${subjectPrefix} ${params.req.id}`;
  const body = formatWithdrawMessage(params.req);

  const enc = (s: string) => encodeURIComponent(s);
  return `mailto:${enc(to)}?subject=${enc(subject)}&body=${enc(body)}`;
}