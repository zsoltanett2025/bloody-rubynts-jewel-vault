// src/components/game/WalletModal.tsx
import { useEffect, useMemo, useState } from "react";
import { useGame } from "./GameState";
import {
  buildWithdrawMailto,
  createWithdrawRequest,
  formatWithdrawMessage,
  WITHDRAW_MIN_BR,
} from "../../app/rewards/withdrawals";
import { getUserKeyFromStorage } from "../../app/rewards/brRewards";
import { AdminWithdrawModal } from "./AdminWithdrawModal";

const PAYMENTS_EMAIL = "rubyntspayments@gmail.com";

export function WalletModal({ onClose }: { onClose: () => void }) {
  const {
    walletAddress,
    walletChainId,
    connectWallet,
    disconnectWallet,
    progress,
    refreshRubyntBalance,
  } = useGame();

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState<number>(WITHDRAW_MIN_BR);
  const [withdrawWallet, setWithdrawWallet] = useState<string>("");
  const [withdrawNote, setWithdrawNote] = useState<string>("Payout within 24–48 hours.");
  const [withdrawEmail, setWithdrawEmail] = useState<string>("");
  const [successId, setSuccessId] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string>("");

  const [showAdmin, setShowAdmin] = useState(false);

  const isPolygon = walletChainId === 137; // Polygon mainnet

  const short = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const brBalance = progress?.rubyntBalance ?? 0;

  const isAdmin = (() => {
    try {
      return localStorage.getItem("br_admin") === "1";
    } catch {
      return false;
    }
  })();

  const adminRaw = (() => {
    try {
      return localStorage.getItem("br_admin");
    } catch {
      return "err";
    }
  })();

  useEffect(() => {
    // ESC to close
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    // prefill withdraw wallet if connected
    if (walletAddress) setWithdrawWallet(walletAddress);
  }, [walletAddress]);

  const mailtoHref = useMemo(() => {
    if (!successId || !successText) return "";

    const fakeReq = {
      id: successId,
      userKey: getUserKeyFromStorage(),
      walletAddress: withdrawWallet,
      amount: withdrawAmount,
      note: withdrawNote,
      createdAt: Date.now(),
      status: "pending" as const,
      email: withdrawEmail,
    };

    return buildWithdrawMailto({
      to: PAYMENTS_EMAIL,
      req: fakeReq,
    });
  }, [successId, successText, withdrawWallet, withdrawAmount, withdrawNote, withdrawEmail]);

  return (
    <div
      className="fixed inset-0 z-[20000] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold">Wallet</h3>
            <div className="text-[11px] text-white/40">
              Admin debug:{" "}
              <span className="text-white/70">
                {String(isAdmin)} / raw:{String(adminRaw)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdmin(true)}
                className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition"
              >
                Admin
              </button>
            )}

            <button onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg">
              Close
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500/30 p-2 text-sm">
            {err}
          </div>
        )}

        {successId && (
          <div className="mb-3 rounded-lg bg-green-500/10 border border-green-500/20 p-2 text-sm">
            <div className="font-semibold mb-1">Withdraw request created</div>
            <div className="text-white/80 text-xs whitespace-pre-wrap">{successText}</div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(successText);
                  } catch {}
                }}
                className="flex-1 rounded-xl bg-white/10 py-2 hover:bg-white/15 transition"
              >
                Copy request
              </button>

              <a
                href={mailtoHref || "#"}
                onClick={(e) => {
                  if (!mailtoHref) e.preventDefault();
                }}
                className="flex-1 text-center rounded-xl bg-black/40 border border-white/10 py-2 hover:bg-black/55 transition"
              >
                Email
              </a>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-black/30 border border-white/10 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">BR Balance</div>
            <div className="text-sm font-semibold tabular-nums">{brBalance}</div>
          </div>
          <div className="text-[11px] text-white/40 mt-2">
            Withdraw minimum: <span className="text-white/70">{WITHDRAW_MIN_BR} BR</span>
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            Message: <span className="text-white/70">Payout within 24–48 hours.</span>
          </div>
        </div>

        {!walletAddress ? (
          <>
            <p className="text-white/70 text-sm mb-3">
              Connect your wallet to link this account (dev mode).
            </p>

            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setErr(null);
                setBusy(true);
                try {
                  await connectWallet();
                } catch (e: any) {
                  setErr(e?.message || "Wallet connect failed");
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full rounded-xl bg-red-800/80 py-3 font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Connecting..." : "Connect wallet"}
            </button>

            <p className="text-white/40 text-xs mt-3">
              Tip: Install MetaMask if you don’t have a wallet.
            </p>
          </>
        ) : (
          <>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3">
              <div className="text-xs text-white/50">Connected</div>
              <div className="text-sm font-semibold mt-1">{short}</div>

              <div className="text-xs text-white/50 mt-3">
                Chain:{" "}
                <span className={isPolygon ? "text-green-300" : "text-yellow-300"}>
                  {walletChainId ?? "unknown"}
                  {isPolygon ? " (Polygon)" : " (not Polygon)"}
                </span>
              </div>

              {!isPolygon && (
                <div className="text-xs text-yellow-200/80 mt-2">
                  Please switch your wallet to Polygon (chainId 137) for payouts.
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard?.writeText(walletAddress);
                  } catch {}
                }}
                className="flex-1 rounded-xl bg-white/10 py-2 hover:bg-white/15 transition"
              >
                Copy
              </button>

              <button
                type="button"
                onClick={() => {
                  setErr(null);
                  try {
                    disconnectWallet();
                  } catch {}
                }}
                className="flex-1 rounded-xl bg-black/40 border border-white/10 py-2 hover:bg-black/55 transition"
              >
                Disconnect
              </button>
            </div>

            <p className="text-white/40 text-xs mt-3">
              Dev note: this only links an address (no transactions).
            </p>
          </>
        )}

        {/* Withdraw section */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="font-semibold mb-2">Withdraw (Manual payout)</div>

          <label className="text-xs text-white/60">Email</label>
          <input
            className="mt-1 mb-2 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40 text-sm"
            type="email"
            value={withdrawEmail}
            onChange={(e) => setWithdrawEmail(e.target.value)}
            placeholder="your@email.com"
          />

          <label className="text-xs text-white/60">Wallet address</label>
          <input
            className="mt-1 mb-2 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40 text-sm"
            value={withdrawWallet}
            onChange={(e) => setWithdrawWallet(e.target.value)}
            placeholder="0x..."
          />

          <label className="text-xs text-white/60">Amount (BR)</label>
          <input
            className="mt-1 mb-2 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40 text-sm"
            type="number"
            min={WITHDRAW_MIN_BR}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(Math.floor(Number(e.target.value) || 0))}
          />

          <label className="text-xs text-white/60">Message</label>
          <textarea
            className="mt-1 mb-3 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40 text-sm"
            rows={3}
            value={withdrawNote}
            onChange={(e) => setWithdrawNote(e.target.value)}
          />

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setErr(null);
              setBusy(true);
              setSuccessId(null);
              setSuccessText("");

              try {
                const userKey = getUserKeyFromStorage();

                if (!withdrawEmail.trim()) {
                  setErr("Email is required.");
                  setBusy(false);
                  return;
                }

                const res = createWithdrawRequest({
                  userKey,
                  walletAddress: withdrawWallet,
                  amount: withdrawAmount,
                  note: withdrawNote,
                  email: withdrawEmail.trim(),
                });

                if (!res.ok) {
                  setErr(res.error);
                  setBusy(false);
                  return;
                }

                try {
                  refreshRubyntBalance();
                } catch {}

                const msg = formatWithdrawMessage(res.request);
                setSuccessId(res.request.id);
                setSuccessText(msg);
              } catch (e: any) {
                setErr(e?.message || "Withdraw request failed");
              } finally {
                setBusy(false);
              }
            }}
            className="w-full rounded-xl bg-red-800/80 py-3 font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Creating..." : `Request withdrawal (min ${WITHDRAW_MIN_BR} BR)`}
          </button>

          <div className="mt-2 text-[11px] text-white/45">
            Payout within 24–48 hours. You will receive a request ID to share with support.
          </div>
        </div>
      </div>

      {showAdmin && isAdmin && <AdminWithdrawModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}