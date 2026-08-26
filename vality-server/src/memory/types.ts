export type FactStatus = "active" | "stale";

export interface Fact {
  id: string;
  category: string;
  content: string;
  source: "explicit";
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
