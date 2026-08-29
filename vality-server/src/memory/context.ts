import { config } from "../config";
import { getActiveFacts, getRecentConversation, touchFacts } from "./store";

// Baut den Kontext-Block, der jedem claude -p Aufruf vorangestellt wird:
// bekannte Fakten + die letzten Interaktionen. Fakten, die hier einfliessen,
// gelten als referenziert (siehe touchFacts) und bleiben dadurch beim
// Stale-Sweep aktiv.
export async function buildPromptContext(): Promise<string> {
  const facts = getActiveFacts().slice(-config.memory.contextFactsLimit);
  const turns = getRecentConversation(config.memory.contextConversationTurns);

  let block = "";

  if (facts.length > 0) {
    block += "Bekannte Fakten über den Nutzer:\n";
    block += facts.map((f) => `- ${f.content}`).join("\n");
    block += "\n\n";
    await touchFacts(facts.map((f) => f.id));
  }

  if (turns.length > 0) {
    block += "Bisheriger Gesprächsverlauf (älteste zuerst):\n";
    block += turns.map((t) => `Nutzer: ${t.transcript}\nJarvis: ${t.reply}`).join("\n");
    block += "\n\n";
  }

  return block;
}
