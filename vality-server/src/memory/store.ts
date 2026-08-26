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

export async function addFact(category: string, content: string): Promise<Fact> {
  const now = new Date().toISOString();
  const fact: Fact = {
    id: randomUUID(),
    category,
    content,
    source: "explicit",
    createdAt: now,
    lastReferencedAt: now,
    referenceCount: 0,
    status: "active",
  };
  facts.push(fact);
  await persistFacts();
  return fact;
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
