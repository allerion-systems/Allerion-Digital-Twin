// ── DRONE SIMULATION ENGINE ──────────────────────────────────────────
// Allerion Intelligence — Autonomous Survey Simulation Layer
// Controls: WASD=move, QE=altitude, Arrows=rotate, Space=record waypoint
// ─────────────────────────────────────────────────────────────────────

(function() {
  'use strict';

  // ── STATE ────────────────────────────────────────────────────────────
  let droneActive = false;
  let fpvMode = false;
  let droneEntity = null;
  let trailEntities = [];
  let waypoints = [];
  let agentEntities = [];
  let miningTargets = [];

  // Drone position state (lon, lat, altitude in meters)
  const droneState = {
    lon: -88.3746,
    lat: 37.4535,
    alt: 80,
    heading: 0,    // degrees
    pitch: 0,
    speed: 0.00004, // degrees per tick (~4m at this lat)
    altSpeed: 2,
    rotSpeed: 2,
    battery: 100,
    flightTime: 0,
    distanceTraveled: 0,
  };

  // Keyboard state
  const keys = {};
  document.addEventListener('keydown', e => { if(droneActive) keys[e.key.toLowerCase()] = true; });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // ── DRONE ENTITY CREATION ───────────────────────────────────────────
  function createDrone() {
    if (droneEntity) return;

    // Main drone body
    droneEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, droneState.alt),
      // Drone body — box
      box: {
        dimensions: new Cesium.Cartesian3(3, 3, 1),
        material: Cesium.Color.fromCssColorString('#5a6850').withAlpha(0.9),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#4af0c8'),
        outlineWidth: 2,
      },
      // Label above drone
      label: {
        text: 'SCOUT-1',
        font: '700 10px monospace',
        fillColor: Cesium.Color.fromCssColorString('#4af0c8'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // Rotor glow disc
    viewer.entities.add({
      position: new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, droneState.alt + 1);
      }, false),
      ellipse: {
        semiMinorAxis: 5,
        semiMajorAxis: 5,
        material: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.15),
        height: new Cesium.CallbackProperty(() => droneState.alt + 1, false),
      }
    });

    // Spotlight cone below drone
    viewer.entities.add({
      position: new Cesium.CallbackProperty(() => {
        return Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, droneState.alt / 2);
      }, false),
      cylinder: {
        length: new Cesium.CallbackProperty(() => droneState.alt, false),
        topRadius: 1,
        bottomRadius: new Cesium.CallbackProperty(() => droneState.alt * 0.3, false),
        material: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.04),
      }
    });
  }

  // ── FLIGHT LOOP ─────────────────────────────────────────────────────
  function updateDrone() {
    if (!droneActive || !droneEntity) return;

    const headingRad = Cesium.Math.toRadians(droneState.heading);
    let moved = false;

    // WASD — translate relative to heading
    if (keys['w'] || keys['arrowup']) {
      droneState.lat += Math.cos(headingRad) * droneState.speed;
      droneState.lon += Math.sin(headingRad) * droneState.speed;
      moved = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      droneState.lat -= Math.cos(headingRad) * droneState.speed;
      droneState.lon -= Math.sin(headingRad) * droneState.speed;
      moved = true;
    }
    if (keys['a']) {
      droneState.lat += Math.sin(headingRad) * droneState.speed;
      droneState.lon -= Math.cos(headingRad) * droneState.speed;
      moved = true;
    }
    if (keys['d']) {
      droneState.lat -= Math.sin(headingRad) * droneState.speed;
      droneState.lon += Math.cos(headingRad) * droneState.speed;
      moved = true;
    }

    // QE — altitude
    if (keys['e']) droneState.alt = Math.min(500, droneState.alt + droneState.altSpeed);
    if (keys['q']) droneState.alt = Math.max(5, droneState.alt - droneState.altSpeed);

    // Arrow left/right — yaw
    if (keys['arrowleft'])  droneState.heading = (droneState.heading - droneState.rotSpeed + 360) % 360;
    if (keys['arrowright']) droneState.heading = (droneState.heading + droneState.rotSpeed) % 360;

    // Shift — speed boost
    if (keys['shift']) {
      droneState.speed = 0.00012;
    } else {
      droneState.speed = 0.00004;
    }

    // Update position
    const pos = Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, droneState.alt);
    droneEntity.position = pos;

    // Battery drain
    if (moved) {
      droneState.battery = Math.max(0, droneState.battery - 0.005);
      droneState.distanceTraveled += droneState.speed * 111000; // rough meters
    }
    droneState.flightTime += 1/60;

    // Camera follow
    if (fpvMode) {
      // First-person view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat, droneState.alt),
        orientation: {
          heading: Cesium.Math.toRadians(droneState.heading),
          pitch: Cesium.Math.toRadians(-30),
          roll: 0,
        }
      });
    } else {
      // Third-person chase cam
      const dist = 60;
      const camLon = droneState.lon - Math.sin(headingRad) * 0.0005;
      const camLat = droneState.lat - Math.cos(headingRad) * 0.0005;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(camLon, camLat, droneState.alt + 30),
        orientation: {
          heading: Cesium.Math.toRadians(droneState.heading),
          pitch: Cesium.Math.toRadians(-25),
          roll: 0,
        }
      });
    }

    updateHUD();
  }

  // ── WAYPOINT SYSTEM ─────────────────────────────────────────────────
  function recordWaypoint() {
    const wp = {
      lon: droneState.lon,
      lat: droneState.lat,
      alt: droneState.alt,
      heading: droneState.heading,
      time: droneState.flightTime,
      index: waypoints.length,
    };
    waypoints.push(wp);

    // Visual marker
    const marker = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString('#4af0c8'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `WP-${wp.index}`,
        font: '600 8px monospace',
        fillColor: Cesium.Color.fromCssColorString('#4af0c8'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(12, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      }
    });
    trailEntities.push(marker);

    if (waypoints.length > 1) {
      const prev = waypoints[waypoints.length - 2];
      const trail = viewer.entities.add({
        polyline: {
          positions: [
            Cesium.Cartesian3.fromDegrees(prev.lon, prev.lat, prev.alt),
            Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
          ],
          width: 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString('#4af0c8').withAlpha(0.7),
          }),
        }
      });
      trailEntities.push(trail);
    }

    console.log(`Waypoint ${wp.index}: ${wp.lat.toFixed(6)}, ${wp.lon.toFixed(6)} @ ${wp.alt}m`);
  }

  document.addEventListener('keydown', e => {
    if (droneActive && e.code === 'Space') {
      e.preventDefault();
      recordWaypoint();
    }
    if (droneActive && e.key.toLowerCase() === 'v') {
      fpvMode = !fpvMode;
    }
  });

  class SurveyAgent {
    constructor(id, color, startWP) {
      this.id = id;
      this.color = color;
      this.waypointIndex = startWP || 0;
      this.speed = 0.3; 
      this.progress = 0;
      this.active = false;
      this.entity = null;
      this.scanRadius = 30;
      this.scannedArea = [];
    }

    spawn() {
      if (waypoints.length < 2) {
        console.warn('Need at least 2 waypoints to spawn an agent');
        return;
      }
      const wp = waypoints[this.waypointIndex];
      this.entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
        point: {
          pixelSize: 12,
          color: Cesium.Color.fromCssColorString(this.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: this.id,
          font: '700 9px monospace',
          fillColor: Cesium.Color.fromCssColorString(this.color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(15, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
      });
      agentEntities.push(this.entity);
      this.active = true;
    }

    update() {
      if (!this.active || !this.entity || waypoints.length < 2) return;

      this.progress += 0.005 * this.speed;
      if (this.progress >= 1.0) {
        this.progress = 0;
        this.waypointIndex = (this.waypointIndex + 1) % waypoints.length;

        // Record scanned position
        const wp = waypoints[this.waypointIndex];
        this.scannedArea.push({ lon: wp.lon, lat: wp.lat });

        // Drop scan circle
        const scanMark = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, 0),
          ellipse: {
            semiMinorAxis: this.scanRadius,
            semiMajorAxis: this.scanRadius,
            material: Cesium.Color.fromCssColorString(this.color).withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.fromCssColorString(this.color).withAlpha(0.3),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          }
        });
        agentEntities.push(scanMark);
      }

      // Interpolate between current and next waypoint
      const curr = waypoints[this.waypointIndex];
      const next = waypoints[(this.waypointIndex + 1) % waypoints.length];
      const lon = curr.lon + (next.lon - curr.lon) * this.progress;
      const lat = curr.lat + (next.lat - curr.lat) * this.progress;
      const alt = curr.alt + (next.alt - curr.alt) * this.progress;

      this.entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
    }
  }

  const agents = [
    new SurveyAgent('AGENT-α', '#ff4444', 0),
    new SurveyAgent('AGENT-β', '#44aaff', 0),
    new SurveyAgent('AGENT-γ', '#ffaa00', 0),
  ];

  // ── MINING SIMULATION ───────────────────────────────────────────────
  // Click-to-mark drill targets during drone survey
  function enableMiningMode() {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function(click) {
      if (!droneActive) return;
      const ray = viewer.camera.getPickRay(click.position);
      const globe = viewer.scene.globe;
      const cartesian = globe.pick(ray, viewer.scene);
      if (cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const lat = Cesium.Math.toDegrees(carto.latitude);

        const target = {
          lon, lat,
          depth: Math.floor(Math.random() * 200 + 100), // simulated target depth
          priority: miningTargets.length < 3 ? 'HIGH' : 'MEDIUM',
        };
        miningTargets.push(target);

        // Visual — drilling target reticle
        const reticle = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
          point: {
            pixelSize: 14,
            color: Cesium.Color.RED.withAlpha(0.8),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          ellipse: {
            semiMinorAxis: 20,
            semiMajorAxis: 20,
            material: Cesium.Color.RED.withAlpha(0.08),
            outline: true,
            outlineColor: Cesium.Color.RED.withAlpha(0.5),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: `DRILL-${miningTargets.length}\n${target.depth}ft · ${target.priority}`,
            font: '700 9px monospace',
            fillColor: Cesium.Color.RED,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -25),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString('#1a0000').withAlpha(0.85),
          }
        });
        agentEntities.push(reticle);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  function createHUD() {
    const hud = document.createElement('div');
    hud.id = 'drone-hud';
    hud.innerHTML = `
      <div class="hud-row"><span class="hud-key">STATUS</span><span class="hud-val" id="hud-status">STANDBY</span></div>
      <div class="hud-row"><span class="hud-key">ALT</span><span class="hud-val" id="hud-alt">—</span></div>
      <div class="hud-row"><span class="hud-key">HDG</span><span class="hud-val" id="hud-hdg">—</span></div>
      <div class="hud-row"><span class="hud-key">POS</span><span class="hud-val" id="hud-pos">—</span></div>
      <div class="hud-row"><span class="hud-key">BATT</span><span class="hud-val" id="hud-batt">—</span></div>
      <div class="hud-row"><span class="hud-key">WPs</span><span class="hud-val" id="hud-wps">0</span></div>
      <div class="hud-row"><span class="hud-key">AGENTS</span><span class="hud-val" id="hud-agents">0/3</span></div>
      <div class="hud-row"><span class="hud-key">TARGETS</span><span class="hud-val" id="hud-targets">0</span></div>
      <div class="hud-divider"></div>
      <div class="hud-controls">
        <div>WASD: Move &nbsp; QE: Alt</div>
        <div>←→: Rotate &nbsp; V: FPV</div>
        <div>Space: Waypoint &nbsp; Shift: Boost</div>
        <div>Click: Mark Drill Target</div>
      </div>
      <div class="hud-divider"></div>
      <button id="hud-deploy-agents" class="hud-btn">▶ DEPLOY AI AGENTS</button>
      <button id="hud-export" class="hud-btn" style="background:#1a2010;color:#aacc66;border-color:#667744;">⬇ EXPORT SURVEY</button>
    `;
    document.body.appendChild(hud);

    const style = document.createElement('style');
    style.textContent = `
      #drone-hud {
        position: fixed; top: 60px; right: 20px; z-index: 10000;
        background: rgba(4,5,6,0.92); border: 1px solid rgba(74,240,200,0.4);
        padding: 12px 16px; font-family: monospace; font-size: 11px;
        color: #ccc; min-width: 220px; backdrop-filter: blur(10px);
        display: none; border-radius: 4px;
      }
      #drone-hud.active { display: block; }
      .hud-row { display: flex; justify-content: space-between; padding: 3px 0; }
      .hud-key { color: #4af0c8; font-weight: 700; font-size: 10px; }
      .hud-val { color: #fff; font-weight: 700; }
      .hud-divider { border-top: 1px solid rgba(74,240,200,0.2); margin: 8px 0; }
      .hud-controls { font-size: 9px; color: #888; line-height: 1.8; }
      .hud-btn {
        display: block; width: 100%; margin-top: 6px; padding: 8px;
        background: #0a1a10; color: #4af0c8; border: 1px solid #4af0c8;
        font-family: monospace; font-size: 10px; font-weight: 700;
        cursor: pointer; text-align: center; letter-spacing: 0.1em;
      }
      .hud-btn:hover { background: #1a3a20; }
    `;
    document.head.appendChild(style);

    document.getElementById('hud-deploy-agents').addEventListener('click', deployAgents);
    document.getElementById('hud-export').addEventListener('click', exportSurvey);
  }

  function updateHUD() {
    const el = (id) => document.getElementById(id);
    if (!el('hud-status')) return;
    el('hud-status').textContent = droneActive ? (fpvMode ? 'FPV ACTIVE' : 'AIRBORNE') : 'STANDBY';
    el('hud-status').style.color = droneActive ? '#4af0c8' : '#ff4444';
    el('hud-alt').textContent = `${droneState.alt.toFixed(0)}m AGL`;
    el('hud-hdg').textContent = `${droneState.heading.toFixed(0)}°`;
    el('hud-pos').textContent = `${droneState.lat.toFixed(5)}, ${droneState.lon.toFixed(5)}`;
    el('hud-batt').textContent = `${droneState.battery.toFixed(1)}%`;
    el('hud-batt').style.color = droneState.battery > 30 ? '#4af0c8' : '#ff4444';
    el('hud-wps').textContent = waypoints.length;
    el('hud-agents').textContent = `${agents.filter(a=>a.active).length}/3`;
    el('hud-targets').textContent = miningTargets.length;
  }

  // ── AI AGENT DEPLOYMENT ─────────────────────────────────────────────
  function deployAgents() {
    if (waypoints.length < 2) {
      alert('Record at least 2 waypoints first! Fly the drone and press SPACE to drop waypoints.');
      return;
    }
    agents.forEach((agent, i) => {
      agent.waypointIndex = i % waypoints.length;
      agent.spawn();
    });
    document.getElementById('hud-deploy-agents').textContent = '● AGENTS ACTIVE';
    document.getElementById('hud-deploy-agents').style.color = '#44ff44';
  }

  // ── EXPORT SURVEY DATA ──────────────────────────────────────────────
  function exportSurvey() {
    const data = {
      mission: 'ALLERION-GENESIS-SURVEY',
      timestamp: new Date().toISOString(),
      drone: { ...droneState },
      waypoints: waypoints,
      drillTargets: miningTargets,
      agentScans: agents.map(a => ({
        id: a.id,
        scannedPositions: a.scannedArea.length,
        active: a.active,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `allerion-survey-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── MAIN TOGGLE ─────────────────────────────────────────────────────
  window.toggleDroneMode = function() {
    droneActive = !droneActive;
    const hud = document.getElementById('drone-hud');

    if (droneActive) {
      // Reset drone to property center
      droneState.lon = -88.3746;
      droneState.lat = 37.4535;
      droneState.alt = 80;
      droneState.heading = 0;
      droneState.battery = 100;
      droneState.flightTime = 0;

      createDrone();
      hud.classList.add('active');
      enableMiningMode();

      // Fly camera to drone
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(droneState.lon, droneState.lat - 0.002, droneState.alt + 50),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-30),
          roll: 0,
        },
        duration: 1.5,
      });
    } else {
      hud.classList.remove('active');
    }
  };

  // ── RENDER LOOP ─────────────────────────────────────────────────────
  createHUD();

  // Hook into Cesium's render loop
  viewer.clock.onTick.addEventListener(() => {
    updateDrone();
    agents.forEach(a => a.update());
  });

})();
