// genesis-ai.js
// Genesis AI chat panel for the Allerion Critical Mineral Digital Twin.
//
// Wires the user-facing chat UI to the Cloudflare Workers backend
// (llm-chat-app-template/src/index.ts) and dispatches the LLM's
// tool_calls through window.TwinTools so the assistant can actually
// drive the Cesium viewer instead of just describing what would happen.
//
// Config:
//   window.GENESIS_API_BASE — defaults to "" (same-origin). Set to the
//     Worker URL (e.g. https://allerion-genesis-ai.workers.dev) when the
//     twin is served from GitHub Pages and the Worker lives elsewhere.

(function () {
  const API_BASE = window.GENESIS_API_BASE || "";
  const history = [];

  // ── DOM ────────────────────────────────────────────────────────────
  const panel = document.createElement("div");
  panel.id = "genesis-ai";
  panel.innerHTML = `
    <div id="ga-header">
      <span class="ga-dot"></span>
      <span class="ga-title">GENESIS AI</span>
      <span class="ga-meta">tool-calling · twin-native</span>
      <button id="ga-min" title="minimize">_</button>
    </div>
    <div id="ga-log">
      <div class="ga-msg system">
        <div class="ga-role">system</div>
        <div class="ga-body">Genesis AI online. I can drive the twin — try
          "fly to the Dubois mine", "show NURE geochemistry", "drop a high-priority
          drill target halfway between Indiana and the cores",
          or "what open-source BIM libraries can we plug into this?".</div>
      </div>
    </div>
    <form id="ga-form">
      <input id="ga-input" autocomplete="off" placeholder="Ask Genesis AI…" />
      <button id="ga-send" type="submit">Send</button>
    </form>
  `;
  document.body.appendChild(panel);

  const log = panel.querySelector("#ga-log");
  const form = panel.querySelector("#ga-form");
  const input = panel.querySelector("#ga-input");
  const minBtn = panel.querySelector("#ga-min");

  minBtn.onclick = () => panel.classList.toggle("ga-min");

  function add(role, text, extra) {
    const div = document.createElement("div");
    div.className = `ga-msg ${role}`;
    div.innerHTML = `<div class="ga-role">${role}</div><div class="ga-body"></div>`;
    div.children[1].textContent = text || "";
    if (extra) div.appendChild(extra);
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function toolBadge(name, args, result) {
    const wrap = document.createElement("div");
    wrap.className = "ga-tool";
    const argsStr = typeof args === "string" ? args : JSON.stringify(args);
    wrap.innerHTML = `
      <div class="ga-tool-head">→ ${name}<span>${truncate(argsStr, 140)}</span></div>
      <div class="ga-tool-result">${truncate(JSON.stringify(result), 240)}</div>
    `;
    return wrap;
  }

  function truncate(s, n) {
    if (!s) return "";
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  // ── Tool dispatch ──────────────────────────────────────────────────
  async function dispatch(toolName, rawArgs) {
    let args;
    try {
      args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
    } catch {
      args = {};
    }
    const fn = window.TwinTools && window.TwinTools[toolName];
    if (typeof fn !== "function") {
      return { ok: false, error: `unknown tool '${toolName}'` };
    }
    try {
      const out = await fn.call(window.TwinTools, args || {});
      return out;
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ── Provider-agnostic message shape ────────────────────────────────
  // The backend returns Workers AI / Anthropic style payloads. Normalize
  // them into { content, tool_calls } so the dispatcher loop is uniform.
  function normalize(payload) {
    // Workers AI Llama tool-calling shape
    if (payload && payload.response !== undefined) {
      return {
        content: typeof payload.response === "string" ? payload.response : "",
        tool_calls: payload.tool_calls || [],
      };
    }
    // OpenAI-compatible shape
    if (payload && payload.choices && payload.choices[0]) {
      const m = payload.choices[0].message || {};
      return { content: m.content || "", tool_calls: m.tool_calls || [] };
    }
    // Anthropic shape
    if (payload && Array.isArray(payload.content)) {
      let text = "";
      const tools = [];
      for (const block of payload.content) {
        if (block.type === "text") text += block.text;
        if (block.type === "tool_use") {
          tools.push({
            id: block.id,
            type: "function",
            function: { name: block.name, arguments: JSON.stringify(block.input || {}) },
          });
        }
      }
      return { content: text, tool_calls: tools };
    }
    return { content: typeof payload === "string" ? payload : "", tool_calls: [] };
  }

  async function sendChat(messages) {
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`HTTP ${r.status} · ${truncate(txt, 200)}`);
    }
    return normalize(await r.json());
  }

  // ── Conversation loop ──────────────────────────────────────────────
  async function turn(userText) {
    history.push({ role: "user", content: userText });
    add("user", userText);

    const thinking = add("assistant", "…");

    let safety = 0;
    while (safety++ < 5) {
      let resp;
      try {
        resp = await sendChat(history);
      } catch (e) {
        thinking.querySelector(".ga-body").textContent = `error · ${e.message}`;
        return;
      }

      if (resp.tool_calls && resp.tool_calls.length) {
        // Show the assistant turn (might be empty content while it's
        // emitting tool calls).
        if (resp.content) thinking.querySelector(".ga-body").textContent = resp.content;
        history.push({
          role: "assistant",
          content: resp.content || "",
          tool_calls: resp.tool_calls,
        });

        // Execute each tool, append a tool-result message for the LLM,
        // and render a badge under the assistant bubble.
        for (const tc of resp.tool_calls) {
          const name = tc.function?.name || tc.name;
          const args = tc.function?.arguments ?? tc.input ?? tc.arguments;
          const result = await dispatch(name, args);
          thinking.appendChild(toolBadge(name, args, result));
          history.push({
            role: "tool",
            tool_call_id: tc.id || `call_${name}_${Date.now()}`,
            content: JSON.stringify(result),
          });
        }
        // Loop — let the LLM react to the tool results.
        continue;
      }

      thinking.querySelector(".ga-body").textContent = resp.content || "(no reply)";
      history.push({ role: "assistant", content: resp.content || "" });
      return;
    }
    thinking.appendChild(
      Object.assign(document.createElement("div"), {
        className: "ga-tool",
        textContent: "(tool loop limit reached)",
      })
    );
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    turn(text);
  });
})();
