// ── CESIUM ION TOKEN ─────────────────────────────────────────────────
// Free tier token — works for terrain and imagery
// Get your own free token at cesium.com/ion
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMzU4MzVlMC05ZTkzLTQ1ZTgtYmY5OC0yZWM0NTc0MjMxODYiLCJpZCI6MTU1MTcyLCJpYXQiOjE3NzUwNjk5NTl9.nyYiYSYBYNWGRN7IcQxRUWGTGkVHitg6BtKcYTZ5-9E';

// ── COORDINATES ──────────────────────────────────────────────────────
// Section 19, T12S, R8E, Hardin County, IL
// Corrected to match exact USBM RI 4315 coordinates
const SITE = {
  dubois:   { id: 'DH-1', lon: -88.3744, lat: 37.4537, depth: 250 },
  indiana:  { id: 'DH-2', lon: -88.3748, lat: 37.4532, depth: 280 },
  lavender: { id: 'DH-3', lon: -88.3738, lat: 37.4540, depth: 260 },
  propCenter: { lon: -88.374611, lat: 37.453466 }, // J. Allee Wholesale Property Center from Ion
  hicksDome:  { lon: -88.3718, lat: 37.4935 },
};

// ── VIEWER SETUP ─────────────────────────────────────────────────────
const viewer = new Cesium.Viewer('cesiumContainer', {
  sceneMode: Cesium.SceneMode.SCENE3D, // Re-enabled 3D so Terrain & Bathymetry work
  mapMode2D: Cesium.MapMode2D.ROTATE,
  baseLayerPicker: false,
  navigationHelpButton: true, // Enable native maneuverability help
  sceneModePicker: true,      // Allow 2D/3D switching easily
  vrButton: true,             // ENABLE CARDBOARD VIEW
  geocoder: false,
  homeButton: true,           // Give them a reset button
  fullscreenButton: false,
  timeline: true,             // ENABLE CLOCK
  animation: true,            // ENABLE CLOCK
  infoBox: false,
  selectionIndicator: false,
  creditContainer: document.createElement('div'),
  requestRenderMode: false,
  targetFrameRate: 60,
  msaaSamples: 4,
});

// Async Terrain initialization for Cesium 1.104+
Cesium.createWorldTerrainAsync({ 
  requestWaterMask: true,      // BATHYMETRY ENABLED
  requestVertexNormals: true 
}).then(tp => {
  viewer.terrainProvider = tp;
}).catch(e => console.error('Terrain error:', e));

// Enable terrain lighting & Bathymetry rendering
viewer.scene.globe.enableLighting = false; // DISABLED: Prevented sunrise/sunset yellow/orange atmospheric tint!
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.globe.showWaterEffect = true; // BATHYMETRY SHADER ENABLED
viewer.scene.fog.enabled = true;
viewer.scene.fog.density = 0.0001; // Reduced fog thickness

// Set default vertical exaggeration straight off the bat for dramatic beauty
viewer.scene.verticalExaggeration = 2.5;
viewer.scene.verticalExaggerationRelativeHeight = 0.0;

// Make navigation buttery smooth like Google Earth
viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
viewer.scene.screenSpaceCameraController.minimumZoomDistance = 150;
viewer.scene.screenSpaceCameraController.maximumZoomDistance = 500000;
viewer.scene.screenSpaceCameraController.inertiaSpin = 0.9;
viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.9;
viewer.scene.screenSpaceCameraController.inertiaZoom = 0.9;

// ── LAYER STORE ──────────────────────────────────────────────────────
const layers = { mines: [], cores: [], veins: [], hree: [], lree: [], property: [], hicksdome: [], earthmri: [], interpolation: [], buildings: [], pointcloud: [], tilesets: [] };

// ── ADD OSM 3D BUILDINGS ─────────────────────────────────────────────
Cesium.createOsmBuildingsAsync().then(buildings => {
  layers.buildings.push(buildings);
  viewer.scene.primitives.add(buildings);
});

// ── 3D POINT CLOUD (PHOTOGRAMMETRY) ──────────────────────────────────
// Enabled massive photorealistic point cloud of the entire area!
Cesium.createGooglePhotorealistic3DTileset().then(tileset => {
  layers.pointcloud.push(tileset);
  viewer.scene.primitives.add(tileset);
  tileset.show = false; // toggled via menu
});

// ── COLOR HELPERS ────────────────────────────────────────────────────
const C = {
  gold:    Cesium.Color.fromCssColorString('#c9a84c'),
  goldL:   Cesium.Color.fromCssColorString('#e8c97a'),
  elec:    Cesium.Color.fromCssColorString('#4af0c8'),
  red:     Cesium.Color.fromCssColorString('#e85050'),
  blue:    Cesium.Color.fromCssColorString('#8ab0c0'),
  purple:  Cesium.Color.fromCssColorString('#a070e0'),
  white:   Cesium.Color.WHITE,
  hree:    Cesium.Color.fromCssColorString('#e85050'),
  lree:    Cesium.Color.fromCssColorString('#c9a84c'),
};

// ── MINE SHAFT DATA ──────────────────────────────────────────────────
const mineData = [
  {
    id: 'dubois', name: 'Dubois Mine',
    lon: SITE.dubois.lon, lat: SITE.dubois.lat,
    color: C.gold, glowColor: Cesium.Color.fromCssColorString('#c9a84c').withAlpha(0.4),
    type: 'FLUORSPAR MINE · ISGS DOCUMENTED',
    body: 'Operations since 1904 on the Illinois-Furnace fault. Shaft depths 50–100ft. Ore strike N60-65°E, dipping nearly vertical. Total tonnage: 1,000–2,000T historically. Adjacent to 3 documented veins. Crown Fluorspar Corp. was last operator of record.',
    depth: 100, layers: layers.mines
  },
  {
    id: 'indiana', name: 'Indiana Mine (Hillside No.2)',
    lon: SITE.indiana.lon, lat: SITE.indiana.lat,
    color: C.elec, glowColor: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.4),
    type: 'FLUORSPAR MINE · 5,900T CONFIRMED',
    body: 'Most productive shaft on the property. 5,900 tonnes extracted in just 1923–1925 alone by Indiana Fluorspar Land Co. / U.S. Fluorspar Co. Works 2 veins 130ft apart at surface. Strike N18°E, dip sharply to the west. Shafts 50–65ft, workings 30–100ft depth.',
    depth: 100, layers: layers.mines
  },
  {
    id: 'lavender', name: 'Lavender Mine',
    lon: SITE.lavender.lon, lat: SITE.lavender.lat,
    color: C.blue, glowColor: Cesium.Color.fromCssColorString('#8ab0c0').withAlpha(0.4),
    type: 'FLUORSPAR MINE · GRAVELSPAR VEIN',
    body: '4-vein deposit of gravelspar fluorspar. Oriented N-S80°W. Shaft 40ft deep. Last owner C.H. Stone. Connected to the main Dubois fault system. Gravelspar variety indicates near-surface weathered fluorite — often highest purity.',
    depth: 40, layers: layers.mines
  },
  {
    id: 'corech1', name: 'USGS Core Hole 1 (1944)',
    lon: -88.37406, lat: 37.45401,
    color: Cesium.Color.fromCssColorString('#ccbb33'), glowColor: Cesium.Color.fromCssColorString('#ccbb33').withAlpha(0.4),
    type: 'USBM RI 4315',
    body: 'USGS Core Hole drilled in 1944. Depth: 310 ft. Tested Mississippian only. Flouspar deposit mapped at depth 240-265ft. Never tested for REE.',
    depth: 310, layers: layers.cores
  },
  {
    id: 'corech2', name: 'USGS Core Hole 2',
    lon: -88.37306, lat: 37.45451,
    color: Cesium.Color.fromCssColorString('#ccbb33'), glowColor: Cesium.Color.fromCssColorString('#ccbb33').withAlpha(0.4),
    type: 'USBM RI 4315',
    body: 'USGS Core Hole drilled in 1944. Depth: 285 ft. Fluorspar veins mapped at 200ft depth.',
    depth: 285, layers: layers.cores
  },
  {
    id: 'corech3', name: 'USGS Core Hole 3',
    lon: -88.37506, lat: 37.45331,
    color: Cesium.Color.fromCssColorString('#ccbb33'), glowColor: Cesium.Color.fromCssColorString('#ccbb33').withAlpha(0.4),
    type: 'USBM RI 4315',
    body: 'USGS Core Hole drilled in 1944. Depth: 260 ft. Deposit mapped across 4 distinct strata boundaries.',
    depth: 260, layers: layers.cores
  },
  {
    id: 'corech4', name: 'USGS Core Hole 4',
    lon: -88.37556, lat: 37.45271,
    color: Cesium.Color.fromCssColorString('#ccbb33'), glowColor: Cesium.Color.fromCssColorString('#ccbb33').withAlpha(0.4),
    type: 'USBM RI 4315',
    body: 'USGS Core Hole drilled in 1944. Depth: 251 ft. Confirmed structural connection to Dubois Gravelspar deposit.',
    depth: 251, layers: layers.cores
  }
];

mineData.forEach(mine => {
  const disc = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 0),
    ellipse: {
      semiMinorAxis: 60, semiMajorAxis: 60,
      material: mine.glowColor,
      height: 0, outline: true,
      outlineColor: mine.color, outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  });

  const shaftCenterZ = 140 - (mine.depth / 2);
  const shaft = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, shaftCenterZ),
    cylinder: {
      length: mine.depth,
      topRadius: 8, bottomRadius: 8,
      material: mine.color.withAlpha(0.7),
      outline: true, outlineColor: mine.color,
    }
  });

  const bottomLabel = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 140 - mine.depth),
    label: {
      text: 'TD: ' + mine.depth + ' ft',
      font: '900 12px monospace',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK, outlineWidth: 3.5,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, 10),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000),
    }
  });

  const spike = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 0),
    cylinder: {
      length: 80,
      topRadius: 0, bottomRadius: 12,
      material: mine.color,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  });

  const label = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 120),
    label: {
      text: '⛏ ' + mine.name,
      font: '600 13px monospace',
      fillColor: mine.color,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    }
  });

  const point = viewer.entities.add({
    id: mine.id,
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 50),
    point: { pixelSize: 1, color: Cesium.Color.TRANSPARENT },
    properties: { type: mine.type, name: mine.name, body: mine.body }
  });

  mine.layers.push(disc, shaft, bottomLabel, spike, label, point);
});

const veinDefs = [
  {
    name: 'Dubois Vein — N65°E (Confirmed)',
    coords: [
      [-88.384, 37.444], [-88.382, 37.446], [-88.380, 37.448],
      [-88.378, 37.450], [-88.376, 37.452],
    ],
    color: Cesium.Color.fromCssColorString('#c9a84c').withAlpha(0.85),
    width: 4, dashed: false,
  },
  {
    name: 'Indiana Vein — N18°E (Confirmed, 5,900T)',
    coords: [
      [-88.380, 37.445], [-88.379, 37.447],
      [-88.378, 37.450], [-88.378, 37.452],
    ],
    color: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.85),
    width: 3.5, dashed: false,
  },
  {
    name: 'Lavender Vein — N-S80°W (Confirmed)',
    coords: [[-88.37461, 37.45347], [-88.37350, 37.45450]],
    color: Cesium.Color.fromCssColorString('#8ab0c0').withAlpha(0.8),
    width: 3, dashed: false,
  },
  {
    name: 'Projected NE Extension (Illinois-Furnace Fault)',
    coords: [
      [-88.376, 37.452], [-88.374, 37.454],
      [-88.372, 37.456], [-88.370, 37.458],
    ],
    color: Cesium.Color.fromCssColorString('#c9a84c').withAlpha(0.4),
    width: 2, dashed: true,
  },
  {
    name: 'Deep Indiana Extension (Projected)',
    coords: [
      [-88.378, 37.452], [-88.377, 37.454],
      [-88.377, 37.456],
    ],
    color: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.3),
    width: 2, dashed: true,
  },
];

veinDefs.forEach(v => {
  const positions = v.coords.map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));
  const vein = viewer.entities.add({
    polyline: {
      positions,
      width: v.width,
      material: v.dashed
        ? new Cesium.PolylineDashMaterialProperty({ color: v.color, dashLength: 16 })
        : new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.3, color: v.color }),
      clampToGround: true,
    }
  });
  layers.veins.push(vein);
});

const propCorners = [
  [-88.3768, 37.4516], [-88.3768, 37.4552], [-88.3724, 37.4552], [-88.3724, 37.4516], [-88.3768, 37.4516]
].map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));

const propBorder = viewer.entities.add({
  polyline: {
    positions: propCorners,
    width: 6,
    material: Cesium.Color.fromCssColorString('#ffff00').withAlpha(1.0),
    clampToGround: true,
  }
});

const propPin = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 0),
  billboard: { color: Cesium.Color.YELLOW, scale: 1.0, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND },
  label: {
    text: '📍 _/ALLERION.LLC\\_',
    font: 'bold 15px sans-serif',
    fillColor: Cesium.Color.fromCssColorString('#ffff00'),
    outlineColor: Cesium.Color.BLACK, outlineWidth: 5,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
    pixelOffset: new Cesium.Cartesian2(15, 0),
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  }
});
layers.property.push(propBorder, propPin);

const hreeCorners = [
  [-88.3768, 37.4516], [-88.3768, 37.4552], [-88.3746, 37.4552], [-88.3746, 37.4516]
].map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));

const hreeZone = viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(hreeCorners),
    material: Cesium.Color.fromCssColorString('#e85050').withAlpha(0.15),
    height: 10, extrudedHeight: 0,
    outline: true, outlineColor: C.hree, outlineWidth: 3
  }
});
layers.hree.push(hreeZone);

const lreeCorners = [
  [-88.3746, 37.4516], [-88.3746, 37.4552], [-88.3724, 37.4552], [-88.3724, 37.4516]
].map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));

const lreeZone = viewer.entities.add({
  polygon: {
    hierarchy: new Cesium.PolygonHierarchy(lreeCorners),
    material: Cesium.Color.fromCssColorString('#c9a84c').withAlpha(0.12),
    height: 15, extrudedHeight: 0,
    outline: true, outlineColor: C.lree, outlineWidth: 3
  }
});
layers.lree.push(lreeZone);

const interpRect = viewer.entities.add({
  rectangle: {
    coordinates: Cesium.Rectangle.fromDegrees(-88.3768, 37.4516, -88.3724, 37.4552),
    material: new Cesium.StripeMaterialProperty({
      evenColor: Cesium.Color.fromCssColorString('#e85050').withAlpha(0.25),
      oddColor: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.15),
      repeat: 6.0,
      orientation: Cesium.StripeOrientation.VERTICAL
    }),
    height: 30, outline: true, outlineColor: Cesium.Color.WHITE
  }
});
layers.interpolation.push(interpRect);

Cesium.IonResource.fromAssetId(4588349).then(resource => {
  viewer.dataSources.add(Cesium.KmlDataSource.load(resource, { camera: viewer.scene.camera, canvas: viewer.scene.canvas, clampToGround: true })).then(dataSource => {
    dataSource.entities.values.forEach(entity => {
      if (entity.polygon && entity.polygon.material && entity.polygon.material.color) {
        let col = entity.polygon.material.color.getValue();
        entity.polygon.material = col.withAlpha(0.35);
      }
    });
    dataSource.show = false;
    layers.earthmri.push(dataSource);
  });
});
interpRect.show = false;

const hicksDisc = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat, 0),
  ellipse: {
    semiMinorAxis: 4000, semiMajorAxis: 4000,
    material: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.12),
    outline: true, outlineColor: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.6),
    outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
  }
});
const hicksLabel = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat, 500),
  label: {
    text: '🔬 HICKS DOME (ADJACENT)\n14.7M T @ 0.42% REO · USGS OFR-2012-1048\n⚠ Not on Allerion Property',
    font: '600 11px monospace',
    fillColor: Cesium.Color.fromCssColorString('#a070e0'),
    outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000),
  }
});
const arrowLine = viewer.entities.add({
  polyline: {
    positions: [ Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat), Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat)],
    width: 1.5, material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.5), dashLength: 20 }),
    clampToGround: true,
  }
});
layers.hicksdome.push(hicksDisc, hicksLabel, arrowLine);

const NURE_SAMPLES = [
  {id:5262163,lon:-88.2333,lat:37.5349,Ce:43,La:21,Dy:3.1,Sc:4.8,Th:7},
  {id:5262164,lon:-88.2324,lat:37.5714,Ce:79,La:24,Dy:0,Sc:4,Th:11},
  {id:5262165,lon:-88.2994,lat:37.5769,Ce:28,La:14,Dy:0.6,Sc:5.5,Th:5},
  {id:5262166,lon:-88.3332,lat:37.5886,Ce:13,La:10,Dy:1.3,Sc:5.9,Th:4},
  {id:5262167,lon:-88.3639,lat:37.5892,Ce:47,La:21,Dy:0.4,Sc:2.5,Th:8},
  {id:5262168,lon:-88.4055,lat:37.5606,Ce:62,La:27,Dy:12.5,Sc:3.2,Th:18},
  {id:5262169,lon:-88.4033,lat:37.5047,Ce:42,La:15,Dy:0.3,Sc:8.1,Th:5},
  {id:5262170,lon:-88.3757,lat:37.4641,Ce:64,La:30,Dy:0.7,Sc:7.1,Th:9},
  {id:5262171,lon:-88.3579,lat:37.4473,Ce:74,La:25,Dy:0,Sc:6.6,Th:5},
  {id:5262172,lon:-88.3734,lat:37.4261,Ce:39,La:18,Dy:0.4,Sc:9.2,Th:6},
  {id:5262173,lon:-88.3458,lat:37.4844,Ce:25,La:11,Dy:0.8,Sc:6.1,Th:7},
  {id:5262174,lon:-88.3412,lat:37.5460,Ce:98,La:28,Dy:0.5,Sc:5.3,Th:11},
  {id:5262175,lon:-88.2846,lat:37.5418,Ce:39,La:11,Dy:0,Sc:1.3,Th:5},
  {id:5262176,lon:-88.2876,lat:37.5112,Ce:44,La:24,Dy:0,Sc:3.2,Th:8},
  {id:5262177,lon:-88.3181,lat:37.4470,Ce:60,La:16,Dy:0,Sc:7.4,Th:7},
  {id:5262335,lon:-88.5004,lat:37.3571,Ce:54,La:22,Dy:0,Sc:5.4,Th:9},
  {id:5262336,lon:-88.5166,lat:37.4038,Ce:60,La:23,Dy:0.4,Sc:5.9,Th:0},
  {id:5262337,lon:-88.5213,lat:37.4484,Ce:55,La:20,Dy:5.1,Sc:3.6,Th:7},
  {id:5262348,lon:-88.4970,lat:37.4413,Ce:20,La:16,Dy:0.6,Sc:4.5,Th:4},
  {id:5262349,lon:-88.4654,lat:37.4484,Ce:0,La:2,Dy:0.3,Sc:3.9,Th:0},
  {id:5262350,lon:-88.4208,lat:37.4628,Ce:38,La:18,Dy:0.3,Sc:5.6,Th:7},
  {id:5262351,lon:-88.4467,lat:37.4851,Ce:24,La:20,Dy:0.1,Sc:3.7,Th:3},
  {id:5262352,lon:-88.4836,lat:37.5350,Ce:58,La:28,Dy:0.9,Sc:5.5,Th:6},
  {id:5262353,lon:-88.4280,lat:37.5581,Ce:20,La:8,Dy:0.4,Sc:2,Th:4},
  {id:5262354,lon:-88.4345,lat:37.5811,Ce:37,La:15,Dy:0.3,Sc:6.1,Th:5},
  {id:5262355,lon:-88.5089,lat:37.5710,Ce:28,La:15,Dy:0,Sc:7.7,Th:4},
  {id:5262633,lon:-88.2369,lat:37.3500,Ce:29,La:0,Dy:0.3,Sc:1.6,Th:5},
  {id:5262634,lon:-88.2369,lat:37.3500,Ce:23,La:10,Dy:0,Sc:1,Th:2},
  {id:5262635,lon:-88.2378,lat:37.3238,Ce:55,La:0,Dy:0.7,Sc:3.8,Th:9},
  {id:5262636,lon:-88.2378,lat:37.3238,Ce:44,La:17,Dy:0,Sc:3,Th:9},
  {id:5262637,lon:-88.2756,lat:37.3568,Ce:30,La:0,Dy:1.7,Sc:2.8,Th:5},
  {id:5262638,lon:-88.2756,lat:37.3568,Ce:17,La:9,Dy:0,Sc:1,Th:2},
  {id:5262639,lon:-88.3010,lat:37.3900,Ce:61,La:0,Dy:0.6,Sc:8.6,Th:9},
  {id:5262640,lon:-88.3010,lat:37.3900,Ce:54,La:24,Dy:0,Sc:5,Th:4},
  {id:5262641,lon:-88.3145,lat:37.4166,Ce:83,La:0,Dy:1.2,Sc:10.2,Th:11},
  {id:5262642,lon:-88.3145,lat:37.4166,Ce:83,La:35,Dy:0,Sc:10,Th:8},
  {id:5262643,lon:-88.2791,lat:37.4243,Ce:55,La:0,Dy:0,Sc:5.8,Th:6},
  {id:5262644,lon:-88.2791,lat:37.4243,Ce:50,La:22,Dy:0,Sc:4,Th:4},
  {id:5262645,lon:-88.2601,lat:37.3829,Ce:59,La:0,Dy:0.5,Sc:4.2,Th:10},
  {id:5262646,lon:-88.2601,lat:37.3829,Ce:56,La:23,Dy:0,Sc:4,Th:6},
  {id:5262724,lon:-88.4750,lat:37.3184,Ce:65,La:29,Dy:4.2,Sc:6.3,Th:8},
  {id:5262725,lon:-88.4245,lat:37.3638,Ce:87,La:21,Dy:0,Sc:5.2,Th:7},
  {id:5262726,lon:-88.4287,lat:37.3903,Ce:50,La:31,Dy:1.9,Sc:7.2,Th:9},
  {id:5262727,lon:-88.3911,lat:37.3878,Ce:53,La:27,Dy:6.7,Sc:5.1,Th:5},
  {id:5262728,lon:-88.3529,lat:37.3411,Ce:85,La:16,Dy:0,Sc:3.1,Th:11},
];

if (!layers.nure) layers.nure = [];
NURE_SAMPLES.forEach(s => {
  const ceNorm = Math.min(s.Ce / 100, 1);
  const r = Math.min(255, Math.floor(ceNorm * 510));
  const g = Math.min(255, Math.floor((1 - ceNorm) * 400));
  const pinColor = Cesium.Color.fromBytes(r, g, 40, 230);
  const pin = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 0),
    point: { pixelSize: 10, color: pinColor, outlineColor: Cesium.Color.WHITE, outlineWidth: 1.5, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, disableDepthTestDistance: Number.POSITIVE_INFINITY },
    label: {
      text: `NURE #${s.id}\nCe:${s.Ce} La:${s.La} Dy:${s.Dy} Sc:${s.Sc} ppm`,
      font: '600 9px monospace', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, style: Cesium.LabelStyle.FILL_AND_OUTLINE, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -14), disableDepthTestDistance: Number.POSITIVE_INFINITY, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000), showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#0a0c10').withAlpha(0.85),
    },
    properties: {
      type: 'NURE Stream Sediment', name: `NURE HSSR #${s.id}`,
      body: `<strong>USGS NURE-HSSR Sample</strong><br>Collected: 1978 · Savannah River Lab (DOE)<br><br><strong style="color:#ff9900;">Cerium (Ce):</strong> ${s.Ce} ppm<br><strong style="color:#ffcc00;">Lanthanum (La):</strong> ${s.La} ppm<br><strong style="color:#ff4444;">Dysprosium (Dy):</strong> ${s.Dy} ppm<br><strong style="color:#44ccff;">Scandium (Sc):</strong> ${s.Sc} ppm<br><strong style="color:#aaaaaa;">Thorium (Th):</strong> ${s.Th} ppm<br><br><em style="font-size:9px;color:#888;">Source: mrdata.usgs.gov/nure/sediment/${s.id}</em>`
    }
  });
  pin.show = false;
  layers.nure.push(pin);
});

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-88.3582, 37.4059, 25000.0),
  orientation: { heading: Cesium.Math.toRadians(0.0), pitch: Cesium.Math.toRadians(-90.0) }
});

function toggleLayer(name, el) {
  const visible = el.classList.toggle('active');
  layers[name].forEach(e => { e.show = visible; });
}

window.toggleUnderground = function() {
  underground = !underground;
  viewer.scene.globe.translucency.enabled = underground;
};

window.toggleDroneMode = function() {
  if(window.toggleDroneSimulation) window.toggleDroneSimulation();
};
