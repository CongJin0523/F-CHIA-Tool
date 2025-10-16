export function clearAppLocalStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)!;
      // keep this list tight to YOUR app’s keys
      if (
        k.startsWith("graph-") ||    // your graph store persist keys
        k.startsWith("fta-")   ||    // your FTA store persist keys
        k.includes("zones-store") ||  // your zone store persist key
        k.includes("zones-store") ||  // your zone store persist key
        k.includes("dg-store")       // if you persist diagram/dg store
      ) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {
    console.warn("Failed to clear some localStorage keys:", e);
  }
}