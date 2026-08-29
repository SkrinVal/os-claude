import { useCallback, useRef } from "react";
import { useHudDispatch, useHudState } from "../state/store";
import { concatFloat32, encodeWavPCM16, resampleTo16kHz } from "../utils/wavEncoder";

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
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const levelRafRef = useRef<number | null>(null);
  // Rohe PCM-Aufnahme statt MediaRecorder/webm - whisper.cpp kann nur
  // echtes WAV lesen, siehe wavEncoder.ts.
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const captureSampleRateRef = useRef(16000);

  const setVoiceState = useCallback(
    (state: typeof stateRef.current, label: string) => {
      stateRef.current = state;
      dispatch({ type: "SET_VOICE_STATE", state, label });
    },
    [dispatch]
  );

  const meterLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || (stateRef.current !== "listening" && stateRef.current !== "speaking")) {
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
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }
    dispatch({ type: "SET_MIC_LEVEL", level: 0 });
  }, [dispatch]);

  const sendRecording = useCallback(async () => {
    setVoiceState("thinking", "DENKT NACH");
    const raw = concatFloat32(pcmChunksRef.current);
    const resampled = await resampleTo16kHz(raw, captureSampleRateRef.current);
    const blob = encodeWavPCM16(resampled, 16000);
    const form = new FormData();
    form.append("audio", blob, "input.wav");

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
        const finish = () => {
          stopTracks();
          setVoiceState("idle", "BEREIT");
        };
        audio.onended = finish;
        audio.onerror = finish;

        // Analyser auf die Wiedergabe legen, statt nur beim Zuhoeren zu
        // messen - der Ring soll sichtbar auf die tatsaechliche Antwort-
        // Lautstaerke reagieren, nicht nur waehrend der Aufnahme.
        try {
          const AudioCtx =
            window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioCtx();
          const source = audioCtx.createMediaElementSource(audio);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          audioCtxRef.current = audioCtx;
          analyserRef.current = analyser;
          levelRafRef.current = requestAnimationFrame(meterLevel);
        } catch {
          // Web-Audio-Analyse ist ein Zusatz - schlaegt sie fehl, spielt
          // die Antwort trotzdem ganz normal ab, nur ohne Ring-Reaktion.
        }

        await audio.play().catch(finish);
      } else {
        setVoiceState("idle", "BEREIT");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      dispatch({ type: "SET_VOICE_STATE", state: "error", label: message });
      setTimeout(() => setVoiceState("idle", "BEREIT"), 3000);
    }
  }, [dispatch, meterLevel, setVoiceState, stopTracks]);

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

      // Rohe PCM-Samples mitschneiden statt MediaRecorder/webm - whisper.cpp
      // kann nur echtes WAV lesen (siehe sendRecording/wavEncoder.ts). Der
      // ScriptProcessor muss an ein (stummes) Gain-Node bis zur destination
      // haengen, sonst feuert onaudioprocess in manchen Browsern gar nicht.
      captureSampleRateRef.current = audioCtx.sampleRate;
      pcmChunksRef.current = [];
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        pcmChunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      const silentGain = audioCtx.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioCtx.destination);
      processorRef.current = processor;

      setVoiceState("listening", "HÖRT ZU");
      levelRafRef.current = requestAnimationFrame(meterLevel);
    } catch {
      setVoiceState("error", "KEIN MIKROFON");
      setTimeout(() => setVoiceState("idle", "BEREIT"), 2500);
    }
  }, [meterLevel, setVoiceState]);

  const stop = useCallback(() => {
    if (stateRef.current !== "listening") return;
    stopTracks();
    sendRecording();
  }, [sendRecording, stopTracks]);

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
