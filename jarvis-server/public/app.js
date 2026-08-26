const pttButton = document.getElementById("pttButton");
const coreWrap = document.querySelector(".core-wrap");
const micStatus = document.getElementById("micStatus");
const coreLabel = document.getElementById("coreLabel");
const logList = document.getElementById("logList");
const connStatus = document.getElementById("connStatus");
const replyAudio = document.getElementById("replyAudio");

let mediaRecorder = null;
let chunks = [];
let recording = false;

function setState(state) {
  coreWrap.classList.remove("listening", "thinking");
  micStatus.dataset.state = state;
  if (state === "listening") {
    coreWrap.classList.add("listening");
    micStatus.textContent = "HÖRT ZU";
    coreLabel.textContent = "LOSLASSEN\nZUM SENDEN";
  } else if (state === "thinking") {
    coreWrap.classList.add("thinking");
    micStatus.textContent = "VERARBEITET";
    coreLabel.textContent = "DENKT\nNACH";
  } else if (state === "error") {
    micStatus.textContent = "FEHLER";
    coreLabel.textContent = "HALTEN\nZUM SPRECHEN";
  } else {
    micStatus.textContent = "BEREIT";
    coreLabel.textContent = "HALTEN\nZUM SPRECHEN";
  }
}

function renderEntry(entry) {
  document.querySelector(".log-list .empty")?.remove();
  const el = document.createElement("div");
  el.className = "log-entry";
  const time = new Date(entry.ts).toLocaleTimeString("de-DE");
  el.innerHTML = `
    <div class="ts">${time}</div>
    <div class="you">DU: ${escapeHtml(entry.transcript)}</div>
    <div class="reply">JARVIS: ${escapeHtml(entry.reply)}</div>
  `;
  logList.prepend(el);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function startRecording() {
  if (recording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      sendRecording();
    };
    mediaRecorder.start();
    recording = true;
    setState("listening");
  } catch (err) {
    console.error(err);
    setState("error");
    micStatus.textContent = "KEIN MIKROFON";
  }
}

function stopRecording() {
  if (!recording) return;
  recording = false;
  mediaRecorder?.stop();
}

async function sendRecording() {
  setState("thinking");
  const blob = new Blob(chunks, { type: "audio/webm" });
  const form = new FormData();
  form.append("audio", blob, "input.webm");

  try {
    const res = await fetch("/api/voice", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");

    renderEntry(data);
    if (data.audioUrl) {
      replyAudio.src = data.audioUrl;
      replyAudio.play().catch(() => {});
    }
    setState("idle");
  } catch (err) {
    console.error(err);
    setState("error");
    micStatus.textContent = String(err.message || err);
    setTimeout(() => setState("idle"), 3000);
  }
}

pttButton.addEventListener("mousedown", startRecording);
pttButton.addEventListener("touchstart", (e) => { e.preventDefault(); startRecording(); });
pttButton.addEventListener("mouseup", stopRecording);
pttButton.addEventListener("mouseleave", () => { if (recording) stopRecording(); });
pttButton.addEventListener("touchend", (e) => { e.preventDefault(); stopRecording(); });

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !e.repeat) { e.preventDefault(); startRecording(); }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space") { e.preventDefault(); stopRecording(); }
});

function connectWs() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws`);

  ws.onopen = () => { connStatus.dataset.state = "up"; connStatus.querySelector("span").textContent = ""; };
  ws.onclose = () => { connStatus.dataset.state = "down"; setTimeout(connectWs, 2000); };
  ws.onerror = () => ws.close();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "error") {
      setState("error");
      micStatus.textContent = msg.message;
      setTimeout(() => setState("idle"), 3000);
    }
  };
}

async function pollStatus() {
  try {
    const res = await fetch("/api/status");
    const s = await res.json();
    document.getElementById("statHost").textContent = s.hostname;
    document.getElementById("statUptime").textContent = `${Math.floor(s.uptimeSec / 60)} min`;
    document.getElementById("statCpu").textContent = s.cpuCount;
    document.getElementById("statLoad").textContent = s.loadAvg1m.toFixed(2);
    document.getElementById("statMem").textContent = `${s.totalMemMb - s.freeMemMb} / ${s.totalMemMb} MB`;
  } catch (err) {
    console.error(err);
  }
}

async function loadHistory() {
  try {
    const res = await fetch("/api/history");
    const items = await res.json();
    items.reverse().forEach(renderEntry);
  } catch (err) {
    console.error(err);
  }
}

setState("idle");
connectWs();
loadHistory();
pollStatus();
setInterval(pollStatus, 5000);
