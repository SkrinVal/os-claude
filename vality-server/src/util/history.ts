export interface Interaction {
  id: string;
  transcript: string;
  reply: string;
  audioUrl: string | null;
  ts: string;
}

const MAX_ENTRIES = 50;
const history: Interaction[] = [];

export function addInteraction(entry: Interaction): void {
  history.unshift(entry);
  history.length = Math.min(history.length, MAX_ENTRIES);
}

export function getHistory(): Interaction[] {
  return history;
}
