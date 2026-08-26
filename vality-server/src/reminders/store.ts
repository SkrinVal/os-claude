import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import type { Reminder } from "./types";

const REMINDERS_PATH = path.join(config.dataDir, "reminders.json");

let reminders: Reminder[] = [];
let loaded = false;

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Gleiches Muster wie memory/store.ts: temporaere Datei + rename, damit ein
// Absturz mitten im Schreiben nicht die bestehende Datei beschaedigt.
async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function loadReminders(): Promise<void> {
  if (loaded) return;
  reminders = await readJson<Reminder[]>(REMINDERS_PATH, []);
  loaded = true;
}

async function persist(): Promise<void> {
  await writeJsonAtomic(REMINDERS_PATH, reminders);
}

export function getAllReminders(): Reminder[] {
  return reminders;
}

// Noch nicht ausgeloeste Erinnerungen, chronologisch - fuers Dashboard und
// den Sprachbefehl "was steht an".
export function getUpcomingReminders(): Reminder[] {
  return reminders
    .filter((r) => !r.fired)
    .slice()
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

// Faellige, noch nicht ausgeloeste Erinnerungen - fuer den Scheduler.
export function getDueReminders(now: Date): Reminder[] {
  const ts = now.getTime();
  return reminders.filter((r) => !r.fired && new Date(r.dueAt).getTime() <= ts);
}

export async function addReminder(text: string, dueAt: string): Promise<Reminder> {
  const now = new Date().toISOString();
  const reminder: Reminder = { id: randomUUID(), text, dueAt, createdAt: now, fired: false };
  reminders.push(reminder);
  await persist();
  return reminder;
}

export async function markFired(id: string): Promise<void> {
  const reminder = reminders.find((r) => r.id === id);
  if (!reminder || reminder.fired) return;
  reminder.fired = true;
  reminder.firedAt = new Date().toISOString();
  await persist();
}

export async function deleteReminder(id: string): Promise<boolean> {
  const before = reminders.length;
  reminders = reminders.filter((r) => r.id !== id);
  if (reminders.length === before) return false;
  await persist();
  return true;
}

// Findet die naechste anstehende Erinnerung, deren Text das Suchwort
// enthaelt - fuer den Sprachbefehl "Loesch die Erinnerung an X".
export function findReminderByText(query: string): Reminder | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return getUpcomingReminders().find((r) => r.text.toLowerCase().includes(q)) ?? null;
}
