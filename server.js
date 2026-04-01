const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the static twin application files
app.use(express.static(path.join(__dirname, '.')));

// ── DIGITAL TWIN ENHANCEMENT ENDPOINTS ────────────────────────────────
// The user explicitly requested: "make this a server that you can alweays pull from 
// to enhance and update this digital twin and call on these tools if you need to."

// Endpoint to dynamically inject or fetch experimental tools like 3D Gaussian Splatting comparisons
app.get('/api/tools/gaussian-splatting', (req, res) => {
    res.json({
        assetId: 2464651,
        source: "https://sandcastle.cesium.com/?id=3d-tiles-gaussian-splatting-comparison",
        status: "Available for client-side injection"
    });
});

// ── COPILOT API ENDPOINT ──────────────────────────────────────────────
// Provides a server-side hook for future AI provider integration.
// Currently returns the client-side knowledge base and processes queries
// using the same intent-matching logic available in the browser.
app.post('/api/copilot', (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing "message" field in request body' });
    }

    // Return acknowledgment — the actual NLP runs client-side in copilot.js.
    // This endpoint can be extended to proxy to an external AI API (e.g., OpenAI)
    // while keeping the Cesium command execution on the client.
    res.json({
        received: message,
        hint: 'Query processed client-side by copilot.js. This endpoint can be extended to proxy to an external AI API for enhanced responses.',
        timestamp: new Date().toISOString(),
    });
});

// Returns the copilot knowledge base for external integrations
app.get('/api/copilot/knowledge', (req, res) => {
    res.json({
        property: {
            name: 'Allerion Land / J. Allee Wholesale Mining',
            county: 'Hardin County, Illinois',
            section: 'Section 19, T12S, R8E',
            acres: 40,
            center: { lat: 37.453466, lon: -88.374611 },
            confirmedShafts: 3,
        },
        mines: ['Dubois Mine', 'Indiana Mine (Hillside No.2)', 'Lavender Mine'],
        coreHoles: 4,
        adjacentFeatures: ['Hicks Dome (14.7M T @ 0.42% REO)'],
        availableLayers: [
            'mines', 'cores', 'veins', 'interpolation', 'buildings',
            'pointcloud', 'hree', 'lree', 'property', 'hicksdome', 'earthmri'
        ],
    });
});

app.listen(PORT, () => {
    console.log(`[Allerion Digital Twin] Core server instance running on port ${PORT}`);
    console.log(`[Allerion Digital Twin] Tool endpoints active. Ready to deploy anywhere.`);
    console.log(`[Allerion Digital Twin] Copilot API available at /api/copilot`);
});
