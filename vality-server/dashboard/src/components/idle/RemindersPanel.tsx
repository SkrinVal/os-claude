import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useReminders } from "../../hooks/useReminders";
import { formatUntil } from "../../utils/formatRelative";
import HudFrame from "../layout/HudFrame";
import Skeleton from "../layout/Skeleton";
import "./RemindersPanel.css";

// Zeigt, was ansteht - ausgeloest wird eine Erinnerung serverseitig, egal
// ob das Dashboard gerade offen ist (siehe reminders/scheduler.ts). Sag
// "Erinnere mich morgen um neun an ...", um eine neue anzulegen.
export default function RemindersPanel({ delay }: { delay?: number }) {
  const { reminders, loading, error, remove } = useReminders();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <HudFrame title="Termine" className="reminders-panel" delay={delay}>
      {loading && reminders.length === 0 && (
        <div className="reminders-panel__skeletons">
          {[0, 1].map((i) => (
            <Skeleton key={i} height={12} width={`${78 - i * 14}%`} />
          ))}
        </div>
      )}
      {!loading && error && <p className="reminders-panel__hint reminders-panel__hint--error mono">{error}</p>}
      {!loading && !error && reminders.length === 0 && (
        <p className="reminders-panel__hint mono">Keine anstehenden Erinnerungen. Sag „Erinnere mich …".</p>
      )}
      <ul className="reminders-panel__list">
        <AnimatePresence initial={false}>
          {reminders.map((r) => (
            <motion.li
              key={r.id}
              className="reminders-panel__item"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 0.9, 0.32, 1] }}
            >
              <div className="reminders-panel__main">
                <span className="reminders-panel__text">{r.text}</span>
                <span className="reminders-panel__when mono" title={new Date(r.dueAt).toLocaleString("de-DE")}>
                  {formatUntil(r.dueAt, now)}
                </span>
              </div>
              <button
                type="button"
                className="reminders-panel__delete"
                onClick={() => remove(r.id)}
                aria-label={`Erinnerung „${r.text}" löschen`}
                title="Löschen"
              >
                ×
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </HudFrame>
  );
}
