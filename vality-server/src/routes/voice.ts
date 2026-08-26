import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import { transcribeAudio } from "../stt/whisper";
import { askClaude } from "../brain/claude";
import { synthesizeSpeech } from "../tts/piper";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";

export const voiceRouter = Router();

const upload = multer({ dest: config.tmpDir });

voiceRouter.post("/voice", upload.single("audio"), async (req, res) => {
  const uploaded = req.file;
  if (!uploaded) {
    res.status(400).json({ error: "Kein Audio empfangen (Feld 'audio' fehlt)." });
    return;
  }

  const id = randomUUID();
  broadcast({ type: "mic_status", listening: false });

  try {
    const transcript = await transcribeAudio(uploaded.path);
    if (!transcript) {
      res.status(422).json({ error: "Whisper hat keinen Text erkannt." });
      return;
    }

    const reply = await askClaude(transcript);
    const audioPath = await synthesizeSpeech(reply);
    const audioUrl = `/audio/${path.basename(audioPath)}`;
    const ts = new Date().toISOString();

    addInteraction({ id, transcript, reply, audioUrl, ts });
    broadcast({ type: "interaction", id, transcript, reply, ts });

    res.json({ id, transcript, reply, audioUrl, ts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    broadcast({ type: "error", message, ts: new Date().toISOString() });
    res.status(500).json({ error: message });
  } finally {
    await fs.rm(uploaded.path, { force: true });
  }
});
