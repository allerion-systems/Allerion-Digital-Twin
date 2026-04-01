const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

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

app.listen(PORT, () => {
    console.log(`[Allerion Digital Twin] Core server instance running on port ${PORT}`);
    console.log(`[Allerion Digital Twin] Tool endpoints active. Ready to deploy anywhere.`);
});
