import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";

/**
 * Transkribiert eine Audiodatei (WAV, 16kHz mono empfohlen) lokal via whisper.cpp.
 * Ruft die kompilierte whisper.cpp-Executable auf (kein Cloud-Aufruf).
 */
export async function transcribeAudio(wavFilePath: string): Promise<string> {
  const outPrefix = path.join(config.tmpDir, randomUUID());

  const args = [
    "-m", config.whisper.model,
    "-f", wavFilePath,
    "-l", config.whisper.lang,
    "-otxt",
    "-of", outPrefix,
    "-nt", // keine Zeitstempel im Output
  ];

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(config.whisper.bin, args);

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`whisper.cpp konnte nicht gestartet werden (${config.whisper.bin}): ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`whisper.cpp beendet mit Code ${code}: ${stderr.trim()}`));
        return;
      }
      resolve();
    });
  });

  const txtPath = `${outPrefix}.txt`;
  const raw = await fs.readFile(txtPath, "utf-8");
  await fs.rm(txtPath, { force: true });

  return raw.trim();
}
