// bim-loader.js
// BIM / IFC integration for the Allerion Digital Twin.
//
// Strategy:
//   * The user (or Genesis AI) loads an IFC file by URL.
//   * Parsing/rendering is delegated to ThatOpen Components (web-ifc),
//     loaded lazily from a CDN ESM bundle so the twin's "no build step"
//     constraint still holds.
//   * Output is rendered into a floating overlay panel inside the twin
//     (positioned over Cesium). This keeps geometry interactive without
//     forcing a Cesium-native 3D Tiles conversion on the client.
//   * A future enhancement (#1 in BIM_INTEGRATIONS.md) converts the IFC
//     to 3D Tiles server-side and overlays it directly on the globe.
//
// All public surface lives on window.BimLoader so genesis-ai.js and
// twin-tools.js can invoke it via the LLM tool catalog.

(function () {
  const CDN_COMPONENTS = "https://unpkg.com/@thatopen/components@2.4.0/dist/index.mjs";
  const CDN_FRAGMENTS  = "https://unpkg.com/@thatopen/fragments@2.4.0/dist/index.mjs";
  const CDN_THREE      = "https://unpkg.com/three@0.160.0/build/three.module.js";

  let panel = null;       // floating viewport DOM
  let components = null;  // ThatOpen Components OBC instance
  let world = null;
  let fragmentManager = null;
  let loadedModels = [];

  function buildPanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "bim-viewport";
    Object.assign(panel.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "420px",
      height: "320px",
      background: "rgba(4,5,6,0.95)",
      border: "1px solid #5a6850",
      zIndex: "9999",
      boxShadow: "0 0 40px rgba(0,0,0,0.6)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "monospace",
      color: "#d1d5db",
    });
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:6px 10px;background:#0c0e10;border-bottom:1px solid #5a6850;
                  font-size:11px;letter-spacing:0.1em;color:#5a6850;">
        <span>◧ BIM VIEWPORT · ThatOpen Components</span>
        <span>
          <button id="bim-min" style="background:none;border:none;color:#9da2a6;cursor:pointer;">_</button>
          <button id="bim-close" style="background:none;border:none;color:#9da2a6;cursor:pointer;">×</button>
        </span>
      </div>
      <div id="bim-canvas-wrap" style="flex:1;position:relative;"></div>
      <div id="bim-status" style="padding:4px 10px;font-size:10px;color:#6b7280;
                                  border-top:1px solid #1a1f1a;background:#020202;">idle</div>
    `;
    document.body.appendChild(panel);
    panel.querySelector("#bim-close").onclick = () => (panel.style.display = "none");
    panel.querySelector("#bim-min").onclick = () => {
      const wrap = panel.querySelector("#bim-canvas-wrap");
      wrap.style.display = wrap.style.display === "none" ? "" : "none";
    };
    return panel;
  }

  function setStatus(text) {
    const p = buildPanel();
    p.querySelector("#bim-status").textContent = text;
  }

  async function ensureComponents() {
    if (components) return { components, world, fragmentManager };
    setStatus("loading ThatOpen Components from CDN…");
    let OBC, OBF, THREE;
    try {
      [OBC, OBF, THREE] = await Promise.all([
        import(/* webpackIgnore: true */ CDN_COMPONENTS),
        import(/* webpackIgnore: true */ CDN_FRAGMENTS),
        import(/* webpackIgnore: true */ CDN_THREE),
      ]);
    } catch (e) {
      setStatus("ESM import failed: " + e.message);
      throw e;
    }

    const wrap = buildPanel().querySelector("#bim-canvas-wrap");
    components = new OBC.Components();
    const worlds = components.get(OBC.Worlds);
    world = worlds.create();
    world.scene = new OBC.SimpleScene(components);
    world.renderer = new OBC.SimpleRenderer(components, wrap);
    world.camera = new OBC.SimpleCamera(components);
    components.init();
    world.scene.setup();
    world.scene.three.background = new THREE.Color(0x040506);
    world.camera.controls.setLookAt(12, 8, 12, 0, 0, 0);

    fragmentManager = components.get(OBC.FragmentsManager);
    setStatus("ready");
    return { components, world, fragmentManager };
  }

  async function loadIFC({ url, name, lon, lat }) {
    buildPanel().style.display = "flex";
    await ensureComponents();
    setStatus(`fetching ${url}…`);

    let bytes;
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`fetch failed: HTTP ${r.status}`);
      bytes = new Uint8Array(await r.arrayBuffer());
    } catch (e) {
      setStatus("fetch failed: " + e.message);
      throw e;
    }

    setStatus(`parsing IFC (${(bytes.byteLength / 1024).toFixed(0)} KB)…`);
    // ThatOpen Components > IfcLoader API
    const OBC = await import(/* webpackIgnore: true */ CDN_COMPONENTS);
    const ifcLoader = components.get(OBC.IfcLoader);
    await ifcLoader.setup();
    const model = await ifcLoader.load(bytes);
    world.scene.three.add(model);
    loadedModels.push({ model, name, url, lon, lat });

    setStatus(`loaded · ${name || "model"} · ${loadedModels.length} total`);

    // Drop a Cesium pin at the BIM anchor so the user can see where on the
    // map the model is anchored. Future work: render the IFC directly into
    // Cesium as a 3D Tileset (see BIM_INTEGRATIONS.md §Future).
    if (typeof viewer !== "undefined" && viewer && typeof lon === "number" && typeof lat === "number") {
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 100),
        billboard: undefined,
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString("#5a6850"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: `BIM · ${name || "model"}`,
          font: "11px monospace",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        },
      });
    }

    return {
      name,
      url,
      bytes: bytes.byteLength,
      anchored_at: { lon, lat },
      panel: "#bim-viewport",
    };
  }

  function setVisible(v) {
    if (!panel) return;
    panel.style.display = v ? "flex" : "none";
  }

  window.BimLoader = { loadIFC, setVisible, _loaded: loadedModels };
})();
