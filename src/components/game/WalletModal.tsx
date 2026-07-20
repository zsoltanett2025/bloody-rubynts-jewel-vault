// src/components/game/WalletModal.tsx
import { useEffect, useState } from "react";
import { useGame } from "./GameState";
import { AdminWithdrawModal } from "./AdminWithdrawModal";

export function WalletModal({ onClose }: { onClose: () => void }) {
  const { walletAddress, walletChainId, connectWallet, disconnectWallet, progress } = useGame();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const isPolygon = walletChainId === 137;
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[20000] bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#120404] border border-red-900/40 rounded-2xl p-4 text-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Wallet</h3>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdmin(true)}
                className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/15 transition"
              >
                Archive
              </button>
            )}
            <button type="button" onClick={onClose} className="px-3 py-1 bg-white/10 rounded-lg">
              Close
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500/30 p-2 text-sm">
            {err}
          </div>
        )}

        <div className="rounded-xl bg-black/30 border border-white/10 p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50">BR Game Points</div>
            <div className="text-sm font-semibold tabular-nums">{brBalance}</div>
          </div>
          <div className="text-[11px] text-white/40 mt-2">
            Game points are currently intended for in-game use only.
          </div>
        </div>

        {!walletAddress ? (
          <>
            <p className="text-white/70 text-sm mb-3">
              You may connect a wallet for development-mode identity testing. No transaction or withdrawal will be created.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setErr(null);
                setBusy(true);
                try {
                  await connectWallet();
                } catch (error: any) {
                  setErr(error?.message || "Wallet connect failed");
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full rounded-xl bg-red-800/80 py-3 font-semibold hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Connecting..." : "Connect wallet"}
            </button>
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
              <div className="text-xs text-white/45 mt-2">
                Wallet connection is available for identity testing only. External transfers are unavailable.
              </div>
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
          </>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="font-semibold">External Transfers</div>
          <div className="inline-block mt-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200">
            Currently Unavailable
          </div>
          <p className="mt-3 text-xs leading-5 text-white/55">
            BR Game Points are currently intended for in-game use only. External transfers, redemption, monetary value and withdrawal are not currently offered.
          </p>
          <button
            type="button"
            disabled
            className="mt-2 w-full rounded-xl bg-white/10 py-3 font-semibold text-white/45 cursor-not-allowed"
          >
            Unavailable
          </button>
        </div>
      </div>

      {showAdmin && isAdmin && <AdminWithdrawModal onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
