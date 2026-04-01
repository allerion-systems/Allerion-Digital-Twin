#!/bin/bash
cd "$(dirname "$0")"
echo "Starting Allerion Digital Twin locally..."
python3 -m http.server 8000 &
sleep 1
open http://localhost:8000
wait
