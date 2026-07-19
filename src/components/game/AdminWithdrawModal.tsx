// src/components/game/AdminWithdrawModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  formatWithdrawMessage,
  listWithdrawRequests,
  type WithdrawRequest,
} from "../../app/rewards/withdrawals";

function fmtDateUTC(timestamp: number) {
  try {
    return new Date(timestamp).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch {
    return "—";
  }
}

function shortAddr(address: string) {
  const value = (address || "").trim();
  if (value.length <= 14) return value || "—";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[,"\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const headers = ["id", "user", "amount", "wallet", "status", "createdAtUTC", "paidAtUTC", "txHash", "note"];
  if (!rows.length) return headers.join(",") + "\n";
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(",")),
  ].join("\n") + "\n";
}

export function AdminWithdrawModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<WithdrawRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "cancelled">("pending");
  const [info, setInfo] = useState<string | null>(null);

  const reload = () => {
    try {
      setItems(listWithdrawRequests());
    } catch {
      setItems([]);
    }
  };

  useEffect(reload, []);

  const visible = useMemo(
    () => filter === "all" ? items : items.filter((request) => request.status === filter),
    [items, filter]
  );

  const exportRows = useMemo(
    () => visible.map((request) => ({
      id: request.id,
      user: request.userKey,
      amount: request.amount,
      wallet: request.walletAddress,
      status: request.status,
      createdAtUTC: fmtDateUTC(request.createdAt),
      paidAtUTC: request.paidAt ? fmtDateUTC(request.paidAt) : "",
      txHash: request.txHash || "",
      note: request.note || "",
    })),
    [visible]
  );

  const pendingCount = items.filter((request) => request.status === "pending").length;
  const pendingTotal = items
    .filter((request) => request.status === "pending")
    .reduce((sum, request) => sum + (request.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-[30000] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#120404] border border-red-900/40 p-4 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-white/50 tracking-[0.22em] uppercase">Read-only archive</div>
            <h3 className="text-lg font-bold">Historical Withdraw Requests</h3>
            <div className="text-xs text-yellow-200/70 mt-1">New requests, emails and payout actions are disabled.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                downloadText(`withdraws_${filter}_${stamp}.json`, JSON.stringify(exportRows, null, 2), "application/json");
                setInfo("Exported JSON.");
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={() => {
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                downloadText(`withdraws_${filter}_${stamp}.csv`, toCsv(exportRows), "text/csv");
                setInfo("Exported CSV.");
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
            >
              Export CSV
            </button>
            <button type="button" onClick={reload} className="px-3 py-2 rounded-xl bg-white/10 text-sm">Refresh</button>
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm">Close</button>
          </div>
        </div>

        {info && <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 p-2 text-sm">{info}</div>}

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
            <div className="text-xs text-white/50">Historical pending requests</div>
            <div className="text-lg font-semibold text-yellow-200">{pendingCount}</div>
          </div>
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
            <div className="text-xs text-white/50">Historical pending BR</div>
            <div className="text-lg font-semibold text-yellow-200">{pendingTotal}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-white/50">Filter:</span>
          {(["pending", "paid", "cancelled", "all"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={filter === value ? "px-3 py-1.5 rounded-xl text-xs border bg-red-800/70 border-red-500/30" : "px-3 py-1.5 rounded-xl text-xs border bg-white/5 border-white/10"}
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-3 max-h-[60vh] overflow-auto rounded-2xl border border-white/10">
          {visible.length === 0 ? (
            <div className="p-4 text-sm text-white/55">No archived requests.</div>
          ) : (
            visible.map((request) => (
              <div key={request.id} className="border-t border-white/10 p-3 text-sm">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3"><div className="font-mono text-xs">{request.id}</div><div className="text-[10px] text-white/50">{request.status.toUpperCase()}</div></div>
                  <div className="col-span-2">{request.userKey}</div>
                  <div className="col-span-1 text-right font-semibold">{request.amount}</div>
                  <div className="col-span-3 font-mono text-xs">{shortAddr(request.walletAddress)}</div>
                  <div className="col-span-3 text-xs text-white/55">{fmtDateUTC(request.createdAt)}</div>
                </div>
                <div className="mt-2 text-[11px] text-white/40 whitespace-pre-wrap border-t border-white/10 pt-2">
                  {formatWithdrawMessage(request)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Archive only. This screen cannot create emails, submit transactions or change request status.
        </div>
      </div>
    </div>
  );
}
