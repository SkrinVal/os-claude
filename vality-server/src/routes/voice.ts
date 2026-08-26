import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "../config";
import { features } from "../config/features";
import { transcribeAudio } from "../stt/whisper";
import { askClaude } from "../brain/claude";
import { synthesizeSpeech } from "../tts/piper";
import { addInteraction } from "../util/history";
import { broadcast } from "../ws/hub";
import { handleMemoryCommand } from "../memory/commands";
import { buildPromptContext } from "../memory/context";
import { recordConversationTurn } from "../memory/store";
import { handleMessageCommand } from "../messages/commands";
import { handleCallCommand } from "../calls/commands";
import { handleConfirmCommand } from "../shared/confirmCommands";
import { handleHudCommand } from "../hud/commands";

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

    const confirmResult =
      features.messages || features.calls ? await handleConfirmCommand(transcript) : null;
    const messageResult =
      !confirmResult && features.messages ? await handleMessageCommand(transcript) : null;
    const callResult =
      !confirmResult && !messageResult && features.calls ? await handleCallCommand(transcript) : null;
    const hudResult =
      !confirmResult && !messageResult && !callResult ? await handleHudCommand(transcript) : null;
    const memoryResult =
      !confirmResult && !messageResult && !callResult && !hudResult && features.memory
        ? await handleMemoryCommand(transcript)
        : null;

    let reply: string;
    if (confirmResult) {
      reply = confirmResult.reply;
    } else if (messageResult) {
      reply = messageResult.reply;
    } else if (callResult) {
      reply = callResult.reply;
    } else if (hudResult) {
      reply = hudResult.reply;
    } else if (memoryResult) {
      reply = memoryResult.reply;
    } else if (features.memory) {
      const contextBlock = await buildPromptContext();
      const prompt = contextBlock ? `${contextBlock}Aktuelle Anfrage: ${transcript}` : transcript;
      reply = await askClaude(prompt);
    } else {
      reply = await askClaude(transcript);
    }

    if (features.memory) {
      await recordConversationTurn(transcript, reply);
    }

    const audioPath = await synthesizeSpeech(reply);
    const audioUrl = `/audio/${path.basename(audioPath)}`;
    const ts = new Date().toISOString();

    addInteraction({ id, transcript, reply, audioUrl, ts });
    broadcast({ type: "interaction", id, transcript, reply, audioUrl, ts });

    res.json({ id, transcript, reply, audioUrl, ts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    broadcast({ type: "error", message, ts: new Date().toISOString() });
    res.status(500).json({ error: message });
  } finally {
    await fs.rm(uploaded.path, { force: true });
  }
});
