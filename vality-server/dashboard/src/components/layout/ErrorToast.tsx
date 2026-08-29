import { AnimatePresence, motion } from "framer-motion";
import { useHudState } from "../../state/store";
import "./ErrorToast.css";

// Der Ring zeigt immer nur "FEHLER" (siehe CoreRing) - die eigentliche,
// potenziell lange Meldung (Server-Fehlertext, Stacktrace-Ausschnitt...)
// landet hier, wo sie umbrechen und weggewischt werden kann.
export default function ErrorToast() {
  const { voiceState, voiceLabel } = useHudState();
  const visible = voiceState === "error" && voiceLabel.length > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="error-toast mono"
          role="alert"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
        >
          <span className="error-toast__glyph" aria-hidden="true" />
          {voiceLabel}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
