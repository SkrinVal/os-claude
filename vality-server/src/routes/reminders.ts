import { Router } from "express";
import { deleteReminder, getUpcomingReminders } from "../reminders/store";

export const remindersRouter = Router();

remindersRouter.get("/reminders", (_req, res) => {
  const reminders = getUpcomingReminders().map((r) => ({
    id: r.id,
    text: r.text,
    dueAt: r.dueAt,
    createdAt: r.createdAt,
  }));
  res.json({ reminders });
});

// Manuelles Loeschen im Dashboard - Pendant zum Sprachbefehl
// "Loesch die Erinnerung an X".
remindersRouter.delete("/reminders/:id", async (req, res) => {
  const removed = await deleteReminder(req.params.id);
  if (!removed) {
    res.status(404).json({ error: "Erinnerung nicht gefunden." });
    return;
  }
  res.json({ ok: true });
});
