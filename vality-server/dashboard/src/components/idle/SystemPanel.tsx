import { useEffect, useState } from "react";
import { useHudState } from "../../state/store";
import HudFrame from "../layout/HudFrame";
import "./SystemPanel.css";

type MicPermission = "granted" | "denied" | "prompt" | "unbekannt";

function useMicPermission(): MicPermission {
  const [state, setState] = useState<MicPermission>("unbekannt");

  useEffect(() => {
    let status: PermissionStatus | null = null;
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((result) => {
        status = result;
        setState(result.state as MicPermission);
        result.onchange = () => setState(result.state as MicPermission);
      })
      .catch(() => setState("unbekannt"));
    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  return state;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SystemPanel({ delay }: { delay?: number }) {
  const { system } = useHudState();
  const micPermission = useMicPermission();

  return (
    <HudFrame title="System" className="system-panel" delay={delay}>
      <dl className="system-panel__grid">
        <div className="system-panel__item">
          <dt>Host</dt>
          <dd className="mono">{system?.hostname ?? "—"}</dd>
        </div>
        <div className="system-panel__item">
          <dt>Laufzeit</dt>
          <dd className="mono">{system ? formatUptime(system.uptimeSec) : "—"}</dd>
        </div>
        <div className="system-panel__item">
          <dt>CPU-Kerne</dt>
          <dd className="mono">{system?.cpuCount ?? "—"}</dd>
        </div>
        <div className="system-panel__item">
          <dt>Last (1m)</dt>
          <dd className="mono">{system ? system.loadAvg1m.toFixed(2) : "—"}</dd>
        </div>
        <div className="system-panel__item system-panel__item--wide">
          <dt>Speicher</dt>
          <dd className="mono">
            {system ? `${system.totalMemMb - system.freeMemMb} / ${system.totalMemMb} MB` : "—"}
          </dd>
        </div>
        <div className="system-panel__item system-panel__item--wide">
          <dt>Mikrofon</dt>
          <dd className={`mono system-panel__mic system-panel__mic--${micPermission}`}>
            {{
              granted: "ERLAUBT",
              denied: "BLOCKIERT",
              prompt: "NOCH NICHT GEFRAGT",
              unbekannt: "UNBEKANNT",
            }[micPermission]}
          </dd>
        </div>
      </dl>
    </HudFrame>
  );
}
