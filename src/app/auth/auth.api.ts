const LS_USER = "br_trial_user";
const LS_SESSION = "br_trial_session";

export type TrialUser = {
  username: string;
};

function normalizeUsername(u: string) {
  return u.trim().toLowerCase();
}

export function register(username: string, password: string) {
  const u = normalizeUsername(username);
  if (!u || password.length < 4) throw new Error("Invalid username or password");

  const stored = localStorage.getItem(LS_USER);
  if (stored) {
    const existing = JSON.parse(stored) as { username: string };
    if (existing.username === u) throw new Error("User already exists");
  }

  // NOTE: trial only – not secure hashing (ok for soft-launch)
  localStorage.setItem(LS_USER, JSON.stringify({ username: u, password }));
  localStorage.setItem(LS_SESSION, JSON.stringify({ username: u, ts: Date.now() }));

  return { username: u } as TrialUser;
}

export function login(username: string, password: string) {
  const u = normalizeUsername(username);
  const stored = localStorage.getItem(LS_USER);
  if (!stored) throw new Error("No user found, please register");

  const data = JSON.parse(stored) as { username: string; password: string };
  if (data.username !== u || data.password !== password) throw new Error("Wrong credentials");

  localStorage.setItem(LS_SESSION, JSON.stringify({ username: u, ts: Date.now() }));
  return { username: u } as TrialUser;
}

export function logout() {
  localStorage.removeItem(LS_SESSION);
}

export function getSession(): TrialUser | null {
  const s = localStorage.getItem(LS_SESSION);
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as { username: string };
    if (!parsed?.username) return null;
    return { username: parsed.username };
  } catch {
    return null;
  }
}
