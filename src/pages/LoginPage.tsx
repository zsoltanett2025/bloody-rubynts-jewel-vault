import { useState } from "react";
import { login } from "../app/auth/auth.api";
import { useAuth } from "../app/auth/AuthProvider";
import { RegisterPage } from "./RegisterPage";

export function LoginPage() {
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) return <RegisterPage onBack={() => setShowRegister(false)} />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-sm rounded-xl bg-white/10 p-5 backdrop-blur">
        <div className="text-xl font-bold mb-3">BR Trial Login</div>

        {err && <div className="mb-3 rounded bg-red-500/20 p-2 text-sm">{err}</div>}

        <label className="text-sm opacity-80">Username</label>
        <input
          className="mb-3 mt-1 w-full rounded bg-black/40 p-2 outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label className="text-sm opacity-80">Password</label>
        <input
          className="mb-4 mt-1 w-full rounded bg-black/40 p-2 outline-none"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          className="w-full rounded bg-red-600 py-2 font-semibold hover:bg-red-700"
          onClick={() => {
            try {
              setErr(null);
              const u = login(username, password);
              setUser(u);
            } catch (e: any) {
              setErr(e?.message || "Login failed");
            }
          }}
        >
          Login
        </button>

        <button
          className="mt-3 w-full rounded bg-white/10 py-2 hover:bg-white/15"
          onClick={() => setShowRegister(true)}
        >
          Create account
        </button>
      </div>
    </div>
  );
}
