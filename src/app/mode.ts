export type AppMode = "trial" | "full";

export const APP_MODE: AppMode =
  ((import.meta.env.VITE_APP_MODE as AppMode) || "trial");

export const isTrial = APP_MODE === "trial";
export const isFull = APP_MODE === "full";

