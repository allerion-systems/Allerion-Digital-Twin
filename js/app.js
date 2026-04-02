Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlMzU4MzVlMC05ZTkzLTQ1ZTgtYmY5OC0yZWM0NTc0MjMxODYiLCJpZCI6MTU1MTcyLCJpYXQiOjE3NzUwNjk5NTl9.nyYiYSYBYNWGRN7IcQxRUWGTGkVHitg6BtKcYTZ5-9E';
const SITE = {
  dubois: { id: 'DH-1', lon: -88.3744, lat: 37.4537, depth: 250 },
  indiana: { id: 'DH-2', lon: -88.3748, lat: 37.4532, depth: 280 },
  lavender: { id: 'DH-3', lon: -88.3738, lat: 37.4540, depth: 260 },
  propCenter: { lon: -88.374611, lat: 37.453466 },
  hicksDome: { lon: -88.3718, lat: 37.4935 },
};
const viewer = new Cesium.Viewer('cesiumContainer', {
  sceneMode: Cesium.SceneMode.SCENE3D,
  baseLayerPicker: false,
  navigationHelpButton: true,
  sceneModePicker: true,
  vrButton: true,
  geocoder: false,
  homeButton: true,
  timeline: true,
  animation: true,
  msaaSamples: 4,
});
Cesium.createWorldTerrainAsync({ requestWaterMask: true, requestVertexNormals: true }).then(tp => { viewer.terrainProvider = tp; });
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.verticalExaggeration = 2.5;
const layers = { mines:[], cores:[], veins:[], hree:[], lree:[], property:[], hicksdome:[], earthmri:[], interpolation:[], buildings:[], pointcloud:[], tilesets:[], nure:[] };
Cesium.createOsmBuildingsAsync().then(b => { layers.buildings.push(b); viewer.scene.primitives.add(b); b.show = true; });
Cesium.createGooglePhotorealistic3DTileset().then(t => { layers.pointcloud.push(t); viewer.scene.primitives.add(t); t.show = true; });
const C = { gold: Cesium.Color.GOLD, elec: Cesium.Color.CYAN, red: Cesium.Color.RED, blue: Cesium.Color.BLUE };
const mineData = [
  { id:'dubois', name:'Dubois Mine', lon:SITE.dubois.lon, lat:SITE.dubois.lat, color:C.gold, depth:100, layers:layers.mines },
  { id:'indiana', name:'Indiana Mine', lon:SITE.indiana.lon, lat:SITE.indiana.lat, color:C.elec, depth:100, layers:layers.mines }
];
mineData.forEach(m => {
  const e = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(m.lon, m.lat, 0), point: { pixelSize:15, color:m.color } });
  m.layers.push(e);
});
const NURE_SAMPLES = [ {id:5262163,lon:-88.2333,lat:37.5349,Ce:43}, {id:5262170,lon:-88.3757,lat:37.4641,Ce:64} ];
NURE_SAMPLES.forEach(s => {
  const p = viewer.entities.add({ position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, 0), point: { pixelSize:10, color:Cesium.Color.ORANGE } });
  layers.nure.push(p);
});
window.flyTo = (t) => { viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 1000) }); };
window.toggleLayer = (n, el) => { const v = el.classList.toggle('active'); layers[n].forEach(e => e.show = v); };
viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(SITE.propCenter.lon, SITE.propCenter.lat, 1200) });
