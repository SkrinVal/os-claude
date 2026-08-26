import { Router } from "express";
import os from "node:os";
import { getHistory } from "../util/history";

export const statusRouter = Router();

statusRouter.get("/status", (_req, res) => {
  const loadAvg = os.loadavg();
  res.json({
    uptimeSec: Math.round(process.uptime()),
    cpuCount: os.cpus().length,
    loadAvg1m: loadAvg[0],
    freeMemMb: Math.round(os.freemem() / 1024 / 1024),
    totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
    hostname: os.hostname(),
  });
});

statusRouter.get("/history", (_req, res) => {
  res.json(getHistory());
});
