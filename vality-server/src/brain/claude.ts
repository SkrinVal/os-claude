import { spawn } from "node:child_process";
import { config } from "../config";

/**
 * Schickt einen Prompt an die lokal installierte Claude Code CLI (`claude -p`).
 * Nutzt das bestehende Claude-Abo des Nutzers statt einer separaten API mit eigenem Billing.
 */
export async function askClaude(prompt: string): Promise<string> {
  const args = ["-p", prompt, ...config.claude.extraArgs];

  return new Promise<string>((resolve, reject) => {
    const proc = spawn(config.claude.bin, args, { shell: false });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill("SIGKILL");
      reject(new Error(`claude -p hat nicht innerhalb von ${config.claude.timeoutMs}ms geantwortet (Timeout).`));
    }, config.claude.timeoutMs);

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`claude CLI konnte nicht gestartet werden (${config.claude.bin}): ${err.message}`));
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude -p beendet mit Code ${code}: ${stderr.trim()}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}
