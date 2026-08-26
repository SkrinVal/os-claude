import "./Skeleton.css";

// Schimmernder Platzhalterbalken fuer Ladezustaende - ersetzt reinen
// "LÄDT…"-Text an mehreren Stellen (News, Recherche, Wetter) durch etwas,
// das schon die Form des kommenden Inhalts andeutet.
export default function Skeleton({
  width = "100%",
  height = 12,
  circle = false,
}: {
  width?: string | number;
  height?: number;
  circle?: boolean;
}) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: circle ? "50%" : undefined }}
      aria-hidden="true"
    />
  );
}
