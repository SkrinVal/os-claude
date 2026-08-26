import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import type { ConversationTurn, Fact } from "./types";

const FACTS_PATH = path.join(config.dataDir, "memory", "facts.json");
const CONVERSATIONS_PATH = path.join(config.dataDir, "memory", "conversations.json");

let facts: Fact[] = [];
let conversations: ConversationTurn[] = [];
let loaded = false;

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    return fallback;
  }
}

// Schreibt ueber eine temporaere Datei + rename, damit ein Absturz mitten im
// Schreiben nicht die bestehende Datei beschaedigt (rename ist atomar auf
// demselben Dateisystem).
async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, filePath);
}

export async function loadMemory(): Promise<void> {
  if (loaded) return;
  await fs.mkdir(path.dirname(FACTS_PATH), { recursive: true });
  facts = await readJson<Fact[]>(FACTS_PATH, []);
  conversations = await readJson<ConversationTurn[]>(CONVERSATIONS_PATH, []);
  loaded = true;
}

async function persistFacts(): Promise<void> {
  await writeJsonAtomic(FACTS_PATH, facts);
}

async function persistConversations(): Promise<void> {
  await writeJsonAtomic(CONVERSATIONS_PATH, conversations);
}

export function getAllFacts(): Fact[] {
  return facts;
}

export function getActiveFacts(): Fact[] {
  return facts.filter((f) => f.status === "active");
}

export async function addFact(category: string, content: string, source: Fact["source"] = "explicit"): Promise<Fact> {
  const now = new Date().toISOString();
  const fact: Fact = {
    id: randomUUID(),
    category,
    content,
    source,
    createdAt: now,
    lastReferencedAt: now,
    referenceCount: 0,
    status: "active",
  };
  facts.push(fact);
  await persistFacts();
  return fact;
}

// Grobe Wortueberlappung (kein Embedding/keine echte Semantik noetig fuer
// eine einzelne lokale Faktenliste) - verhindert, dass ein beilaeufig
// wiederholtes "Ich mag Kaffee" nach jedem Gespraech erneut gespeichert
// wird.
function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function hasSimilarFact(content: string, threshold = 0.6): boolean {
  return getActiveFacts().some((f) => wordOverlap(f.content, content) >= threshold);
}

// Findet den Fakt, dessen Text am ehesten zu "content" passt (exakt, dann
// als Teilstring) - genutzt, um den Wortlaut zu finden, den Claude aus der
// "Bekannte Fakten"-Liste im Prompt-Kontext zurueckgegeben hat.
function findFactByContent(content: string): Fact | null {
  const norm = content.trim().toLowerCase();
  if (!norm) return null;
  const exact = getActiveFacts().find((f) => f.content.trim().toLowerCase() === norm);
  if (exact) return exact;
  return findFacts(content)[0] ?? null;
}

// Ein neuer Fakt widerspricht/aktualisiert einen bekannten (z.B. eine
// geaenderte Vorliebe) - der alte wird ersetzt statt dass beide
// nebeneinander stehen bleiben und sich widersprechen. Wird der alte Fakt
// nicht gefunden (Wortlaut hat sich zu sehr unterschieden), landet der neue
// trotzdem als eigenstaendiger Fakt.
export async function replaceFact(oldContent: string, category: string, newContent: string, source: Fact["source"]): Promise<Fact> {
  const old = findFactByContent(oldContent);
  if (old) {
    facts = facts.filter((f) => f.id !== old.id);
  }
  return addFact(category, newContent, source);
}

export async function deleteFactById(id: string): Promise<boolean> {
  const before = facts.length;
  facts = facts.filter((f) => f.id !== id);
  if (facts.length === before) return false;
  await persistFacts();
  return true;
}

// Findet aktive Fakten, deren Inhalt oder Kategorie das Suchwort enthaelt.
export function findFacts(query: string): Fact[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getActiveFacts().filter(
    (f) => f.content.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
  );
}

// Markiert Fakten als referenziert (Zeitstempel + Zaehler), z.B. weil sie in
// den Prompt-Kontext oder eine "Was weisst du ueber X"-Antwort eingeflossen
// sind. Das haelt sie beim Aufraeum-Sweep am Leben.
export async function touchFacts(factIds: string[]): Promise<void> {
  if (factIds.length === 0) return;
  const now = new Date().toISOString();
  const idSet = new Set(factIds);
  for (const fact of facts) {
    if (idSet.has(fact.id)) {
      fact.lastReferencedAt = now;
      fact.referenceCount += 1;
    }
  }
  await persistFacts();
}

// "Vergiss X": entfernt den ersten passenden aktiven Fakt vollstaendig.
// Anders als das Stale-Markieren im Cleanup ist das eine explizite Loeschung
// auf Nutzerwunsch, kein automatischer Aufraeum-Mechanismus.
export async function forgetFact(query: string): Promise<Fact | null> {
  const match = findFacts(query)[0];
  if (!match) return null;
  facts = facts.filter((f) => f.id !== match.id);
  await persistFacts();
  return match;
}

export async function markStale(factIds: string[]): Promise<void> {
  if (factIds.length === 0) return;
  const now = new Date().toISOString();
  const idSet = new Set(factIds);
  for (const fact of facts) {
    if (idSet.has(fact.id) && fact.status !== "stale") {
      fact.status = "stale";
      fact.staleSince = now;
    }
  }
  await persistFacts();
}

export function getRecentConversation(limit: number): ConversationTurn[] {
  return conversations.slice(-limit);
}

export async function recordConversationTurn(transcript: string, reply: string): Promise<void> {
  conversations.push({ id: randomUUID(), transcript, reply, ts: new Date().toISOString() });
  if (conversations.length > config.memory.maxConversationTurns) {
    conversations = conversations.slice(-config.memory.maxConversationTurns);
  }
  await persistConversations();
}
