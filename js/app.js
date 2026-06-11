(() => {
  'use strict';

  const CONFIG = {
    cesiumIonToken:
      window.ALLERION_CONFIG?.cesiumIonToken ||
      window.CESIUM_ION_TOKEN ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMzU4MzVlMC05ZTkzLTQ1ZTgtYmY5OC0yZWM0NTc0MjMxODYiLCJpZCI6MTU1MTcyLCJpYXQiOjE3NzUwNjk5NTl9.nyYiYSYBYNWGRN7IcQxRUWGTGkVHitg6BtKcYTZ5-9E',
    initialHeight: 1200,
  };

  const SITE = {
    dubois: { id: 'DH-1', lon: -88.3744, lat: 37.4537, depth: 250 },
    indiana: { id: 'DH-2', lon: -88.3748, lat: 37.4532, depth: 280 },
    lavender: { id: 'DH-3', lon: -88.3738, lat: 37.4540, depth: 260 },
    propCenter: { lon: -88.374611, lat: 37.453466 },
    hicksDome: { lon: -88.3718, lat: 37.4935 },
  };

  const LAYER_NAMES = [
    'mines',
    'cores',
    'veins',
    'hree',
    'lree',
    'property',
    'hicksdome',
    'earthmri',
    'interpolation',
    'buildings',
    'pointcloud',
    'tilesets',
    'nure',
  ];

  const state = {
    viewer: null,
    bridge: null,
    splitViewer: null,
    orbitLocked: false,
    satelliteMode: false,
    undergroundMode: false,
    detailById: new Map(),
    layers: Object.fromEntries(LAYER_NAMES.map((name) => [name, []])),
    status: [],
  };

  function boot() {
    if (!window.Cesium) {
      showFatal('Cesium did not load. Check the network connection or CDN availability.');
      return;
    }

    Cesium.Ion.defaultAccessToken = CONFIG.cesiumIonToken;
    window.ALLERION_SITE = SITE;
    window.ALLERION_LAYERS = state.layers;

    state.viewer = createViewer('cesiumContainer', {
      timeline: true,
      animation: true,
      vrButton: true,
      navigationHelpButton: true,
    });
    window.viewer = state.viewer;

    state.viewer.scene.globe.depthTestAgainstTerrain = true;
    state.viewer.scene.verticalExaggeration = 2.5;
    state.viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#182018');

    wireWindowApi();
    buildStatusPanel();
    addOperationalLayers();
    wireEntityInspector();
    wireCoordinateDisplay();
    initializeAgentBridge();
    loadExternalCesiumAssets();
    flyTo('overview');

    state.viewer.clock.onTick.addEventListener(() => {
      if (state.orbitLocked) {
        state.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, 0.00025);
      }
    });

    reportStatus('Twin core online', 'ok');
  }

  function createViewer(containerId, options = {}) {
    return new Cesium.Viewer(containerId, {
      sceneMode: Cesium.SceneMode.SCENE3D,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      sceneModePicker: true,
      selectionIndicator: false,
      infoBox: false,
      msaaSamples: 4,
      ...options,
    });
  }

  function wireWindowApi() {
    window.flyTo = flyTo;
    window.toggleLayer = toggleLayer;
    window.setView = setView;
    window.toggleImagery = toggleImagery;
    window.toggleOrbitLock = toggleOrbitLock;
    window.toggleSplitScreen = toggleSplitScreen;
    window.toggleUnderground = toggleUnderground;
    window.toggleLighting = toggleLighting;
    window.closeDetail = closeDetail;
  }

  function initializeAgentBridge() {
    if (!window.CesiumMcpBridge?.CesiumBridge) {
      window.allerionTwin = createAllerionTwinApi(null);
      reportStatus('AI bridge CDN unavailable; local twin commands only', 'warn');
      return;
    }

    state.bridge = new window.CesiumMcpBridge.CesiumBridge(state.viewer);
    window.allerionTwin = createAllerionTwinApi(state.bridge);
    reportStatus('Cesium AI bridge online', 'ok');
  }

  function createAllerionTwinApi(bridge) {
    return {
      site: SITE,
      layers: state.layers,
      bridge,
      execute,
      commands: [
        'showParcel',
        'showRareEarthTargets',
        'runDroneSurvey',
        'addDrillTarget',
        'exportTwinState',
        'loadSplatAsset',
      ],
    };

    async function execute(command, params = {}) {
      const action = typeof command === 'string' ? command : command?.action;
      const payload = typeof command === 'string' ? params : command?.params || {};

      if (!action) {
        throw new Error('Missing Cesium command action');
      }

      if (action in customTwinCommands) {
        const result = await customTwinCommands[action](payload);
        reportStatus(`AI command executed: ${action}`, 'ok');
        return result;
      }

      if (!bridge) {
        throw new Error(`Cesium AI bridge is unavailable for generic command: ${action}`);
      }

      const result = await bridge.execute({ action, params: payload });
      reportStatus(`Bridge command executed: ${action}`, 'ok');
      return result;
    }
  }

  const customTwinCommands = {
    showParcel: async () => {
      setLayerVisibility('property', true);
      flyTo('overview');
      return { success: true, layer: 'property' };
    },
    showRareEarthTargets: async () => {
      ['hree', 'lree', 'interpolation', 'nure'].forEach((name) => setLayerVisibility(name, true));
      flyTo('overview');
      return { success: true, layers: ['hree', 'lree', 'interpolation', 'nure'] };
    },
    runDroneSurvey: async () => {
      if (!document.getElementById('drone-hud')?.classList.contains('active')) {
        window.toggleDroneMode?.();
      }
      return { success: true, mode: 'drone-survey' };
    },
    addDrillTarget: async ({ longitude, latitude, label = 'AI Drill Target', depth = 180, priority = 'HIGH' }) => {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new Error('addDrillTarget requires numeric longitude and latitude');
      }

      const target = addEntity(
        'interpolation',
        {
          type: 'AI Drill Target',
          title: label,
          body: `Agent-proposed drill target. Depth estimate: ${depth} ft. Priority: ${priority}.`,
        },
        {
          name: label,
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 8),
          point: {
            pixelSize: 15,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: label,
            font: '700 10px monospace',
            fillColor: Cesium.Color.RED,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            pixelOffset: new Cesium.Cartesian2(0, -24),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        },
      );

      state.viewer.flyTo(target, { duration: 1.2 });
      return { success: true, entityId: target.id };
    },
    exportTwinState: async () => {
      const camera = state.viewer.camera;
      const cartographic = Cesium.Cartographic.fromCartesian(camera.positionWC);

      return {
        success: true,
        camera: {
          longitude: Cesium.Math.toDegrees(cartographic.longitude),
          latitude: Cesium.Math.toDegrees(cartographic.latitude),
          height: cartographic.height,
          heading: Cesium.Math.toDegrees(camera.heading),
          pitch: Cesium.Math.toDegrees(camera.pitch),
          roll: Cesium.Math.toDegrees(camera.roll),
        },
        layers: Object.fromEntries(
          Object.entries(state.layers).map(([name, items]) => [
            name,
            { count: items.length, visible: items.some((item) => item.show !== false) },
          ]),
        ),
        bridgeOnline: Boolean(state.bridge),
      };
    },
    loadSplatAsset: async () => ({
      success: false,
      reason: 'Gaussian splatting source code is cloned locally, but the twin needs a Three.js overlay bundle before splat assets can be loaded.',
    }),
  };

  function addOperationalLayers() {
    addMineLayer();
    addCoreLayer();
    addVeinLayer();
    addResourceZones();
    addPropertyBoundary();
    addRegionalLayers();
    addInterpolationLayer();
    addNureLayer();
    addTilesetPlaceholders();
  }

  function register(entityOrPrimitive, layerName) {
    state.layers[layerName].push(entityOrPrimitive);
    return entityOrPrimitive;
  }

  function addEntity(layerName, detail, entity) {
    const created = state.viewer.entities.add(entity);
    register(created, layerName);
    if (detail) {
      state.detailById.set(created.id, detail);
    }
    return created;
  }

  function addMineLayer() {
    const mines = [
      {
        id: 'DH-1',
        name: 'Dubois Mine Shaft',
        lon: SITE.dubois.lon,
        lat: SITE.dubois.lat,
        color: Cesium.Color.GOLD,
        body: 'Confirmed historical shaft. Current surface twin anchor for the Dubois target.',
      },
      {
        id: 'DH-2',
        name: 'Indiana Mine',
        lon: SITE.indiana.lon,
        lat: SITE.indiana.lat,
        color: Cesium.Color.CYAN,
        body: 'Historical Indiana fluorspar mine record. Production context: 5,900 tons.',
      },
      {
        id: 'DH-3',
        name: 'Lavender Shaft',
        lon: SITE.lavender.lon,
        lat: SITE.lavender.lat,
        color: Cesium.Color.ORANGE,
        body: 'Third local shaft marker used as a survey reference point for the parcel twin.',
      },
    ];

    mines.forEach((mine) => {
      addEntity(
        'mines',
        { type: 'Mine Shaft', title: mine.name, body: mine.body },
        {
          name: mine.name,
          position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 22),
          point: {
            pixelSize: 16,
            color: mine.color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: mine.id,
            font: '700 11px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -24),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        },
      );
    });
  }

  function addCoreLayer() {
    const cores = [
      { name: 'USGS Core 44-A', lon: -88.37415, lat: 37.45395, depth: 310 },
      { name: 'USGS Core 44-B', lon: -88.37505, lat: 37.45295, depth: 286 },
      { name: 'USGS Core 44-C', lon: -88.37395, lat: 37.45315, depth: 242 },
    ];

    cores.forEach((core) => {
      addEntity(
        'cores',
        {
          type: 'USGS Core Hole',
          title: core.name,
          body: `Historical core reference. Logged depth: ${core.depth} ft.`,
        },
        {
          name: core.name,
          position: Cesium.Cartesian3.fromDegrees(core.lon, core.lat, 18),
          cylinder: {
            length: core.depth * 0.5,
            topRadius: 3,
            bottomRadius: 3,
            material: Cesium.Color.YELLOW.withAlpha(0.45),
            outline: true,
            outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
          },
          label: {
            text: core.name.replace('USGS ', ''),
            font: '700 9px monospace',
            fillColor: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            pixelOffset: new Cesium.Cartesian2(14, 0),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        },
      );
    });
  }

  function addVeinLayer() {
    const veinPaths = [
      [
        [-88.3752, 37.4529, 8],
        [-88.3748, 37.4533, 14],
        [-88.3742, 37.4539, 8],
      ],
      [
        [-88.3749, 37.4539, 6],
        [-88.3744, 37.4535, 12],
        [-88.3738, 37.4532, 6],
      ],
    ];

    veinPaths.forEach((path, index) => {
      addEntity(
        'veins',
        {
          type: 'Fluorspar Vein',
          title: `Modeled Vein Trace ${index + 1}`,
          body: 'Surface trace approximation for visualization. Field validation required before reserve claims.',
        },
        {
          name: `Fluorspar Vein ${index + 1}`,
          polyline: {
            positions: path.map(([lon, lat, height]) => Cesium.Cartesian3.fromDegrees(lon, lat, height)),
            width: 5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString('#e8c97a'),
            }),
            clampToGround: false,
          },
        },
      );
    });
  }

  function addResourceZones() {
    addEllipse('hree', 'Heavy REE Target Zone', SITE.propCenter.lon - 0.00025, SITE.propCenter.lat + 0.00025, 130, 90, '#e85050');
    addEllipse('lree', 'Light REE Target Zone', SITE.propCenter.lon + 0.00028, SITE.propCenter.lat - 0.0002, 120, 85, '#c9a84c');
  }

  function addPropertyBoundary() {
    const corners = [
      [-88.37605, 37.45255],
      [-88.37315, 37.45255],
      [-88.37315, 37.45435],
      [-88.37605, 37.45435],
    ];

    addEntity(
      'property',
      {
        type: 'Property Boundary',
        title: 'Allerion 40 Acre Parcel',
        body: 'Operational parcel boundary used for the digital twin proof-of-concept.',
      },
      {
        name: 'Allerion Property Boundary',
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(corners.flat()),
          material: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.08),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#4af0c8'),
          height: 4,
        },
        polyline: {
          positions: corners.concat([corners[0]]).map(([lon, lat]) => Cesium.Cartesian3.fromDegrees(lon, lat, 10)),
          width: 3,
          material: Cesium.Color.fromCssColorString('#4af0c8'),
        },
      },
    );
  }

  function addRegionalLayers() {
    addEntity(
      'hicksdome',
      {
        type: 'Regional Driver',
        title: 'Hicks Dome',
        body: 'Regional alkaline igneous complex used as the heavy rare earth source analogue.',
      },
      {
        name: 'Hicks Dome',
        position: Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat, 40),
        point: {
          pixelSize: 20,
          color: Cesium.Color.fromCssColorString('#a070e0'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: 'HICKS DOME',
          font: '700 11px monospace',
          fillColor: Cesium.Color.fromCssColorString('#d9c4ff'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          pixelOffset: new Cesium.Cartesian2(0, -28),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      },
    );

    addEllipse('earthmri', 'Earth MRI Focus Area', SITE.propCenter.lon, SITE.propCenter.lat, 900, 550, '#ff9900');
  }

  function addInterpolationLayer() {
    const cells = [
      { lon: -88.37495, lat: 37.45345, score: 0.92, radius: 105 },
      { lon: -88.37435, lat: 37.4538, score: 0.74, radius: 90 },
      { lon: -88.37395, lat: 37.45315, score: 0.58, radius: 76 },
    ];

    cells.forEach((cell) => {
      addEntity(
        'interpolation',
        {
          type: 'Kriging Cell',
          title: `Modeled Grade Score ${Math.round(cell.score * 100)}`,
          body: 'Synthetic visual interpolation layer. Replace with lab-confirmed assays before investor or procurement use.',
        },
        {
          name: 'Modeled Grade Interpolation',
          position: Cesium.Cartesian3.fromDegrees(cell.lon, cell.lat, 2),
          ellipse: {
            semiMinorAxis: cell.radius * 0.7,
            semiMajorAxis: cell.radius,
            material: Cesium.Color.RED.withAlpha(0.12 + cell.score * 0.18),
            outline: true,
            outlineColor: Cesium.Color.RED.withAlpha(0.4),
            height: 2,
          },
        },
      );
    });
  }

  function addNureLayer() {
    const samples = [
      { id: 5262163, lon: -88.2333, lat: 37.5349, Ce: 43 },
      { id: 5262170, lon: -88.3757, lat: 37.4641, Ce: 64 },
      { id: 5262184, lon: -88.4102, lat: 37.4413, Ce: 58 },
      { id: 5262190, lon: -88.3481, lat: 37.4212, Ce: 71 },
    ];

    samples.forEach((sample) => {
      addEntity(
        'nure',
        {
          type: 'NURE Geochemistry',
          title: `NURE Sample ${sample.id}`,
          body: `Regional stream sediment reference. Cerium: ${sample.Ce} ppm.`,
        },
        {
          name: `NURE ${sample.id}`,
          position: Cesium.Cartesian3.fromDegrees(sample.lon, sample.lat, 20),
          point: {
            pixelSize: 10 + sample.Ce / 16,
            color: Cesium.Color.fromCssColorString('#ff8822'),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        },
      );
    });
  }

  function addTilesetPlaceholders() {
    addEntity(
      'tilesets',
      {
        type: '3D Tileset Placeholder',
        title: 'Ion Asset Slot',
        body: 'Reserved integration point for LiDAR, photogrammetry, drone scans, or Gaussian splat assets.',
      },
      {
        name: 'Ion Asset Slot',
        position: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon + 0.00055, SITE.propCenter.lat + 0.00015, 80),
        box: {
          dimensions: new Cesium.Cartesian3(70, 70, 70),
          material: Cesium.Color.fromCssColorString('#00ccaa').withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#00ccaa'),
        },
        label: {
          text: '3D ASSET SLOT',
          font: '700 10px monospace',
          fillColor: Cesium.Color.fromCssColorString('#00ffcc'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          pixelOffset: new Cesium.Cartesian2(0, -34),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      },
    );
  }

  function addEllipse(layerName, title, lon, lat, major, minor, color) {
    addEntity(
      layerName,
      {
        type: 'Target Zone',
        title,
        body: 'Visual target envelope for planning and investor demonstration. Requires assay-backed replacement data.',
      },
      {
        name: title,
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 3),
        ellipse: {
          semiMajorAxis: major,
          semiMinorAxis: minor,
          material: Cesium.Color.fromCssColorString(color).withAlpha(0.13),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(color).withAlpha(0.75),
          height: 3,
        },
      },
    );
  }

  async function loadExternalCesiumAssets() {
    await safeAsset('World terrain', async () => {
      state.viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
        requestWaterMask: true,
        requestVertexNormals: true,
      });
    });

    await safeAsset('OSM 3D buildings', async () => {
      const buildings = await Cesium.createOsmBuildingsAsync();
      state.viewer.scene.primitives.add(buildings);
      register(buildings, 'buildings');
    });

    await safeAsset('Photorealistic point cloud', async () => {
      if (typeof Cesium.createGooglePhotorealistic3DTileset !== 'function') {
        throw new Error('Cesium release does not expose Google photorealistic tiles.');
      }
      const tileset = await Cesium.createGooglePhotorealistic3DTileset();
      state.viewer.scene.primitives.add(tileset);
      register(tileset, 'pointcloud');
    });
  }

  async function safeAsset(label, loader) {
    try {
      await loader();
      reportStatus(`${label} loaded`, 'ok');
    } catch (error) {
      reportStatus(`${label} unavailable: ${error.message}`, 'warn');
      console.warn(`[Allerion Twin] ${label} unavailable`, error);
    }
  }

  function toggleLayer(name, el) {
    const enabled = el ? el.classList.toggle('active') : !isLayerVisible(name);
    setLayerVisibility(name, enabled);
  }

  function setLayerVisibility(name, enabled) {
    document.querySelector(`[data-layer="${name}"]`)?.classList.toggle('active', enabled);
    const items = state.layers[name] || [];

    items.forEach((item) => {
      if ('show' in item) {
        item.show = enabled;
      }
    });
  }

  function isLayerVisible(name) {
    return (state.layers[name] || []).some((item) => item.show !== false);
  }

  function flyTo(target) {
    const destinations = {
      overview: { lon: SITE.propCenter.lon, lat: SITE.propCenter.lat, height: 1500, pitch: -50 },
      dubois: { lon: SITE.dubois.lon, lat: SITE.dubois.lat, height: 420, pitch: -42 },
      indiana: { lon: SITE.indiana.lon, lat: SITE.indiana.lat, height: 420, pitch: -42 },
      cores: { lon: SITE.propCenter.lon - 0.00015, lat: SITE.propCenter.lat + 0.0001, height: 520, pitch: -55 },
      hicksdome: { lon: SITE.hicksDome.lon, lat: SITE.hicksDome.lat, height: 1800, pitch: -48 },
      regional: { lon: -88.3733, lat: 37.4735, height: 5400, pitch: -64 },
    };
    const next = destinations[target] || destinations.overview;
    state.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(next.lon, next.lat, next.height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(next.pitch),
        roll: 0,
      },
      duration: 1.2,
    });
  }

  function setView(mode) {
    document.querySelectorAll('.view-btn').forEach((button) => button.classList.remove('active'));
    if (mode === '2d') {
      document.getElementById('btn2d')?.classList.add('active');
      state.viewer.scene.morphTo2D(0.8);
    } else {
      document.getElementById('btn3d')?.classList.add('active');
      state.viewer.scene.morphTo3D(0.8);
      flyTo('overview');
    }
  }

  function toggleImagery() {
    state.satelliteMode = !state.satelliteMode;
    state.viewer.scene.globe.brightness = state.satelliteMode ? 1.25 : 1.0;
    state.viewer.scene.globe.contrast = state.satelliteMode ? 1.2 : 1.0;
    setButtonState('btnsat', state.satelliteMode, 'Satellite contrast');
  }

  function toggleOrbitLock() {
    state.orbitLocked = !state.orbitLocked;
    setButtonState(null, state.orbitLocked, state.orbitLocked ? 'Orbit locked to parcel' : 'Orbit unlocked');
  }

  function toggleSplitScreen() {
    const container = document.getElementById('cesiumContainer2');
    if (!container) return;

    const opening = container.style.display === 'none' || !container.style.display;
    container.style.display = opening ? 'block' : 'none';
    document.body.classList.toggle('split-active', opening);

    if (opening && !state.splitViewer) {
      state.splitViewer = createViewer('cesiumContainer2', {
        timeline: false,
        animation: false,
        navigationHelpButton: false,
        sceneModePicker: false,
      });
      state.splitViewer.scene.morphTo2D(0);
      state.splitViewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 2600),
      });
    }

    reportStatus(opening ? 'Dual sync view active' : 'Dual sync view closed', 'ok');
  }

  function toggleUnderground() {
    state.undergroundMode = !state.undergroundMode;
    const globe = state.viewer.scene.globe;
    globe.translucency.enabled = state.undergroundMode;
    globe.translucency.frontFaceAlpha = state.undergroundMode ? 0.34 : 1.0;
    globe.translucency.backFaceAlpha = state.undergroundMode ? 0.18 : 1.0;
    globe.depthTestAgainstTerrain = !state.undergroundMode;
    reportStatus(state.undergroundMode ? 'X-ray terrain enabled' : 'X-ray terrain disabled', 'ok');
  }

  function toggleLighting() {
    state.viewer.scene.globe.enableLighting = !state.viewer.scene.globe.enableLighting;
    state.viewer.scene.light = new Cesium.SunLight();
    reportStatus(state.viewer.scene.globe.enableLighting ? 'Sunlight simulation enabled' : 'Sunlight simulation disabled', 'ok');
  }

  function wireEntityInspector() {
    const handler = new Cesium.ScreenSpaceEventHandler(state.viewer.scene.canvas);
    handler.setInputAction((click) => {
      const picked = state.viewer.scene.pick(click.position);
      if (!Cesium.defined(picked) || !picked.id) return;
      const detail = state.detailById.get(picked.id.id);
      if (detail) showDetail(detail);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function wireCoordinateDisplay() {
    const display = document.getElementById('coord-display');
    if (!display) return;

    const handler = new Cesium.ScreenSpaceEventHandler(state.viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const cartesian = state.viewer.camera.pickEllipsoid(movement.endPosition, state.viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(5);
      const lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(5);
      display.textContent = `${lat}, ${lon}`;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }

  function showDetail(detail) {
    document.getElementById('detail-type').textContent = detail.type;
    document.getElementById('detail-title').textContent = detail.title;
    document.getElementById('detail-body').textContent = detail.body;
    document.getElementById('detail-card').classList.add('active');
  }

  function closeDetail() {
    document.getElementById('detail-card')?.classList.remove('active');
  }

  function buildStatusPanel() {
    if (document.getElementById('runtime-status')) return;

    const panel = document.createElement('div');
    panel.id = 'runtime-status';
    panel.innerHTML = '<strong>Runtime</strong><div id="runtime-status-list"></div>';
    document.body.appendChild(panel);
  }

  function reportStatus(message, tone) {
    state.status.unshift({ message, tone, time: new Date().toLocaleTimeString() });
    state.status = state.status.slice(0, 5);

    const list = document.getElementById('runtime-status-list');
    if (!list) return;
    list.innerHTML = state.status
      .map((item) => `<div class="${item.tone}"><span>${item.time}</span>${escapeHtml(item.message)}</div>`)
      .join('');
  }

  function setButtonState(id, enabled, message) {
    if (id) document.getElementById(id)?.classList.toggle('active', enabled);
    reportStatus(message, enabled ? 'ok' : 'warn');
  }

  function showFatal(message) {
    const container = document.getElementById('cesiumContainer');
    if (container) {
      container.innerHTML = `<div class="fatal-panel"><h2>Digital twin failed to boot</h2><p>${escapeHtml(message)}</p></div>`;
    }
    console.error(`[Allerion Twin] ${message}`);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  boot();
})();
