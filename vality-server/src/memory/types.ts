export type FactStatus = "active" | "stale";

// "explicit" = per "merk dir, dass ..." diktiert. "learned" = beilaeufig
// aus einem normalen Gespraech aufgeschnappt (siehe hud/nlIntent.ts) - im
// Dashboard sichtbar unterschieden, damit klar bleibt, was der Nutzer
// wortwoertlich gesagt hat und was Vality selbst herausgehoert hat.
export interface Fact {
  id: string;
  category: string;
  content: string;
  source: "explicit" | "learned";
  createdAt: string;
  lastReferencedAt: string;
  referenceCount: number;
  status: FactStatus;
  staleSince?: string;
}

export interface ConversationTurn {
  id: string;
  transcript: string;
  reply: string;
  ts: string;
}
