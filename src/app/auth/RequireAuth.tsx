import React from "react";
import { useAuth } from "./AuthProvider";
import { LoginPage } from "../../pages/LoginPage";


export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return <>{children}</>;
}
