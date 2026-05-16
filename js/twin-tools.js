// twin-tools.js
// Bridge layer between Genesis AI tool calls and the Cesium viewer.
//
// Every function here matches a tool defined in the llm-chat-app-template
// backend (src/tools.ts). The LLM emits a structured tool_call; the chat
// client (genesis-ai.js) routes it to TwinTools[<name>](args) and pipes the
// result back into the conversation.
//
// All functions are synchronous-friendly: they may return a promise but
// must always resolve to a JSON-serializable summary the LLM can read.

(function () {
  const NAMED_SITES = {
    overview:  { lon: -88.374611, lat: 37.453466, alt: 1500 },
    dubois:    { lon: -88.3744,   lat: 37.4537,   alt: 600  },
    indiana:   { lon: -88.3748,   lat: 37.4532,   alt: 600  },
    lavender:  { lon: -88.3738,   lat: 37.4540,   alt: 600  },
    cores:     { lon: -88.3742,   lat: 37.4535,   alt: 400  },
    hicksdome: { lon: -88.3718,   lat: 37.4935,   alt: 2200 },
    regional:  { lon: -88.30,     lat: 37.50,     alt: 12000 },
  };

  // Drill-target pins added by drop_drill_target. Persisted so toggle_layer
  // and a future "clear targets" can find them.
  const drillTargets = [];
  // Annotations added by annotate_feature.
  const annotations = [];

  function viewerOrThrow() {
    if (typeof viewer === "undefined" || !viewer) {
      throw new Error("Cesium viewer not initialized yet.");
    }
    return viewer;
  }

  const TwinTools = {
    // ── fly_to ────────────────────────────────────────────────────────
    fly_to(args) {
      const v = viewerOrThrow();
      let lon, lat, alt;
      if (args.target === "custom") {
        if (typeof args.lon !== "number" || typeof args.lat !== "number") {
          return { ok: false, error: "custom target requires lon and lat" };
        }
        lon = args.lon; lat = args.lat;
        alt = args.altitude_m ?? 1200;
      } else {
        const site = NAMED_SITES[args.target];
        if (!site) {
          return { ok: false, error: `unknown target '${args.target}'`, known: Object.keys(NAMED_SITES) };
        }
        lon = site.lon; lat = site.lat; alt = args.altitude_m ?? site.alt;
      }
      v.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        duration: 2.0,
      });
      return { ok: true, target: args.target, lon, lat, altitude_m: alt };
    },

    // ── toggle_layer ──────────────────────────────────────────────────
    toggle_layer(args) {
      const layerName = args.layer;
      if (layerName === "bim") {
        const visible = args.visible !== undefined ? args.visible : !window.__bimVisible;
        window.__bimVisible = visible;
        if (window.BimLoader && typeof window.BimLoader.setVisible === "function") {
          window.BimLoader.setVisible(visible);
        }
        return { ok: true, layer: "bim", visible };
      }
      const layers = window.layers || {};
      const entities = layers[layerName];
      if (!entities) {
        return { ok: false, error: `unknown layer '${layerName}'`, known: Object.keys(layers) };
      }
      const current = entities.length > 0 ? entities[0].show !== false : true;
      const visible = args.visible !== undefined ? args.visible : !current;
      entities.forEach((e) => { e.show = visible; });
      // Sync the sidebar toggle button class if it exists.
      const btn = document.querySelector(`.layer-toggle[data-layer="${layerName}"]`);
      if (btn) btn.classList.toggle("active", visible);
      return { ok: true, layer: layerName, visible, entity_count: entities.length };
    },

    // ── drop_drill_target ─────────────────────────────────────────────
    drop_drill_target(args) {
      const v = viewerOrThrow();
      const priority = args.priority || "medium";
      const color = priority === "high"
        ? Cesium.Color.RED
        : priority === "low" ? Cesium.Color.YELLOW : Cesium.Color.ORANGE;
      const entity = v.entities.add({
        position: Cesium.Cartesian3.fromDegrees(args.lon, args.lat, 50),
        point: {
          pixelSize: 18,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
        },
        label: {
          text: args.label,
          font: "12px monospace",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        },
        description: args.rationale || "Proposed drill target.",
      });
      drillTargets.push({ entity, ...args });
      return {
        ok: true,
        label: args.label,
        lon: args.lon,
        lat: args.lat,
        priority,
        rationale: args.rationale,
        total_targets: drillTargets.length,
      };
    },

    // ── set_view_mode ─────────────────────────────────────────────────
    set_view_mode(args) {
      const v = viewerOrThrow();
      const m = args.mode;
      const fns = {
        "3d":           () => (v.scene.mode = Cesium.SceneMode.SCENE3D),
        "2d":           () => (v.scene.mode = Cesium.SceneMode.SCENE2D),
        "satellite":    () => window.toggleImagery && window.toggleImagery(),
        "xray":         () => window.toggleUnderground && window.toggleUnderground(),
        "sunlight":     () => window.toggleLighting && window.toggleLighting(),
        "orbit-lock":   () => window.toggleOrbitLock && window.toggleOrbitLock(),
        "split-screen": () => window.toggleSplitScreen && window.toggleSplitScreen(),
        "drone":        () => window.toggleDroneMode && window.toggleDroneMode(),
      };
      const fn = fns[m];
      if (!fn) return { ok: false, error: `unknown mode '${m}'`, known: Object.keys(fns) };
      try { fn(); } catch (e) { return { ok: false, error: e.message }; }
      return { ok: true, mode: m };
    },

    // ── load_bim_model ────────────────────────────────────────────────
    async load_bim_model(args) {
      if (!window.BimLoader || typeof window.BimLoader.loadIFC !== "function") {
        return { ok: false, error: "BIM loader not initialized" };
      }
      try {
        const result = await window.BimLoader.loadIFC({
          url: args.url,
          name: args.name || "BIM Model",
          lon: args.anchor_lon ?? NAMED_SITES.overview.lon,
          lat: args.anchor_lat ?? NAMED_SITES.overview.lat,
        });
        return { ok: true, ...result };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    // ── query_usgs ────────────────────────────────────────────────────
    async query_usgs(args) {
      const base = window.GENESIS_API_BASE || "";
      const url = new URL(`${base}/api/usgs`, window.location.href);
      url.searchParams.set("source", args.source);
      if (args.element) url.searchParams.set("element", args.element);
      try {
        const r = await fetch(url.toString());
        return await r.json();
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    // ── search_bim_registry ───────────────────────────────────────────
    async search_bim_registry(args) {
      const base = window.GENESIS_API_BASE || "";
      const url = new URL(`${base}/api/bim/search`, window.location.href);
      url.searchParams.set("q", args.capability);
      try {
        const r = await fetch(url.toString());
        return await r.json();
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    // ── annotate_feature ──────────────────────────────────────────────
    annotate_feature(args) {
      const v = viewerOrThrow();
      const featureSites = {
        dubois:   { lon: -88.3744, lat: 37.4537 },
        indiana:  { lon: -88.3748, lat: 37.4532 },
        lavender: { lon: -88.3738, lat: 37.4540 },
        "C-1":    { lon: -88.3744, lat: 37.4536 },
        "C-2":    { lon: -88.3746, lat: 37.4534 },
        "C-3":    { lon: -88.3742, lat: 37.4538 },
        "C-4":    { lon: -88.3740, lat: 37.4535 },
      };
      const site = featureSites[args.feature_id];
      if (!site) {
        return { ok: false, error: `unknown feature '${args.feature_id}'`, known: Object.keys(featureSites) };
      }
      const entity = v.entities.add({
        position: Cesium.Cartesian3.fromDegrees(site.lon, site.lat, 30),
        label: {
          text: args.text,
          font: "11px monospace",
          fillColor: Cesium.Color.fromCssColorString("#4af0c8"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(20, 0),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.75),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
        },
      });
      annotations.push({ entity, ...args });
      return { ok: true, feature_id: args.feature_id, text: args.text };
    },

    // Introspection helpers used by the chat UI.
    _list() { return Object.keys(this).filter((k) => !k.startsWith("_")); },
    _drillTargets: drillTargets,
    _annotations: annotations,
  };

  window.TwinTools = TwinTools;
})();
