// ── DRONE SIMULATION ENGINE ──────────────────────────────────────────
(function() {
  'use strict';
  let droneActive = false;
  let droneEntity = null;
  const droneState = { lon: -88.3746, lat: 37.4535, alt: 80, heading: 0, battery: 100 };
  
  window.toggleDroneSimulation = function() {
    droneActive = !droneActive;
    if (droneActive) {
      console.log('Drone Sim Activated');
      // Fly to property center
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, 500),
        duration: 2
      });
    } else {
      console.log('Drone Sim Deactivated');
    }
  };
})();