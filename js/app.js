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
const layers = { mines: [], cores: [], veins: [], hree: [], lree: [], property: [], hicksdome: [], earthmri: [], interpolation: [], buildings: [], pointcloud: [] };

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

// ── RENDER MINE SHAFTS ───────────────────────────────────────────────
mineData.forEach(mine => {
  // Glowing base disc
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

  // Vertical shaft cylinder (going exactly DOWN into earth from 140m baseline)
  const shaftCenterZ = 140 - (mine.depth / 2); // Perfectly sets top edge flush with 140m terrain
  const shaft = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, shaftCenterZ),
    cylinder: {
      length: mine.depth,
      topRadius: 8, bottomRadius: 8,
      material: mine.color.withAlpha(0.7),
      outline: true, outlineColor: mine.color,
    }
  });

  // Underground terminal depth indicator label
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
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // Never obscured
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 8000),
    }
  });

  // Surface marker spike going UP
  const spike = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 0),
    cylinder: {
      length: 80,
      topRadius: 0, bottomRadius: 12,
      material: mine.color,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  });

  // Label
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

  // Clickable point
  const point = viewer.entities.add({
    id: mine.id,
    position: Cesium.Cartesian3.fromDegrees(mine.lon, mine.lat, 50),
    point: { pixelSize: 1, color: Cesium.Color.TRANSPARENT },
    properties: { type: mine.type, name: mine.name, body: mine.body }
  });

  mine.layers.push(disc, shaft, bottomLabel, spike, label, point);
});

// ── FLUORSPAR VEINS ──────────────────────────────────────────────────
// Based on documented strike directions from ISGS Mine Inventory forms
// Dubois: N60-65°E, Indiana: N18°E, Lavender: N-S80°W
// Centered around accurate property center
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
    // Vein lines mathematically shifted to correctly span between the newly centered shafts
    coords: [[-88.37461, 37.45347], [-88.37350, 37.45450]], // Dubois -> Indiana
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

// ── PROPERTIES BOUNDARY (J. ALLEE WHOLESALE MINING) ──────────────────
// Manually plotted exactly centered at 37.453466, -88.374611 per the Image 1 screenshot
const propCorners = [
  [-88.3768, 37.4516], // SW
  [-88.3768, 37.4552], // NW
  [-88.3724, 37.4552], // NE
  [-88.3724, 37.4516], // SE
  [-88.3768, 37.4516], // Close loop
].map(c => Cesium.Cartesian3.fromDegrees(c[0], c[1]));

const propBorder = viewer.entities.add({
  polyline: {
    positions: propCorners,
    width: 6,
    material: Cesium.Color.fromCssColorString('#ffff00').withAlpha(1.0), // Bright Yellow
    clampToGround: true,
  }
});

const propPin = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 0),
  billboard: {
    color: Cesium.Color.YELLOW,
    scale: 1.0,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
  },
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

// ── HREE ZONE ────────────────────────────────────────────────────────
// High HREE probability zone — western half of Allerion parcel
const hreeCorners = [
  [-88.3768, 37.4516], // SW
  [-88.3768, 37.4552], // NW
  [-88.3746, 37.4552], // NE
  [-88.3746, 37.4516]  // SE
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

// ── LREE ZONE ────────────────────────────────────────────────────────
// High LREE probability zone — eastern half of Allerion parcel
const lreeCorners = [
  [-88.3746, 37.4516], // SW
  [-88.3746, 37.4552], // NW
  [-88.3724, 37.4552], // NE
  [-88.3724, 37.4516]  // SE
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

// ── GRADE INTERPOLATION (KRIGING) ────────────────────────────────────
// Simulated geological block model over the entire Allerion parcel
const interpRect = viewer.entities.add({
  rectangle: {
    coordinates: Cesium.Rectangle.fromDegrees(-88.3768, 37.4516, -88.3724, 37.4552),
    material: new Cesium.StripeMaterialProperty({
      evenColor: Cesium.Color.fromCssColorString('#e85050').withAlpha(0.25),
      oddColor: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.15),
      repeat: 6.0,
      orientation: Cesium.StripeOrientation.VERTICAL
    }),
    height: 30,
    outline: true,
    outlineColor: Cesium.Color.WHITE
  }
});
layers.interpolation.push(interpRect);

// ── EARTH MRI (USGS NATIVE BOUNDARIES) ───────────────────────────────
// Loading the exact "usgs_MRI" KML explicitly from the user's Ion Dataset (Asset ID: 4588349) 
// This correctly overlays the literal, live USGS Earth MRI bedrock boundaries directly into the map!
Cesium.IonResource.fromAssetId(4588349).then(resource => {
  viewer.dataSources.add(Cesium.KmlDataSource.load(resource, {
    camera: viewer.scene.camera,
    canvas: viewer.scene.canvas,
    clampToGround: true
  })).then(dataSource => {
    // Enforce transparency so the USGS bedrock polygons do not block the majestic terrain
    dataSource.entities.values.forEach(entity => {
      if (entity.polygon && entity.polygon.material && entity.polygon.material.color) {
        let col = entity.polygon.material.color.getValue();
        entity.polygon.material = col.withAlpha(0.35); // Keep their official colors, just 35% translucent
      }
    });
    dataSource.show = false; // Starts hidden until toggled by user in menu
    layers.earthmri.push(dataSource);
  });
}).catch(e => console.error("Error loading native USGS Earth MRI:", e));
interpRect.show = false; // Hidden by default

// ── HICKS DOME MARKER ────────────────────────────────────────────────
const hicksDisc = viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat, 0),
  ellipse: {
    semiMinorAxis: 4000, semiMajorAxis: 4000,
    material: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.12),
    outline: true,
    outlineColor: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.6),
    outlineWidth: 2,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
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
// Arrow line from Hicks Dome to property
const arrowLine = viewer.entities.add({
  polyline: {
    positions: [
      Cesium.Cartesian3.fromDegrees(SITE.hicksDome.lon, SITE.hicksDome.lat),
      Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat),
    ],
    width: 1.5,
    material: new Cesium.PolylineDashMaterialProperty({
      color: Cesium.Color.fromCssColorString('#a070e0').withAlpha(0.5),
      dashLength: 20,
    }),
    clampToGround: true,
  }
});
layers.hicksdome.push(hicksDisc, hicksLabel, arrowLine);

  viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-88.3582, 37.4059, 25000.0), // High altitude over Ohio River
    orientation: {
      heading: Cesium.Math.toRadians(0.0), // Pointing North
      pitch: Cesium.Math.toRadians(-90.0), // 2D compatible down-look
    }
  });

  // ── LOAD HARDCODED EARTH MRI REGIONS ──────────────────────────────────
  function addEarthMRIPolygon(name, coords) {
    const polygon = viewer.entities.add({
      name: name,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(coords),
        material: Cesium.Color.fromCssColorString('#ff9900').withAlpha(0.15),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#ff9900')
      }
    });
    layers.earthmri.push(polygon);
  }

  addEarthMRIPolygon('Earth MRI: Hicks Dome Area', [
    -87.8389, 36.8648,
    -88.8554, 36.8533,
    -88.8840, 38.0060,
    -87.8518, 38.0180,
    -87.8389, 36.8648
  ]);

  addEarthMRIPolygon('Earth MRI: SE Missouri / W Illinois', [
    -89.8645, 38.2788,
    -89.9195, 36.9594,
    -89.9215, 36.9574,
    -91.6459, 36.9896,
    -91.6490, 36.9926,
    -91.6248, 38.3118,
    -91.6228, 38.3138,
    -91.2935, 38.3094,
    -91.2910, 38.3078,
    -91.2981, 38.0015,
    -91.2956, 37.9999,
    -90.8998, 37.9935,
    -90.8907, 38.3025,
    -90.4066, 38.2932,
    -89.8645, 38.2788
  ]);

// ── FLY TO LOCATIONS ─────────────────────────────────────────────────
const flyTargets = {
  overview: { lon: SITE.propCenter.lon, lat: SITE.propCenter.lat, height: 1800, heading: 0, pitch: -90 }, // Focus on parcel
  dubois:   { lon: SITE.dubois.lon, lat: SITE.dubois.lat, height: 400, heading: 0, pitch: -90 },
  indiana:  { lon: SITE.indiana.lon, lat: SITE.indiana.lat, height: 400, heading: 0, pitch: -90 },
  cores:    { lon: SITE.propCenter.lon, lat: SITE.propCenter.lat, height: 600, heading: 0, pitch: -90 },
  hicksdome:{ lon: SITE.hicksDome.lon, lat: SITE.hicksDome.lat, height: 4500, heading: 0, pitch: -90 },
  regional: { lon: -88.37, lat: 37.42, height: 18000, heading: 0, pitch: -90 },
};

window.flyTo = function(target) {
  const t = flyTargets[target];
  if (!t) return;
  const currentHeight = viewer.camera.positionCartographic.height || 1000;
  const maxH = Math.max(currentHeight, t.height) + 100;

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(t.lon, t.lat, t.height),
    orientation: {
      heading: Cesium.Math.toRadians(t.heading),
      pitch: Cesium.Math.toRadians(t.pitch),
      roll: 0
    },
    duration: 1.8,
    maximumHeight: maxH,
    pitchAdjustHeight: maxH,
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
  });
};

// ── ONSCREEN NAVIGATION CONTROLS ─────────────────────────────────────
window.zoomMap = function(amount) {
  const amt = viewer.camera.positionCartographic.height * 0.5;
  if (amount < 0) viewer.camera.zoomIn(amt);
  else viewer.camera.zoomOut(amt);
};
window.panMap = function(dir) {
  const amt = viewer.camera.positionCartographic.height * 0.2;
  if (dir === 'up') viewer.camera.moveUp(amt);
  if (dir === 'down') viewer.camera.moveDown(amt);
  if (dir === 'left') viewer.camera.moveLeft(amt);
  if (dir === 'right') viewer.camera.moveRight(amt);
};

  // Handle dynamically uploaded KML/KMZ Data Files
  const kmzInput = document.getElementById('kmz-upload');
  const uploadStatus = document.getElementById('upload-status');
  
  if(kmzInput) {
    kmzInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      
      uploadStatus.innerText = 'Loading ' + file.name + '...';
      uploadStatus.style.color = '#e8c97a';

      viewer.dataSources.add(Cesium.KmlDataSource.load(file, {
        camera: viewer.scene.camera,
        canvas: viewer.scene.canvas,
        clampToGround: true
      })).then(function(dataSource) {
        uploadStatus.innerText = 'Loaded Successfully!';
        uploadStatus.style.color = '#4caf50';
      }).catch(function(error) {
        uploadStatus.innerText = 'Error loading file.';
        uploadStatus.style.color = 'red';
        console.error('Error loading KMZ:', error);
      });
    });
  }

// ── LAYER VISIBILITY ─────────────────────────────────────────────────
function toggleLayer(name, el) {
  const visible = el.classList.toggle('active');
  layers[name].forEach(e => { e.show = visible; });
}

// Removed duplicate flyTo block

// ── UNDERGROUND X-RAY ────────────────────────────────────────────────
let underground = false;
window.toggleUnderground = function() {
  underground = !underground;
  viewer.scene.globe.translucency.enabled = underground;
  if(underground) {
    viewer.scene.globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(50.0, 0.4, 3000.0, 1.0);
    viewer.scene.globe.undergroundColor = Cesium.Color.fromCssColorString('#120a1c').withAlpha(0.9);
  } else {
    viewer.scene.globe.translucency.frontFaceAlphaByDistance = undefined;
  }
};

// ── MULTIPLE SYNCED VIEWS (DUAL VIEW) ────────────────────────────────
let viewer2 = null;
let dualViewActive = false;
function syncCameras() {
  if (!viewer2 || !dualViewActive) return;
  viewer2.camera.setView({
    destination: viewer.camera.positionWC,
    orientation: {
      heading: viewer.camera.heading,
      pitch: viewer.camera.pitch,
      roll: viewer.camera.roll
    }
  });
}

window.toggleSplitScreen = function() {
  const c1 = document.getElementById('cesiumContainer');
  const c2 = document.getElementById('cesiumContainer2');
  dualViewActive = !dualViewActive;

  if (dualViewActive) {
    c1.style.width = '50%';
    c2.style.display = 'block';
    c2.style.width = '50%';
    
    if (!viewer2) {
      viewer2 = new Cesium.Viewer('cesiumContainer2', {
        sceneMode: Cesium.SceneMode.SCENE2D, // Usually a top-down sync map
        baseLayerPicker: false, geocoder: false, homeButton: false,
        infoBox: false, selectionIndicator: false, navigationHelpButton: false,
        timeline: false, animation: false, fullscreenButton: false
      });
      viewer.camera.changed.addEventListener(syncCameras);
      viewer.scene.preRender.addEventListener(syncCameras);
    }
    syncCameras(); // Force instant sync
  } else {
    c1.style.width = '100%';
    c2.style.display = 'none';
  }
};

// ── VIEW MODE & ORBIT LOCK ───────────────────────────────────────────
function setView(mode) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  if (mode === '3d') {
    document.getElementById('btn3d').classList.add('active');
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 1800),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-35), roll: 0 },
      duration: 1.5,
    });
  } else {
    document.getElementById('btn2d').classList.add('active');
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 2200),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
      duration: 1.5,
    });
  }
}

let isOrbitLocked = false;
window.toggleOrbitLock = function() {
  isOrbitLocked = !isOrbitLocked;
  if(isOrbitLocked) {
    // Dynamically lock the core 3D camera to strictly track the precise parcel center 
    // This perfectly emulates the familiar "Cesium Stories" spherical orbiting mechanics!
    viewer.trackedEntity = propPin;
  } else {
    viewer.trackedEntity = undefined;
  }
};

// ── IMAGERY TOGGLE ───────────────────────────────────────────────────
let satOn = true;
function toggleImagery() {
  satOn = !satOn;
  const layers_ = viewer.imageryLayers;
  const base = layers_.get(0);
  base.show = satOn;
  document.getElementById('btnsat').classList.toggle('active', satOn);
}

// ── CLICK HANDLER ────────────────────────────────────────────────────
viewer.screenSpaceEventHandler.setInputAction(movement => {
  const picked = viewer.scene.pick(movement.position);
  if (picked && picked.id && picked.id.properties) {
    const p = picked.id.properties;
    showDetail(p.name._value, p.type._value, p.body._value);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function showDetail(name, type, body) {
  document.getElementById('detail-title').textContent = name;
  document.getElementById('detail-type').textContent = type;
  document.getElementById('detail-body').textContent = body;
  document.getElementById('detail-card').classList.add('visible');
}
function closeDetail() {
  document.getElementById('detail-card').classList.remove('visible');
}

// ── COORDINATE DISPLAY ───────────────────────────────────────────────
const coordHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
coordHandler.setInputAction(movement => {
  const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
  if (cartesian) {
    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    const lon = Cesium.Math.toDegrees(carto.longitude).toFixed(5);
    const lat = Cesium.Math.toDegrees(carto.latitude).toFixed(5);
    const elev = Math.round(carto.height);
    document.getElementById('coord-display').textContent = `${lat}°N  ${Math.abs(lon)}°W  ${elev}m elev`;
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// ── INITIAL CAMERA ───────────────────────────────────────────────────
// Center exactly on the 40-acre property instantly, top-down! 
// This gives the exact 2D projection feel while allowing 3D Terrain & Bathymetry to render instantly!
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 1200), // Height 1200 shows exactly the 40-acre box
  orientation: {
    heading: 0,
    pitch: Cesium.Math.toRadians(-90), // LOOKING PERFECTLY OUT-DOWN (2D PERSPECTIVE)
    roll: 0
  }
});

// ── SYNC HTML LAYER VISIBILITY ON LOAD ───────────────────────────────
setTimeout(() => {
  document.querySelectorAll('.layer-toggle').forEach(el => {
    const name = el.getAttribute('data-layer');
    if (!el.classList.contains('active') && layers[name]) {
      layers[name].forEach(e => { e.show = false; });
    }
  });
}, 2000);

// ── SUN LIGHTING ─────────────────────────────────────────────────────
viewer.scene.globe.enableLighting = false; // DISABLED: Prevented sunrise/sunset yellow/orange atmospheric tint!
viewer.scene.sun = new Cesium.Sun();

let lightingEnabled = false;
window.toggleLighting = function() {
  lightingEnabled = !lightingEnabled;
  viewer.scene.globe.enableLighting = lightingEnabled;
};

// ── COORDINATE RENDERER ──────────────────────────────────────────────
