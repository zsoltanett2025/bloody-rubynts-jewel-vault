export async function clearSwAndCaches() {
  try {
    let didAnything = false;

    // Service worker unregister
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      if (regs.length) didAnything = true;
      await Promise.all(regs.map((r) => r.unregister()));
    }

    // Cache Storage törlés
    if ("caches" in window) {
      const keys = await caches.keys();
      if (keys.length) didAnything = true;
      await Promise.all(keys.map((k) => caches.delete(k)));
    }

    // Ha tényleg találtunk valamit, akkor egyszer “tisztán” újratöltünk
    if (didAnything) {
      const url = new URL(window.location.href);
      url.searchParams.set("v", String(Date.now())); // cache-buster
      window.location.replace(url.toString());
      return new Promise(() => {}); // megállítjuk a további futást
    }
  } catch {
    // csendben marad
  }
}