import { useCallback, useRef } from "react";
import { useHudDispatch, useHudState } from "../state/store";

interface VoiceResponse {
  id: string;
  transcript: string;
  reply: string;
  audioUrl: string | null;
  ts: string;
}

// Tippen-zum-Umschalten statt Gedrueckt-halten: zuverlaessiger auf Touch
// und vermeidet, dass ein Loslassen aus Versehen verpasst wird.
export function useMicRecorder() {
  const dispatch = useHudDispatch();
  const { audioMuted } = useHudState();
  const mutedRef = useRef(audioMuted);
  mutedRef.current = audioMuted;
  const stateRef = useRef<"idle" | "listening" | "thinking" | "speaking" | "error">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRafRef = useRef<number | null>(null);

  const setVoiceState = useCallback(
    (state: typeof stateRef.current, label: string) => {
      stateRef.current = state;
      dispatch({ type: "SET_VOICE_STATE", state, label });
    },
    [dispatch]
  );

  const meterLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || stateRef.current !== "listening") {
      dispatch({ type: "SET_MIC_LEVEL", level: 0 });
      levelRafRef.current = null;
      return;
    }
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const centered = (data[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / data.length);
    dispatch({ type: "SET_MIC_LEVEL", level: Math.min(1, rms * 4) });
    levelRafRef.current = requestAnimationFrame(meterLevel);
  }, [dispatch]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
  }, []);

  const sendRecording = useCallback(async () => {
    setVoiceState("thinking", "DENKT NACH");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const form = new FormData();
    form.append("audio", blob, "input.webm");

    try {
      const res = await fetch("/api/voice", { method: "POST", body: form });
      const data: VoiceResponse | { error: string } = await res.json();
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Unbekannter Fehler");
      }

      dispatch({
        type: "ADD_LOG_ENTRY",
        entry: { id: data.id, transcript: data.transcript, reply: data.reply, ts: data.ts },
      });

      if (data.audioUrl && !mutedRef.current) {
        setVoiceState("speaking", "SPRICHT");
        const audio = new Audio(data.audioUrl);
        audio.onended = () => setVoiceState("idle", "BEREIT");
        audio.onerror = () => setVoiceState("idle", "BEREIT");
        await audio.play().catch(() => setVoiceState("idle", "BEREIT"));
      } else {
        setVoiceState("idle", "BEREIT");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: "SET_VOICE_STATE", state: "error", label: message });
      setTimeout(() => setVoiceState("idle", "BEREIT"), 3000);
    }
  }, [dispatch, setVoiceState]);

  const start = useCallback(async () => {
    if (stateRef.current !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stopTracks();
        sendRecording();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();

      setVoiceState("listening", "HÖRT ZU");
      levelRafRef.current = requestAnimationFrame(meterLevel);
    } catch {
      setVoiceState("error", "KEIN MIKROFON");
      setTimeout(() => setVoiceState("idle", "BEREIT"), 2500);
    }
  }, [meterLevel, sendRecording, setVoiceState, stopTracks]);

  const stop = useCallback(() => {
    if (stateRef.current !== "listening") return;
    mediaRecorderRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (stateRef.current === "idle") {
      start();
    } else if (stateRef.current === "listening") {
      stop();
    } else if (stateRef.current === "error") {
      setVoiceState("idle", "BEREIT");
    }
    // waehrend "thinking"/"speaking" bewusst keine Aktion - erst BEREIT
    // abwarten, damit keine halbfertige Aufnahme durcheinanderkommt.
  }, [setVoiceState, start, stop]);

  return { toggle };
}
