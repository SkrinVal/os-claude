import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { config } from "../config";

/**
 * Synthetisiert Text lokal/offline zu einer WAV-Datei via Piper.
 * Gibt den absoluten Pfad der erzeugten Datei zurueck (liegt in data/audio-out).
 */
export async function synthesizeSpeech(text: string): Promise<string> {
  const outFile = path.join(config.audioOutDir, `${randomUUID()}.wav`);

  const args = [
    "--model", config.piper.model,
    "--output_file", outFile,
  ];
  if (config.piper.modelConfig) {
    args.push("--config", config.piper.modelConfig);
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(config.piper.bin, args, { shell: false });

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`Piper konnte nicht gestartet werden (${config.piper.bin}): ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Piper beendet mit Code ${code}: ${stderr.trim()}`));
        return;
      }
      resolve();
    });

    proc.stdin.write(text);
    proc.stdin.end();
  });

  return outFile;
}
