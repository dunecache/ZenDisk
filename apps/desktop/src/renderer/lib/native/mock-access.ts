/**
 * Dev-only override for exercising permission-denied states in the browser
 * preview. With HashRouter the query lives after the hash, so check both:
 *   http://localhost:5173/?access=denied
 *   http://localhost:5173/#/automation?access=denied
 * Mock screens are the only consumers; production native data is unaffected.
 */
export function mockAccess(): "granted" | "denied" {
  if (typeof window === "undefined") return "granted";
  const hash = window.location.hash;
  const hashQuery = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const params = new URLSearchParams(window.location.search || hashQuery);
  return params.get("access") === "denied" ? "denied" : "granted";
}
