import { addFact, findFacts, forgetFact, touchFacts } from "./store";

export interface MemoryCommandResult {
  reply: string;
}

const REMEMBER_RE = /^(?:jarvis[,]?\s*)?(?:bitte\s+)?(?:merk(?:e)?\s+dir|erinnere\s+dich)\b[,]?\s*(?:dass\s+)?(.+)/i;
const RECALL_RE = /^(?:jarvis[,]?\s*)?(?:bitte\s+)?was\s+wei(?:ß|ss)t?\s+du\s+(?:über|zu)\s+(.+?)[?.!]*$/i;
const FORGET_RE = /^(?:jarvis[,]?\s*)?(?:bitte\s+)?vergiss\s+(.+?)[.!]*$/i;

// Erkennt die drei expliziten Gedaechtnis-Befehle aus dem transkribierten
// Text und fuehrt sie direkt aus - ohne Umweg ueber claude -p. Kategorie
// wird bewusst nicht geraten (keine Erfindungen); alles landet unter
// "allgemein", der Nutzer kann facts.json bei Bedarf von Hand nachsortieren.
export async function handleMemoryCommand(transcript: string): Promise<MemoryCommandResult | null> {
  const text = transcript.trim();

  const rememberMatch = text.match(REMEMBER_RE);
  if (rememberMatch) {
    const content = rememberMatch[1].trim().replace(/[.\s]+$/, "");
    if (!content) {
      return { reply: "Was genau soll ich mir merken?" };
    }
    await addFact("allgemein", content);
    return { reply: `Gemerkt: ${content}` };
  }

  const recallMatch = text.match(RECALL_RE);
  if (recallMatch) {
    const topic = recallMatch[1].trim();
    const matches = findFacts(topic);
    if (matches.length === 0) {
      return { reply: `Dazu weiß ich nichts über "${topic}".` };
    }
    await touchFacts(matches.map((f) => f.id));
    return { reply: `Dazu weiß ich: ${matches.map((f) => f.content).join("; ")}` };
  }

  const forgetMatch = text.match(FORGET_RE);
  if (forgetMatch) {
    const topic = forgetMatch[1].trim();
    const removed = await forgetFact(topic);
    if (!removed) {
      return { reply: `Dazu habe ich nichts gespeichert, das zu "${topic}" passt.` };
    }
    return { reply: `Vergessen: ${removed.content}` };
  }

  return null;
}
