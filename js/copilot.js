// ── ALLERION GEOSPATIAL COPILOT ──────────────────────────────────────
// A client-side geospatial assistant that interacts with the Digital Twin.
// Understands natural language queries about the property, mines, geology,
// and can control the map (fly to locations, toggle layers, change views).

(function () {
  'use strict';

  // ── KNOWLEDGE BASE ───────────────────────────────────────────────────
  const KB = {
    property: {
      name: 'Allerion Land / J. Allee Wholesale Mining',
      county: 'Hardin County, Illinois',
      section: 'Section 19, T12S, R8E',
      acres: 40,
      center: { lat: 37.453466, lon: -88.374611 },
      description: 'A 40 net mineral acre property in the Illinois-Kentucky Fluorspar District (IKFD), one of the largest historic fluorspar producing regions in the United States. The property contains 3 confirmed mine shafts and is located adjacent to Hicks Dome, a major HREE source.',
    },
    mines: [
      {
        id: 'dubois',
        name: 'Dubois Mine',
        lat: 37.4537, lon: -88.3744,
        depth: 250,
        type: 'Fluorspar Mine',
        strike: 'N60-65°E',
        status: 'ISGS Documented',
        operator: 'Crown Fluorspar Corp.',
        detail: 'Operations since 1904 on the Illinois-Furnace fault. Shaft depths 50–100ft. Ore strike N60-65°E, dipping nearly vertical. Total tonnage: 1,000–2,000T historically. Adjacent to 3 documented veins.',
      },
      {
        id: 'indiana',
        name: 'Indiana Mine (Hillside No.2)',
        lat: 37.4532, lon: -88.3748,
        depth: 280,
        type: 'Fluorspar Mine',
        strike: 'N18°E',
        status: '5,900T Confirmed',
        operator: 'Indiana Fluorspar Land Co. / U.S. Fluorspar Co.',
        detail: 'Most productive shaft on the property. 5,900 tonnes extracted 1923–1925. Works 2 veins 130ft apart at surface. Strike N18°E, dip sharply to the west. Shafts 50–65ft, workings 30–100ft depth.',
      },
      {
        id: 'lavender',
        name: 'Lavender Mine',
        lat: 37.4540, lon: -88.3738,
        depth: 260,
        type: 'Fluorspar Mine — Gravelspar Vein',
        strike: 'N-S80°W',
        status: 'Confirmed',
        operator: 'C.H. Stone',
        detail: '4-vein deposit of gravelspar fluorspar. Oriented N-S80°W. Shaft 40ft deep. Connected to the main Dubois fault system. Gravelspar variety indicates near-surface weathered fluorite — often highest purity.',
      },
    ],
    coreHoles: [
      { id: 'corech1', name: 'USGS Core Hole 1', year: 1944, depth: 310, source: 'USBM RI 4315', note: 'Tested Mississippian only. Fluorspar deposit mapped at depth 240–265ft. Never tested for REE.' },
      { id: 'corech2', name: 'USGS Core Hole 2', year: 1944, depth: 285, source: 'USBM RI 4315', note: 'Fluorspar veins mapped at 200ft depth.' },
      { id: 'corech3', name: 'USGS Core Hole 3', year: 1944, depth: 260, source: 'USBM RI 4315', note: 'Deposit mapped across 4 distinct strata boundaries.' },
      { id: 'corech4', name: 'USGS Core Hole 4', year: 1944, depth: 251, source: 'USBM RI 4315', note: 'Confirmed structural connection to Dubois Gravelspar deposit.' },
    ],
    hicksDome: {
      name: 'Hicks Dome',
      lat: 37.4935, lon: -88.3718,
      relation: 'ADJACENT — Not on Allerion Property (~3 mi SW)',
      resource: '14.7M T @ 0.42% REO',
      source: 'USGS OFR-2012-1048',
      description: 'A cryptovolcanic structure that is the primary source of Heavy Rare Earth Elements (HREE) in the district. Contains enrichments of Dy, Tb, Sc, and Y at levels 10× greater than Mountain Pass, CA.',
    },
    geology: {
      district: 'Illinois-Kentucky Fluorspar District (IKFD)',
      formation: 'Mississippian limestone with Devonian and Ordovician strata below',
      faults: 'Illinois-Furnace Fault system — major NE-SW structural control',
      minerals: ['Fluorspar (CaF₂)', 'Barite', 'Galena', 'Sphalerite', 'Rare Earth Elements (REE)'],
      hreeElements: 'Dysprosium (Dy), Terbium (Tb), Scandium (Sc), Yttrium (Y)',
      lreeElements: 'Cerium (Ce), Lanthanum (La), Neodymium (Nd), Praseodymium (Pr)',
      reeEnrichment: '10× enrichment vs Mountain Pass, CA (USGS OFR-2012-1048)',
      oreEstimate: '12–65 million tons (district-wide)',
    },
    layers: {
      mines: 'Mine Shafts — 3 confirmed shafts (Dubois, Indiana, Lavender)',
      cores: 'USGS Core Holes — 4 core holes drilled in 1944 (USBM RI 4315)',
      veins: 'Fluorspar Veins — documented vein strike directions from ISGS',
      interpolation: 'Grade Interpolation — Kriging-based geological block model',
      buildings: 'OSM 3D Buildings — OpenStreetMap building footprints',
      pointcloud: 'Point Cloud — Google Photorealistic 3D Tiles',
      hree: 'HREE Zone — western half of parcel (Dy/Tb/Sc/Y)',
      lree: 'LREE Zone — eastern half of parcel (Ce/La/Nd/Pr)',
      property: 'Property Boundary — 40-acre Allerion parcel outline',
      hicksdome: 'Hicks Dome — adjacent HREE cryptovolcanic source',
      earthmri: 'Earth MRI — USGS Earth Mapping Resources Initiative boundaries',
    },
  };

  // ── COMMAND INTENTS ──────────────────────────────────────────────────
  // Pattern-to-intent mapping for natural language understanding
  const intents = [
    // Fly-to commands
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(overview|full site|whole|entire|property|parcel|site)\b/i], action: 'flyTo', target: 'overview' },
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(dubois|du bois)\b/i], action: 'flyTo', target: 'dubois' },
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(indiana|hillside)\b/i], action: 'flyTo', target: 'indiana' },
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(core|usgs|drill)\b/i], action: 'flyTo', target: 'cores' },
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(hicks|dome)\b/i], action: 'flyTo', target: 'hicksdome' },
    { patterns: [/\b(fly|go|navigate|take me|zoom|show me|view)\b.*\b(regional|district|area)\b/i], action: 'flyTo', target: 'regional' },

    // Layer toggles
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(mine|shaft)\b/i], action: 'showLayer', target: 'mines' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(mine|shaft)\b/i], action: 'hideLayer', target: 'mines' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(core|drill)\b/i], action: 'showLayer', target: 'cores' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(core|drill)\b/i], action: 'hideLayer', target: 'cores' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(vein)\b/i], action: 'showLayer', target: 'veins' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(vein)\b/i], action: 'hideLayer', target: 'veins' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(kriging|interpolat|grade)\b/i], action: 'showLayer', target: 'interpolation' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(kriging|interpolat|grade)\b/i], action: 'hideLayer', target: 'interpolation' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(build|osm)\b/i], action: 'showLayer', target: 'buildings' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(build|osm)\b/i], action: 'hideLayer', target: 'buildings' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(point cloud|photo|google)\b/i], action: 'showLayer', target: 'pointcloud' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(point cloud|photo|google)\b/i], action: 'hideLayer', target: 'pointcloud' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(hree|heavy rare)\b/i], action: 'showLayer', target: 'hree' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(hree|heavy rare)\b/i], action: 'hideLayer', target: 'hree' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(lree|light rare)\b/i], action: 'showLayer', target: 'lree' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(lree|light rare)\b/i], action: 'hideLayer', target: 'lree' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(propert|boundar|parcel)\b/i], action: 'showLayer', target: 'property' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(propert|boundar|parcel)\b/i], action: 'hideLayer', target: 'property' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(hicks|dome)\b/i], action: 'showLayer', target: 'hicksdome' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(hicks|dome)\b/i], action: 'hideLayer', target: 'hicksdome' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(earth ?mri|usgs.*bound)\b/i], action: 'showLayer', target: 'earthmri' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(earth ?mri|usgs.*bound)\b/i], action: 'hideLayer', target: 'earthmri' },
    { patterns: [/\b(show|enable|turn on|display|activate)\b.*\b(all layers|everything)\b/i], action: 'showAllLayers' },
    { patterns: [/\b(hide|disable|turn off|remove|deactivate)\b.*\b(all layers|everything)\b/i], action: 'hideAllLayers' },

    // View mode commands
    { patterns: [/\b(switch|change|set)\b.*\b(3d|three.?d|terrain)\b/i], action: 'setView', target: '3d' },
    { patterns: [/\b(switch|change|set)\b.*\b(2d|two.?d|top.?down|flat)\b/i], action: 'setView', target: '2d' },
    { patterns: [/\b(toggle|enable|show|activate)\b.*\b(x.?ray|underground|transluc)\b/i], action: 'toggleXray' },
    { patterns: [/\b(toggle|enable|show|activate)\b.*\b(sun|light|day)\b/i], action: 'toggleLighting' },
    { patterns: [/\b(toggle|enable|show|activate)\b.*\b(orbit|lock|track)\b/i], action: 'toggleOrbit' },
    { patterns: [/\b(toggle|enable|show|activate)\b.*\b(split|dual|side)\b/i], action: 'toggleSplit' },

    // Information queries
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(dubois|du bois)\b.*\b(mine)?\b/i], action: 'info', target: 'dubois' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(indiana|hillside)\b/i], action: 'info', target: 'indiana' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(lavender)\b/i], action: 'info', target: 'lavender' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(core|drill)\b/i], action: 'info', target: 'cores' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(hicks|dome)\b/i], action: 'info', target: 'hicksdome' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(propert|site|parcel|allerion)\b/i], action: 'info', target: 'property' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(geolog|formation|rock|strata)\b/i], action: 'info', target: 'geology' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(mineral|fluorspar|fluorite|barite)\b/i], action: 'info', target: 'minerals' },
    { patterns: [/\b(what|tell|info|about|describe|detail)\b.*\b(ree|rare earth|hree|lree)\b/i], action: 'info', target: 'ree' },
    { patterns: [/\b(what|tell|info|about|describe)\b.*\b(layer|toggle|overlay)\b/i], action: 'info', target: 'layers' },
    { patterns: [/\b(what|tell|info|about|describe)\b.*\b(fault|structure)\b/i], action: 'info', target: 'faults' },
    { patterns: [/\b(how much|tonnage|production|ore|resource)\b/i], action: 'info', target: 'tonnage' },
    { patterns: [/\b(coordinate|location|where|lat|lon|gps)\b.*\b(propert|site|center)\b/i], action: 'info', target: 'coordinates' },
    { patterns: [/\b(coordinate|location|where|lat|lon|gps)\b/i], action: 'info', target: 'coordinates' },

    // Measurement / analysis
    { patterns: [/\b(measure|distance|how far)\b/i], action: 'measure' },
    { patterns: [/\b(exagger|terrain height|vertical)\b/i], action: 'info', target: 'exaggeration' },

    // Help
    { patterns: [/\b(help|what can you|command|how do i|tutorial|guide)\b/i], action: 'help' },
    { patterns: [/\b(hello|hi|hey|greet)\b/i], action: 'greet' },
  ];

  // ── RESPONSE GENERATORS ──────────────────────────────────────────────

  function generateResponse(action, target) {
    switch (action) {
      case 'flyTo':
        return handleFlyTo(target);
      case 'showLayer':
        return handleLayerToggle(target, true);
      case 'hideLayer':
        return handleLayerToggle(target, false);
      case 'showAllLayers':
        return handleAllLayers(true);
      case 'hideAllLayers':
        return handleAllLayers(false);
      case 'setView':
        return handleSetView(target);
      case 'toggleXray':
        return handleToggle('toggleUnderground', 'X-Ray underground view');
      case 'toggleLighting':
        return handleToggle('toggleLighting', 'Sunlight simulation');
      case 'toggleOrbit':
        return handleToggle('toggleOrbitLock', 'Orbit lock to parcel');
      case 'toggleSplit':
        return handleToggle('toggleSplitScreen', 'Dual sync view');
      case 'info':
        return handleInfo(target);
      case 'measure':
        return { text: '📏 **Measurement Mode**\nTo measure distances, use the Cesium ruler by holding Shift and clicking two points on the map. The distance between your points will be displayed in the coordinate bar at the top right.' };
      case 'help':
        return getHelpResponse();
      case 'greet':
        return { text: '👋 **Hello!** I\'m the Allerion Geospatial Copilot.\n\nI can help you explore this 40-acre critical mineral property in Hardin County, IL. Try asking me:\n\n• "Fly to the Indiana Mine"\n• "Show me the HREE zone"\n• "Tell me about Hicks Dome"\n• "What minerals are on this property?"\n• "Turn on the point cloud"\n\nType **help** for a full command list.' };
      default:
        return { text: '🤔 I\'m not sure what you mean. Try asking about the property, mines, geology, or ask me to fly somewhere or toggle a layer. Type **help** for available commands.' };
    }
  }

  function handleFlyTo(target) {
    if (typeof window.flyTo === 'function') {
      window.flyTo(target);
    }
    var labels = {
      overview: '🌍 Flying to property overview…',
      dubois: '⛏️ Flying to the Dubois Mine…',
      indiana: '⛏️ Flying to the Indiana Mine (5,900T)…',
      cores: '🔬 Flying to the USGS Core Holes…',
      hicksdome: '🔬 Flying to Hicks Dome (~3mi SW)…',
      regional: '🗺️ Flying to regional context view…',
    };
    return { text: labels[target] || '✈️ Flying to ' + target + '…', action: 'flyTo' };
  }

  function handleLayerToggle(layerName, show) {
    var el = document.querySelector('[data-layer="' + layerName + '"]');
    if (el) {
      var isActive = el.classList.contains('active');
      if ((show && !isActive) || (!show && isActive)) {
        el.click();
      }
    }
    var desc = KB.layers[layerName] || layerName;
    var icon = show ? '👁️' : '🚫';
    return { text: icon + ' **' + (show ? 'Enabled' : 'Disabled') + ':** ' + desc, action: 'layer' };
  }

  function handleAllLayers(show) {
    var allLayerNames = Object.keys(KB.layers);
    allLayerNames.forEach(function (name) {
      var el = document.querySelector('[data-layer="' + name + '"]');
      if (el) {
        var isActive = el.classList.contains('active');
        if ((show && !isActive) || (!show && isActive)) {
          el.click();
        }
      }
    });
    return { text: show ? '👁️ **All layers enabled.** Every data overlay is now visible on the map.' : '🚫 **All layers hidden.** The map is now showing base imagery only.' };
  }

  function handleSetView(mode) {
    if (typeof window.setView === 'function') {
      window.setView(mode);
    }
    return { text: mode === '3d' ? '🏔️ Switched to **3D Terrain** view with perspective camera.' : '🗺️ Switched to **2D Top-Down** view.' };
  }

  function handleToggle(funcName, label) {
    if (typeof window[funcName] === 'function') {
      window[funcName]();
    }
    return { text: '🔄 Toggled **' + label + '**.' };
  }

  function handleInfo(target) {
    switch (target) {
      case 'dubois':
        var m = KB.mines[0];
        return { text: '⛏️ **' + m.name + '**\n_' + m.type + ' — ' + m.status + '_\n\n' + m.detail + '\n\n• **Strike:** ' + m.strike + '\n• **Depth:** ' + m.depth + 'ft\n• **Operator:** ' + m.operator + '\n• **Location:** ' + m.lat + '°N, ' + Math.abs(m.lon) + '°W' };
      case 'indiana':
        var m2 = KB.mines[1];
        return { text: '⛏️ **' + m2.name + '**\n_' + m2.type + ' — ' + m2.status + '_\n\n' + m2.detail + '\n\n• **Strike:** ' + m2.strike + '\n• **Depth:** ' + m2.depth + 'ft\n• **Operator:** ' + m2.operator + '\n• **Location:** ' + m2.lat + '°N, ' + Math.abs(m2.lon) + '°W' };
      case 'lavender':
        var m3 = KB.mines[2];
        return { text: '⛏️ **' + m3.name + '**\n_' + m3.type + ' — ' + m3.status + '_\n\n' + m3.detail + '\n\n• **Strike:** ' + m3.strike + '\n• **Depth:** ' + m3.depth + 'ft\n• **Operator:** ' + m3.operator + '\n• **Location:** ' + m3.lat + '°N, ' + Math.abs(m3.lon) + '°W' };
      case 'cores':
        var lines = '🔬 **USGS Core Holes (1944)**\n_Source: USBM RI 4315_\n\n';
        KB.coreHoles.forEach(function (c) {
          lines += '• **' + c.name + ':** Depth ' + c.depth + 'ft — ' + c.note + '\n';
        });
        return { text: lines };
      case 'hicksdome':
        var h = KB.hicksDome;
        return { text: '🔬 **' + h.name + '**\n_' + h.relation + '_\n\n' + h.description + '\n\n• **Resource:** ' + h.resource + '\n• **Source:** ' + h.source };
      case 'property':
        var p = KB.property;
        return { text: '📍 **' + p.name + '**\n_' + p.county + ' — ' + p.section + '_\n\n' + p.description + '\n\n• **Acreage:** ' + p.acres + ' net mineral acres\n• **Center:** ' + p.center.lat + '°N, ' + Math.abs(p.center.lon) + '°W\n• **Confirmed Shafts:** 3 (ISGS 1988)' };
      case 'geology':
        var g = KB.geology;
        return { text: '🪨 **Geological Context**\n\n• **District:** ' + g.district + '\n• **Formation:** ' + g.formation + '\n• **Faults:** ' + g.faults + '\n• **Ore Estimate:** ' + g.oreEstimate };
      case 'minerals':
        return { text: '💎 **Minerals Present**\n\n' + KB.geology.minerals.map(function (m) { return '• ' + m; }).join('\n') + '\n\nFluorspar (CaF₂) is the primary mineral mined historically. The property also shows potential for rare earth elements based on proximity to Hicks Dome.' };
      case 'ree':
        var g2 = KB.geology;
        return { text: '🧪 **Rare Earth Elements (REE)**\n\n• **HREE (Heavy):** ' + g2.hreeElements + '\n• **LREE (Light):** ' + g2.lreeElements + '\n• **Enrichment:** ' + g2.reeEnrichment + '\n\n⚠️ REE claims below 310ft are **inferred**, not measured on-site. Hicks Dome data is from ADJACENT property.' };
      case 'layers':
        var layerList = '🗂️ **Available Map Layers**\n\n';
        Object.keys(KB.layers).forEach(function (key) {
          layerList += '• **' + key + ':** ' + KB.layers[key] + '\n';
        });
        layerList += '\nSay "show [layer]" or "hide [layer]" to toggle them.';
        return { text: layerList };
      case 'faults':
        return { text: '🌋 **Fault Systems**\n\nThe property sits on the **Illinois-Furnace Fault** system, a major NE-SW structural control in the Illinois-Kentucky Fluorspar District.\n\n• Dubois Mine vein strikes **N60-65°E**\n• Indiana Mine vein strikes **N18°E**\n• Lavender Mine vein strikes **N-S80°W**\n\nThese intersecting fault planes created the conduits for hydrothermal fluorspar mineralization.' };
      case 'tonnage':
        return { text: '📊 **Production & Resource Data**\n\n• **Indiana Mine:** 5,900 tonnes (1923–1925 alone)\n• **Dubois Mine:** 1,000–2,000T historically\n• **District Estimate:** 12–65 million tons\n• **Hicks Dome (ADJACENT):** 14.7M T @ 0.42% REO\n• **HREE vs Mt. Pass:** 10× enrichment' };
      case 'coordinates':
        var cp = KB.property.center;
        return { text: '📍 **Property Coordinates**\n\n• **Center:** ' + cp.lat + '°N, ' + Math.abs(cp.lon) + '°W\n• **Section:** 19, T12S, R8E\n• **County:** Hardin, Illinois\n\nMine locations:\n• Dubois: 37.4537°N, 88.3744°W\n• Indiana: 37.4532°N, 88.3748°W\n• Lavender: 37.4540°N, 88.3738°W' };
      case 'exaggeration':
        return { text: '🏔️ **Terrain Vertical Exaggeration**\n\nThe map currently exaggerates terrain height to make geological features more visible. Default is **2.5×**.\n\nUse the slider in the left panel under "Terrain Height" to adjust between 1× (realistic) and 5× (maximum drama).' };
      default:
        return { text: '🤔 I don\'t have specific information about that. Try asking about the mines, property, geology, core holes, Hicks Dome, or available layers.' };
    }
  }

  function getHelpResponse() {
    return {
      text: '🧭 **Allerion Geospatial Copilot — Commands**\n\n' +
        '**Navigation:**\n' +
        '• "Fly to the overview" — zoom to full property\n' +
        '• "Go to Dubois Mine" — focus on a specific mine\n' +
        '• "Show me Hicks Dome" — fly to Hicks Dome\n' +
        '• "Switch to 3D / 2D" — change view mode\n\n' +
        '**Layers:**\n' +
        '• "Show the mine shafts" — enable a layer\n' +
        '• "Hide the veins" — disable a layer\n' +
        '• "Show all layers" / "Hide all layers"\n' +
        '• "What layers are available?"\n\n' +
        '**Information:**\n' +
        '• "Tell me about the Indiana Mine"\n' +
        '• "What minerals are here?"\n' +
        '• "Describe the geology"\n' +
        '• "How much ore has been produced?"\n' +
        '• "Where is the property?"\n\n' +
        '**Tools:**\n' +
        '• "Toggle X-Ray" — see underground\n' +
        '• "Toggle sunlight" — enable sun simulation\n' +
        '• "Toggle orbit lock" — orbit around parcel\n' +
        '• "Toggle dual view" — side-by-side maps'
    };
  }

  // ── PARSE INPUT ──────────────────────────────────────────────────────

  function parseInput(text) {
    var input = text.trim().toLowerCase();

    // Direct layer name matching for simple commands
    if (/^(mines?|shafts?)$/i.test(input)) return { action: 'info', target: 'dubois' };
    if (/^(cores?|drill)$/i.test(input)) return { action: 'info', target: 'cores' };
    if (/^(hicks|dome)$/i.test(input)) return { action: 'info', target: 'hicksdome' };
    if (/^(property|parcel|site)$/i.test(input)) return { action: 'info', target: 'property' };
    if (/^(geology|formation|rocks?)$/i.test(input)) return { action: 'info', target: 'geology' };
    if (/^(ree|rare earth|hree|lree)$/i.test(input)) return { action: 'info', target: 'ree' };
    if (/^(minerals?|fluorspar)$/i.test(input)) return { action: 'info', target: 'minerals' };
    if (/^(layers?|overlays?)$/i.test(input)) return { action: 'info', target: 'layers' };
    if (/^(dubois|du bois)$/i.test(input)) return { action: 'info', target: 'dubois' };
    if (/^(indiana|hillside)$/i.test(input)) return { action: 'info', target: 'indiana' };
    if (/^(lavender)$/i.test(input)) return { action: 'info', target: 'lavender' };
    if (/^(help|\?)$/i.test(input)) return { action: 'help' };
    if (/^(hi|hello|hey)$/i.test(input)) return { action: 'greet' };

    // Pattern matching against intents
    for (var i = 0; i < intents.length; i++) {
      for (var j = 0; j < intents[i].patterns.length; j++) {
        if (intents[i].patterns[j].test(input)) {
          return { action: intents[i].action, target: intents[i].target };
        }
      }
    }

    // Fuzzy fallback: check if any mine name is mentioned
    if (/dubois|du bois/i.test(input)) return { action: 'info', target: 'dubois' };
    if (/indiana|hillside/i.test(input)) return { action: 'info', target: 'indiana' };
    if (/lavender/i.test(input)) return { action: 'info', target: 'lavender' };
    if (/hicks|dome/i.test(input)) return { action: 'info', target: 'hicksdome' };
    if (/core|drill/i.test(input)) return { action: 'info', target: 'cores' };
    if (/propert|parcel|allerion|site/i.test(input)) return { action: 'info', target: 'property' };
    if (/geolog|formation|strata|rock/i.test(input)) return { action: 'info', target: 'geology' };
    if (/mineral|fluorspar|fluorite|barite/i.test(input)) return { action: 'info', target: 'minerals' };
    if (/ree|rare earth/i.test(input)) return { action: 'info', target: 'ree' };
    if (/fault|fracture|structure/i.test(input)) return { action: 'info', target: 'faults' };
    if (/tonnage|production|ore|resource|ton/i.test(input)) return { action: 'info', target: 'tonnage' };
    if (/layer|overlay|toggle/i.test(input)) return { action: 'info', target: 'layers' };
    if (/coordinate|location|where|lat|lon/i.test(input)) return { action: 'info', target: 'coordinates' };

    return { action: 'unknown' };
  }

  // ── SIMPLE MARKDOWN RENDERER ─────────────────────────────────────────

  function escapeHTMLEntities(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderMarkdown(text) {
    return escapeHTMLEntities(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // ── CHAT HISTORY ─────────────────────────────────────────────────────
  var chatHistory = [];

  // ── PUBLIC API ────────────────────────────────────────────────────────

  window.AllerionCopilot = {
    /** Process a user message and return a response */
    ask: function (userText) {
      chatHistory.push({ role: 'user', text: userText });
      var parsed = parseInput(userText);
      var response = generateResponse(parsed.action, parsed.target);
      chatHistory.push({ role: 'copilot', text: response.text });
      return response;
    },

    /** Get the full chat history */
    getHistory: function () {
      return chatHistory;
    },

    /** Clear chat history */
    clearHistory: function () {
      chatHistory = [];
    },

    /** Render a response as HTML */
    renderHTML: function (text) {
      return renderMarkdown(text);
    },

    /** Get the knowledge base (for external use) */
    getKnowledgeBase: function () {
      return KB;
    },
  };
})();
