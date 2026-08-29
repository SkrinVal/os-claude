// whisper.cpp liest ausschliesslich echtes WAV/PCM - der Browser kann aber
// nur komprimierte Formate wie webm/opus aufnehmen (MediaRecorder). Deshalb
// wird hier client-seitig aus rohen PCM-Samples ein 16kHz-Mono-WAV gebaut,
// statt die Aufnahme unkonvertiert an den Server zu schicken.

// Nutzt den eingebauten Resampler des Browsers (OfflineAudioContext bei der
// gewuenschten Zielrate rendern) statt einer selbstgebauten linearen
// Interpolation - bei ueblichen Aufnahmeraten wie 48000Hz ist 48000/16000
// exakt 3, eine einfache lineare Interpolation entartet dann zu reiner
// Dezimierung (jeder dritte Sample, ohne Tiefpassfilter) und aliast hoerbar,
// was die Erkennung messbar verschlechtert. Der Browser-Resampler filtert
// sauber vor.
export async function resampleTo16kHz(input: Float32Array, inputSampleRate: number): Promise<Float32Array> {
  if (inputSampleRate === 16000) return input;

  const targetLength = Math.max(1, Math.ceil((input.length * 16000) / inputSampleRate));
  const offlineCtx = new OfflineAudioContext(1, targetLength, 16000);
  const buffer = offlineCtx.createBuffer(1, input.length, inputSampleRate);
  buffer.copyToChannel(Float32Array.from(input), 0);

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start();

  const rendered = await offlineCtx.startRendering();
  return rendered.getChannelData(0);
}

export function encodeWavPCM16(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM-Chunk-Groesse
  view.setUint16(20, 1, true); // Audioformat = PCM
  view.setUint16(22, 1, true); // 1 Kanal (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // Byte-Rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // Bits pro Sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function concatFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
