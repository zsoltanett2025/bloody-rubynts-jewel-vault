import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { TrialUser } from "./auth.api";
import { getSession, logout as apiLogout } from "./auth.api";

type AuthContextValue = {
  user: TrialUser | null;
  setUser: (u: TrialUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TrialUser | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      logout: () => {
        apiLogout();
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
