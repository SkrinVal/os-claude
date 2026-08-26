// Kurze relative Zeit statt nur der Uhrzeit ("vor 2 Min" liest sich in
// einem Live-Log schneller als "14:37") - genutzt von LogPanel und
// MemoryPanel. Die exakte Uhrzeit steht per Hover/title weiterhin bereit.
export function formatRelative(ts: string, now: number): string {
  const diffSec = Math.max(0, Math.round((now - new Date(ts).getTime()) / 1000));
  if (diffSec < 10) return "gerade eben";
  if (diffSec < 60) return `vor ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}
