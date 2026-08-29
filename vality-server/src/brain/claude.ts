import { spawn } from "node:child_process";
import os from "node:os";
import { config } from "../config";

/**
 * Schickt einen Prompt an die lokal installierte Claude Code CLI (`claude -p`).
 * Nutzt das bestehende Claude-Abo des Nutzers statt einer separaten API mit eigenem Billing.
 */
export async function askClaude(prompt: string): Promise<string> {
  const args = ["-p", prompt, ...config.claude.extraArgs];

  return new Promise<string>((resolve, reject) => {
    // Auf Windows ist eine global per npm installierte CLI wie "claude" ein
    // .cmd-Shim, kein echtes .exe - spawn() mit shell:false findet das nicht
    // (CreateProcess kennt .cmd nicht, PATHEXT wird nur ueber eine Shell
    // aufgeloest). Deshalb dort ueber die Shell starten, auf Mac/Linux wie
    // bisher direkt (whisper.cpp/Piper sind echte Binaries, davon nicht
    // betroffen, siehe stt/whisper.ts, tts/piper.ts).
    //
    // cwd bewusst auf ein Verzeichnis AUSSERHALB dieses Repos gesetzt: die
    // Claude-CLI sucht beim Start selbststaendig nach einer CLAUDE.md im
    // aktuellen und in allen Elternverzeichnissen. Liefe sie mit dem
    // Arbeitsverzeichnis dieses Servers (irgendwo unter os-claude/), wuerde
    // sie die CLAUDE.md im Repo-Root laden - die gehoert aber zu einem
    // komplett anderen, unabhaengigen Projekt in diesem Repo und wuerde
    // Vality voellig fremde Verhaltensregeln aufzwingen (siehe Session:
    // "Woran soll ich arbeiten?" statt einer normalen Antwort).
    const proc = spawn(config.claude.bin, args, {
      shell: process.platform === "win32",
      cwd: os.tmpdir(),
    });

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
