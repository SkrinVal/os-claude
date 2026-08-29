import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Baut direkt nach vality-server/public/ - der Express-Server liefert das
// Ergebnis unveraendert aus (siehe src/index.ts, express.static(public/)).
// Im Dev-Modus (npm run dev) proxied Vite /api und /ws an den echten
// Vality-Server, damit man mit HMR gegen die echte Sprach-/Event-Pipeline
// entwickeln kann statt gegen einen Mock.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "../public",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4390",
      "/ws": { target: "ws://localhost:4390", ws: true },
      "/audio": "http://localhost:4390",
    },
  },
});
