// Allerion Digital Twin — dev server.
//
// Serves the static twin (Cesium pages + Genesis AI panel) and proxies
// /api/* to the Genesis AI Cloudflare Worker so the chat panel can call
// the LLM during local development without CORS gymnastics.
//
// In production the twin is served from GitHub Pages and points the
// chat panel directly at the deployed Worker via:
//   window.GENESIS_API_BASE = "https://allerion-genesis-ai.workers.dev";

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const GENESIS_WORKER =
  process.env.GENESIS_WORKER_URL || "http://127.0.0.1:8787";

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ── Genesis AI Worker proxy ───────────────────────────────────────────
app.all("/api/*", async (req, res) => {
  const target = `${GENESIS_WORKER}${req.originalUrl}`;
  try {
    const init = {
      method: req.method,
      headers: { "Content-Type": req.get("Content-Type") || "application/json" },
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = JSON.stringify(req.body);
    }
    const r = await fetch(target, init);
    res.status(r.status);
    r.headers.forEach((v, k) => {
      if (!["content-encoding", "transfer-encoding"].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    });
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(502).json({ error: `proxy to ${target} failed: ${e.message}` });
  }
});

// ── Legacy tools endpoint (still referenced by older clients) ─────────
app.get("/api/tools/gaussian-splatting", (_req, res) => {
  res.json({
    assetId: 2464651,
    source: "https://sandcastle.cesium.com/?id=3d-tiles-gaussian-splatting-comparison",
    status: "Available for client-side injection",
  });
});

// ── Static assets last ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, ".")));

app.listen(PORT, () => {
  console.log(`[Allerion Digital Twin] Static + Genesis AI proxy on port ${PORT}`);
  console.log(`[Allerion Digital Twin] Proxying /api/* → ${GENESIS_WORKER}`);
});
