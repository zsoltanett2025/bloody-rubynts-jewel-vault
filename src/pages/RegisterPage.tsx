import { register } from "../app/auth/auth.api";
import { useAuth } from "../app/auth/AuthProvider";
import { useState } from "react";


export function RegisterPage({ onBack }: { onBack?: () => void }) {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm rounded-xl bg-white/10 p-5 backdrop-blur">
        <div className="text-xl font-bold mb-3">Create BR Trial Account</div>

        {err && <div className="mb-3 rounded bg-red-500/20 p-2 text-sm">{err}</div>}

        <label className="text-sm opacity-80">Username</label>
        <input
          className="mb-3 mt-1 w-full rounded bg-black/40 p-2 outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label className="text-sm opacity-80">Password (min 4)</label>
        <input
          className="mb-4 mt-1 w-full rounded bg-black/40 p-2 outline-none"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <button
          className="w-full rounded bg-red-600 py-2 font-semibold hover:bg-red-700"
          onClick={() => {
            try {
              setErr(null);
              const u = register(username, password);
              setUser(u);
            } catch (e: any) {
              setErr(e?.message || "Register failed");
            }
          }}
        >
          Register
        </button>

        <button
          className="mt-3 w-full rounded bg-white/10 py-2 hover:bg-white/15"
          onClick={() => onBack?.()}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
