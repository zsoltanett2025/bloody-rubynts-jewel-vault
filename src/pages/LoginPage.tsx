// src/pages/LoginPage.tsx
import { login } from "../app/auth/auth.api";
import { useAuth } from "../app/auth/AuthProvider";
import { useState } from "react";
import { grantDailyLoginBonus } from "../app/rewards/brRewards";

export function LoginPage({
  onGoRegister,
  onDone,
}: {
  onGoRegister?: () => void;
  onDone?: () => void;
}) {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const bg = `${import.meta.env.BASE_URL}assets/backgrounds/welcome_realm.gif`;

  return (
    <div
      className="relative min-h-[100svh] w-full overflow-hidden flex items-center justify-center text-white p-4"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.72) 72%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md shadow-2xl p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200/80 text-center">
          Shardkeeper Access
        </div>

        <div className="text-xl font-bold mt-2 mb-1 text-center">Login</div>
        <div className="text-sm text-white/70 text-center mb-4">
          Continue your journey in the Vault.
        </div>

        {err && <div className="mb-3 rounded bg-red-500/20 p-2 text-sm">{err}</div>}

        <label className="text-sm opacity-80">Username</label>
        <input
          className="mb-3 mt-1 w-full rounded-xl bg-black/40 p-3 outline-none border border-white/10 focus:border-white/20"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label className="text-sm opacity-80">Password</label>
        <input
          className="mb-4 mt-1 w-full rounded-xl bg-black/40 p-3 outline-none border border-white/10 focus:border-white/20"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          className="w-full rounded-xl bg-[#7a0f19] py-3 font-semibold hover:bg-[#8b141f] transition"
          onClick={() => {
            try {
              setErr(null);

              const u = login(username, password);

              // store user for rewards/balance keys
              try {
                localStorage.setItem("br_auth_user", username);
                localStorage.setItem("br_user", username);
              } catch {}

              const userKey =
                u?.username ||
                localStorage.getItem("br_auth_user") ||
                localStorage.getItem("br_user") ||
                username ||
                "guest";

              // ✅ daily 1BR (UTC day + ledger protected)
              try {
                grantDailyLoginBonus(userKey, 1);
              } catch {}

              setUser(u);
              onDone?.();
            } catch (e: any) {
              setErr(e?.message || "Login failed");
            }
          }}
          type="button"
        >
          Login
        </button>

        <button
          className="mt-3 w-full rounded-xl bg-white/10 py-3 hover:bg-white/15 transition"
          onClick={() => onGoRegister?.()}
          type="button"
        >
          Create account
        </button>

        <div className="mt-3 text-xs text-white/55 text-center">
          Tip: You can enable sound later for the full experience.
        </div>
      </div>
    </div>
  );
}