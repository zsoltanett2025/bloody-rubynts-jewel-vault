// src/components/game/AdminWithdrawModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  buildWithdrawMailto,
  cancelWithdrawRequest,
  formatWithdrawMessage,
  listWithdrawRequests,
  markWithdrawPaid,
  type WithdrawRequest,
} from "../../app/rewards/withdrawals";

const PAYMENTS_EMAIL = "rubyntspayments@gmail.com";

function fmtDateUTC(ts: number) {
  try {
    const d = new Date(ts);
    return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  } catch {
    return "—";
  }
}

function shortAddr(a: string) {
  const s = (a || "").trim();
  if (s.length <= 14) return s || "—";
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(v: any) {
  const s = String(v ?? "");
  // wrap if contains comma/quote/newline
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Array<Record<string, any>>): string {
  if (!rows.length) return "id,user,amount,wallet,status,createdAtUTC,paidAtUTC,txHash,note\n";
  const headers = [
    "id",
    "user",
    "amount",
    "wallet",
    "status",
    "createdAtUTC",
    "paidAtUTC",
    "txHash",
    "note",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => escapeCsvCell((r as any)[h]))
        .join(",")
    ),
  ];
  return lines.join("\n") + "\n";
}

export function AdminWithdrawModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<WithdrawRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "cancelled">("pending");
  const [txHashById, setTxHashById] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);

  const reload = () => {
    try {
      setItems(listWithdrawRequests());
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((r) => r.status === filter);
  }, [items, filter]);

  const stats = useMemo(() => {
  const pending = items.filter((r) => r.status === "pending");
  const paid = items.filter((r) => r.status === "paid");

  const pendingTotal = pending.reduce((sum, r) => sum + (r.amount || 0), 0);
  const paidTotal = paid.reduce((sum, r) => sum + (r.amount || 0), 0);
  const allTotal = items.reduce((sum, r) => sum + (r.amount || 0), 0);

  return {
    pendingCount: pending.length,
    pendingTotal,
    paidTotal,
    allTotal,
  };
}, [items]);

  const exportRows = useMemo(() => {
    const list = visible;
    return list.map((r) => ({
      id: r.id,
      user: r.userKey,
      amount: r.amount,
      wallet: r.walletAddress,
      status: r.status,
      createdAtUTC: fmtDateUTC(r.createdAt),
      paidAtUTC: r.paidAt ? fmtDateUTC(r.paidAt) : "",
      txHash: r.txHash || "",
      note: r.note || "",
    }));
  }, [visible]);

  return (
    <div
      className="fixed inset-0 z-[30000] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-[#120404] border border-red-900/40 p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-white/50 tracking-[0.22em] uppercase">Admin</div>
            <h3 className="text-lg font-bold">Withdraw Requests</h3>
            <div className="text-xs text-white/45 mt-1">
              Payments email: <span className="text-white/70">{PAYMENTS_EMAIL}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                try {
                  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                  downloadText(
                    `withdraws_${filter}_${stamp}.json`,
                    JSON.stringify(exportRows, null, 2),
                    "application/json"
                  );
                  setInfo("Exported JSON.");
                  window.setTimeout(() => setInfo(null), 1200);
                } catch {}
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
            >
              Export JSON
            </button>

            <button
              type="button"
              onClick={() => {
                try {
                  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                  const csv = toCsv(exportRows);
                  downloadText(`withdraws_${filter}_${stamp}.csv`, csv, "text/csv");
                  setInfo("Exported CSV.");
                  window.setTimeout(() => setInfo(null), 1200);
                } catch {}
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={reload}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 hover:bg-black/55 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {info && (
          <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 p-2 text-sm">
            {info}
          </div>
        )}

<div className="mt-4 grid grid-cols-4 gap-3 text-sm">
  <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
    <div className="text-xs text-white/50">Pending requests</div>
    <div className="text-lg font-semibold text-yellow-200">
      {stats.pendingCount}
    </div>
  </div>

  <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3">
    <div className="text-xs text-white/50">Total pending BR</div>
    <div className="text-lg font-semibold text-yellow-200 tabular-nums">
      {stats.pendingTotal}
    </div>
  </div>

  <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3">
    <div className="text-xs text-white/50">Total paid BR</div>
    <div className="text-lg font-semibold text-green-200 tabular-nums">
      {stats.paidTotal}
    </div>
  </div>

  <div className="rounded-xl bg-white/5 border border-white/10 p-3">
    <div className="text-xs text-white/50">All-time requested</div>
    <div className="text-lg font-semibold text-white/80 tabular-nums">
      {stats.allTotal}
    </div>
  </div>
</div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-white/50">Filter:</span>
          {(["pending", "paid", "cancelled", "all"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={[
                "px-3 py-1.5 rounded-xl text-xs border transition",
                filter === k
                  ? "bg-red-800/70 border-red-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10",
              ].join(" ")}
            >
              {k.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto text-xs text-white/45">
            Showing <span className="text-white/75">{visible.length}</span> / {items.length}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-white/5 text-[11px] text-white/55">
            <div className="col-span-2">ID</div>
            <div className="col-span-2">USER</div>
            <div className="col-span-1 text-right">AMOUNT</div>
            <div className="col-span-3">WALLET</div>
            <div className="col-span-2">DATE</div>
            <div className="col-span-2 text-right">ACTIONS</div>
          </div>

          <div className="max-h-[60vh] overflow-auto">
            {visible.length === 0 ? (
              <div className="p-4 text-sm text-white/55">No requests.</div>
            ) : (
              visible.map((r) => {
                const msg = formatWithdrawMessage(r);
                const mailto = buildWithdrawMailto({ to: PAYMENTS_EMAIL, req: r });
                const txHash = txHashById[r.id] ?? "";

                const quickLine = `${r.id} | ${r.amount} BR | ${r.walletAddress}`;

                return (
                  <div key={r.id} className="border-t border-white/10 px-3 py-3 text-sm">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2">
                        <div className="font-mono text-xs text-white/85">{r.id}</div>
                        <div
                          className={[
                            "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] border",
                            r.status === "pending"
                              ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-200/90"
                              : r.status === "paid"
                                ? "bg-green-500/10 border-green-500/20 text-green-200/90"
                                : "bg-white/5 border-white/10 text-white/50",
                          ].join(" ")}
                        >
                          {r.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-white/90">{r.userKey}</div>
                        <div className="text-[11px] text-white/45">
                          {r.note?.slice(0, 28) || "—"}
                          {r.note && r.note.length > 28 ? "…" : ""}
                        </div>
                      </div>

                      <div className="col-span-1 text-right tabular-nums font-semibold">
                        {r.amount}
                      </div>

                      <div className="col-span-3">
                        <div className="font-mono text-xs text-white/80">{shortAddr(r.walletAddress)}</div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard?.writeText(r.walletAddress);
                                setInfo("Wallet copied.");
                                window.setTimeout(() => setInfo(null), 1200);
                              } catch {}
                            }}
                            className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          >
                            Copy wallet
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard?.writeText(quickLine);
                                setInfo("Quick line copied (wallet | amount | id).");
                                window.setTimeout(() => setInfo(null), 1400);
                              } catch {}
                            }}
                            className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          >
                            Copy quick
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-[11px] text-white/55">
                        {fmtDateUTC(r.createdAt)}
                        {r.paidAt ? (
                          <div className="text-[10px] text-white/35 mt-1">Paid: {fmtDateUTC(r.paidAt)}</div>
                        ) : null}
                      </div>

                      <div className="col-span-2 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard?.writeText(msg);
                                setInfo("Request copied.");
                                window.setTimeout(() => setInfo(null), 1200);
                              } catch {}
                            }}
                            className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
                          >
                            Copy
                          </button>

                          <a
                            href={mailto}
                            className="text-[11px] px-2 py-1 rounded-lg bg-black/40 border border-white/10 hover:bg-black/55 transition"
                          >
                            Email
                          </a>
                        </div>

                        {r.status === "pending" && (
                          <>
                            <input
                              value={txHash}
                              onChange={(e) =>
                                setTxHashById((m) => ({ ...m, [r.id]: e.target.value }))
                              }
                              placeholder="txHash (optional)"
                              className="w-full text-[11px] rounded-lg bg-black/40 border border-white/10 px-2 py-1 outline-none focus:border-red-400/40"
                            />

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const ok = markWithdrawPaid(r.id, txHashById[r.id]);
                                  if (ok) {
                                    setInfo("Marked as PAID.");
                                    window.setTimeout(() => setInfo(null), 1200);
                                    reload();
                                  } else {
                                    setInfo("Failed to mark paid.");
                                    window.setTimeout(() => setInfo(null), 1400);
                                  }
                                }}
                                className="text-[11px] px-2 py-1 rounded-lg bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 transition"
                              >
                                Mark paid
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const ok = cancelWithdrawRequest(r.id, true);
                                  if (ok) {
                                    setInfo("Cancelled + refunded.");
                                    window.setTimeout(() => setInfo(null), 1200);
                                    reload();
                                  } else {
                                    setInfo("Failed to cancel.");
                                    window.setTimeout(() => setInfo(null), 1400);
                                  }
                                }}
                                className="text-[11px] px-2 py-1 rounded-lg bg-red-700/20 border border-red-500/30 hover:bg-red-700/30 transition"
                              >
                                Cancel + refund
                              </button>
                            </div>
                          </>
                        )}

                        {r.status === "paid" && r.txHash && (
                          <div className="text-[10px] text-white/40 font-mono">
                            tx: {shortAddr(r.txHash)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-white/40 whitespace-pre-wrap border-t border-white/10 pt-2">
                      {msg}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-3 text-[11px] text-white/45">
          Tip: admin mode = set <span className="text-white/70 font-mono">localStorage.br_admin = "1"</span>
        </div>
      </div>
    </div>
  );
}