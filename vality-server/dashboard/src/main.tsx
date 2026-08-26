import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/theme.css";
import "./styles/global.css";
import App from "./App.tsx";
import { applyAccent, loadSavedAccent } from "./services/theme";

// Vor dem ersten Render angewendet (nicht in einem Effect), damit keine
// kurze Cyan-Aufblitzung sichtbar wird, falls eine andere Akzentfarbe
// gespeichert ist.
applyAccent(loadSavedAccent());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
