/**
 * Dev-only override for exercising permission-denied states in the browser
 * preview: append `?access=denied` to the URL. Mock screens are the only
 * consumers, so production native data is unaffected.
 */
export function mockAccess(): "granted" | "denied" {
  if (typeof window === "undefined") return "granted";
  return new URLSearchParams(window.location.search).get("access") === "denied"
    ? "denied"
    : "granted";
}
