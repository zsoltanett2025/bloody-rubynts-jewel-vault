// src/pages/RegisterPage.tsx
import { register } from "../app/auth/auth.api";
import { useAuth } from "../app/auth/AuthProvider";
import { useState } from "react";
import { assetUrl } from "../utils/assetUrl";
import { grantRegisterBonusOnce } from "../app/rewards/brRewards";

export function RegisterPage({
  onBack,
  onDone,
}: {
  onBack?: () => void;
  onDone?: () => void;
}) {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const bg = assetUrl("assets/backgrounds/welcome_realm.gif");

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url('${bg}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(1px)",
          opacity: 0.92,
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70 pointer-events-none" />

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-black/45 border border-white/10 p-5 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.55)]">
          <div className="text-[11px] tracking-[0.3em] uppercase text-amber-200/70 text-center">
            Shardkeeper Creation
          </div>

          <div className="text-2xl font-bold mt-2 text-center">Create BR Account</div>

          <div className="text-sm text-white/70 text-center mt-2 mb-4">
            Choose your name in the realm. Your progress will be bound to this account.
          </div>

          {err && <div className="mb-3 rounded bg-red-500/20 p-2 text-sm">{err}</div>}

          <label className="text-sm opacity-80">Username</label>
          <input
            className="mb-3 mt-1 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <label className="text-sm opacity-80">Password (min 4)</label>
          <input
            className="mb-4 mt-1 w-full rounded-xl bg-black/40 border border-white/10 p-2 outline-none focus:border-red-400/40"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button
            className="w-full rounded-full bg-red-800/80 py-3 font-semibold hover:bg-red-700 transition active:scale-[0.99]"
            onClick={() => {
              try {
                setErr(null);

                const u = register(username, password);
                setUser(u);

                const userKey =
                  u?.username ||
                  localStorage.getItem("br_auth_user") ||
                  localStorage.getItem("br_user") ||
                  username ||
                  "guest";

                // ✅ +25 BR egyszer
                grantRegisterBonusOnce(userKey, 25);

                onDone?.();
              } catch (e: any) {
                setErr(e?.message || "Register failed");
              }
            }}
            type="button"
          >
            Register
          </button>

          <button
            className="mt-3 w-full rounded-full bg-white/10 py-3 hover:bg-white/15 transition"
            onClick={() => onBack?.()}
            type="button"
          >
            Back
          </button>

          <div className="mt-3 text-xs text-white/40 text-center">
            Tip: You can enable sound later for the full experience.
          </div>
        </div>
      </div>
    </div>
  );
}